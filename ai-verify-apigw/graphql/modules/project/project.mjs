"use strict";

import { withFilter } from "graphql-subscriptions";
import moment from "moment";
// import { Validator } from 'jsonschema';
// const validator = new Validator();

import mongoose from "mongoose";
import { ProjectModel, ReportModel, ProjectTemplateModel } from "#models";
import { getAlgorithm, getAlgorithmInputSchema } from "#lib/plugin.mjs";
import { queueTests, cancelTestRun } from "#lib/testEngineQueue.mjs";
import pubsub from "#lib/apolloPubSub.mjs";
import { generateReport } from "#lib/report.mjs";
import { GraphQLError } from "graphql";
import { graphqlErrorHandler } from "../errorHandler.mjs";

const resolvers = {
  Query: {
    /**
     * Return list of projects
     * @returns Promise with Project[]
     */
    projects: (parent) => {
      return new Promise((resolve, reject) => {
        ProjectModel.find({ __t: "ProjectModel" })
          .populate("report")
          .populate("template")
          .then((docs) => {
            const results = docs.map((doc) => {
              if (doc.report) doc.report.projectID = doc._id;
              return doc;
            });
            resolve(results);
          })
          .catch((err) => graphqlErrorHandler(err, 'An error occured while fetching projects', reject));
      });
    }, // projects
    projectsByTextSearch: async (parent, { text }) => {
      try {
        const promisedDocs = ProjectModel.find({ $text: { $search: text } });
        promisedDocs.populate("report");
        promisedDocs.populate("template");
        const docs = await promisedDocs;
        const result = docs.map((doc) => {
          if (doc.report) doc.report.projectID = doc._id;
          return doc;
        });
        return result;
      } catch (err) {
        graphqlErrorHandler(err, 'An error occured while searching projects', reject);
      }
    },
    /**
     * Return one project
     * @param id - Project ID
     * @returns Promise with Project found, or reject if not found
     */
    project: (parent, { id }) => {
      return new Promise((resolve, reject) => {
        ProjectModel.findById(id)
          .populate("report")
          .populate("template")
          .then((doc) => {
            if (!doc) return reject("Invalid ID");
            if (doc.report) {
              doc.report.projectID = id;
            }
            resolve(doc);
          })
          .catch((err) => graphqlErrorHandler(err, 'An error occured while fetching the project', reject));
      });
    }, // project
    /**
     * Return report of a project
     * @param projectID - Project ID
     * @returns Promise with Report found, or reject if not found
     */
    report: (parent, { projectID }) => {
      return new Promise(async (resolve, reject) => {
        const report = await ReportModel.findOne({
          project: projectID,
        }).populate("projectSnapshot");
        if (report) {
          report.projectID = projectID;
          await report.populate("projectSnapshot.modelAndDatasets.model");
          await report.populate("projectSnapshot.modelAndDatasets.testDataset");
          await report.populate(
            "projectSnapshot.modelAndDatasets.groundTruthDataset"
          );
          if (report.tests) {
            for (let test of report.tests) {
              const algo = await getAlgorithm(test.algorithmGID);
              if (!algo || !algo.gid) {
                return reject("Invalid algo");
              }
              test.algorithm = algo;
            }
          }
          resolve(report);
        } else reject("Invalid project ID");
      });
    }, // report
  }, // Query
  Mutation: {
    /**
     * Create new project from input.
     * @todo validate
     * @param project - New project data
     * @returns Promise with new Project data, including project ID
     */
    createProject: (parent, { project }) => {
      console.debug("createProject", project);
      if (!project.projectInfo.name) {
        return Promise.reject("Missing variable");
      }
      return new Promise((resolve, reject) => {
        ProjectModel.create(project)
          .then((doc) => {
            resolve(doc);
          })
          .catch((err) => graphqlErrorHandler(err, 'An error occured while creating the project', reject));
      });
    }, // createProject
    /**
     * Create new project from template.
     * @todo validate
     * @param project - New project data
     * @returns Promise with new Project data, including project ID
     */
    createProjectFromTemplate: (parent, { project, templateId }) => {
      return new Promise(async (resolve, reject) => {
        ProjectTemplateModel.findById(templateId)
          .then((template) => {
            const newProject = {
              ...template.toObject(),
              _id: new mongoose.Types.ObjectId(),
              template: template._id,
              projectInfo: project.projectInfo,
            };
            ProjectModel.create(newProject)
              .then((doc) => {
                resolve(doc);
              })
              .catch((err) => graphqlErrorHandler(err, 'An error occured while creating the project from template', reject));
          })
          .catch((e) => {
            reject("Invalid project template id");
          });
      });
    }, // createProject
    /**
     * Delete project.
     * @param id - Project ID
     * @returns Promise of ID of project to delete.
     */
    deleteProject: (parent, { id }) => {
      console.debug("deleteProject", id);
      return new Promise((resolve, reject) => {
        ProjectModel.findByIdAndDelete(id)
          .then((result) => {
            if (!result) return reject("Invalid ID");
            resolve(id);
          })
          .catch((err) => graphqlErrorHandler(err, 'An error occured while deleting the project', reject))
      });
    }, // deleteProject
    /**
     * Update project
     * @param id - Project ID
     * @param project - project data to update
     * @returns Promise of updated Project
     */
    updateProject: (parent, { id, project }) => {
      return new Promise(async (resolve, reject) => {
        try {
          const modelAndDatasets = project.modelAndDatasets;
          if (modelAndDatasets) {
            if (modelAndDatasets.modelId) {
              modelAndDatasets.model = new mongoose.Types.ObjectId(
                modelAndDatasets.modelId
              );
              delete modelAndDatasets.modelId;
            }
            if (modelAndDatasets.testDatasetId) {
              modelAndDatasets.testDataset = new mongoose.Types.ObjectId(
                modelAndDatasets.testDatasetId
              );
              delete modelAndDatasets.testDatasetId;
            }
            if (modelAndDatasets.groundTruthDatasetId) {
              modelAndDatasets.groundTruthDataset = new mongoose.Types.ObjectId(
                modelAndDatasets.groundTruthDatasetId
              );
              delete modelAndDatasets.groundTruthDatasetId;
            }
          }
          const doc = await ProjectModel.findByIdAndUpdate(id, project, {
            new: true,
          });
          await doc.populate("report");
          await doc.populate("template");
          await doc.populate("modelAndDatasets.model");
          await doc.populate("modelAndDatasets.testDataset");
          await doc.populate("modelAndDatasets.groundTruthDataset");
          resolve(doc);
        } catch (err) {
          graphqlErrorHandler(err, 'An error occured while updating the project', reject);
        }
      });
    }, // updateProject
    /**
     * Make a copy of the project
     * @param id - Project ID
     * @returns Promise of new cloned Project
     */
    cloneProject: (parent, { id }) => {
      return new Promise((resolve, reject) => {
        ProjectModel.findById(id)
          .then((doc) => {
            if (!doc) return reject("Invalid ID");
            let newdoc = new ProjectModel(doc);
            newdoc._id = new mongoose.Types.ObjectId();
            newdoc.fromPlugin = false;
            newdoc.projectInfo.name = `Copy of ${doc.projectInfo.name}`;
            newdoc.report = null;
            newdoc.isNew = true;
            newdoc.save().then((doc) => {
              resolve(doc);
            });
          })
          .catch((err) => graphqlErrorHandler(err, 'An error occured while cloning the project', reject));
      });
    }, // cloneProject
    /**
     * Make a copy of the project
     * @param id - Project ID
     * @returns Promise of new cloned Project
     */
    saveProjectAsTemplate: (parent, { projectId, templateInfo }) => {
      return new Promise((resolve, reject) => {
        ProjectModel.findById(projectId)
          .then((doc) => {
            if (!doc) return reject("Invalid ID");
            let newdoc = {
              ...doc.toObject(),
              _id: new mongoose.Types.ObjectId(),
              projectInfo: templateInfo,
              fromPlugin: false,
            };
            delete newdoc.template;
            delete newdoc.report;
            delete newdoc.inputBlockData;
            delete newdoc.testInformationData;
            delete newdoc.__t;
            newdoc.isNew = true;
            ProjectTemplateModel.create(newdoc)
              .then((doc) => {
                resolve(doc);
              })
              .catch((err) => graphqlErrorHandler(err, 'An error occured while saving project as template', reject))
          })
          .catch((err) => {
            reject(err);
          });
      });
    }, // cloneProject
    /**
     * Generate report
     * @param projectID - Project ID
     * @param algorithms - List of algorithms to run
     * @returns Promise of updated Project
     */
    generateReport: (parent, { projectID, algorithms }) => {
      console.debug("generateReport", projectID, algorithms);
      return new Promise(async (resolve, reject) => {
        let proj = await ProjectModel.findById(projectID).populate("report");
        if (!proj) return reject("Invalid project ID");
        if (
          proj.report &&
          (proj.report.status === "GeneratingReport" ||
            proj.report.status === "RunningTests")
        )
          return reject("Previous report generation still running");
        let reportObj = {
          project: proj._id,
          projectSnapshot: proj,
          timeStart: moment().toDate(),
          timeTaken: 0,
          totalTestTimeTaken: 0,
          inputBlockData: proj.inputBlockData,
        };

        if (algorithms && algorithms.length > 0 && proj.testInformationData) {
          let tests = [];
          for (const gid of algorithms) {
            const inputSchema = await getAlgorithmInputSchema(gid);
            if (Object.keys(inputSchema) === 0) {
              console.log("Invalid GID");
              continue;
            }
            let test = proj.testInformationData.find(
              (e) => e.algorithmGID === gid
            );
            if (!test) {
              test = {
                algorithmGID: gid,
                testArguments: {},
              };
              if (!ProjectModel.isTestArgumentsValid(test)) {
                console.log("Invalid arguments for algo", gid);
                continue;
              }
              proj.testInformationData.push(test);
              proj = await proj.save();
            } else {
              if (!ProjectModel.isTestArgumentsValid(test)) {
                console.log("Invalid arguments for algo", gid);
                continue;
              }
            }
            let obj = {
              algorithmGID: gid,
              testArguments: test.testArguments,
              status: "Pending",
              progress: 0,
            };
            tests.push(obj);
          }
          reportObj.tests = tests;
        } else {
          // no tests to run, just generate
        }
        const needToRunTests = reportObj.tests && reportObj.tests.length > 0;
        const modelAndDatasets = proj.modelAndDatasets;
        if (
          needToRunTests &&
          (!modelAndDatasets ||
            !modelAndDatasets.model ||
            !modelAndDatasets.testDataset)
        ) {
          return reject("No model and test dataset defined");
        }
        reportObj.status = needToRunTests ? "RunningTests" : "GeneratingReport";
        if (proj.report) {
          // has existing report object
          const reportId = proj.report._id;
          const doc = await ReportModel.findByIdAndUpdate(reportId, reportObj, {
            new: true,
          });
          try {
            if (needToRunTests) {
              await queueTests(doc, modelAndDatasets);
            } else {
              await generateReport(reportId);
            }
            doc.projectID = proj._id;
            resolve(doc);
          } catch (err) {
            doc.status = "ReportError";
            await doc.save();
            reject(err);
          }
        } else {
          // create new report object
          const report = new ReportModel(reportObj);
          const newDoc = await report.save();
          newDoc.projectID = proj._id;
          proj.report = newDoc._id;
          await proj.save();
          try {
            if (needToRunTests) {
              await queueTests(newDoc, modelAndDatasets);
            } else {
              await generateReport(newDoc._id);
            }
            resolve(newDoc);
          } catch (err) {
            newDoc.status = "ReportError";
            await newDoc.save();
            reject(err);
          }
        }
      });
    }, // generateReport
    /**
     * Cancel tests that are running during report generation
     * @param projectID - Project ID
     * @param algorithms - List of algorithms to cancel
     * @returns Promise of updated Project
     */
    cancelTestRuns: (parent, { projectID, algorithms }) => {
      // console.debug("updateProject", id, JSON.stringify(project,null,2));
      return new Promise(async (resolve, reject) => {
        let report = await ReportModel.findOne({ project: projectID });
        if (!report) return reject("Report not found");
        if (
          report.status != "GeneratingReport" &&
          report.status != "RunningTests"
        )
          return reject("Report is not generating");
        const tasks = report.tests;
        let numUpdates = 0;
        for (let algorithmGID of algorithms) {
          const test = tasks.find((e) => e.algorithmGID === algorithmGID);
          if (test) {
            if (test.status === "Pending") {
              await cancelTestRun(report, test);
              numUpdates++;
              test.status = "Cancelled";
            } else if (test.status === "Running") {
              await cancelTestRun(report, test);
              numUpdates++;
              // TOD: send job cancellation
              test.status = "Cancelled";
            }
          }
        }
        let isRunning = false;
        for (let task of tasks) {
          if (task.status === "Pending" || task.status === "Running") {
            isRunning = true;
            break;
          }
        }
        // check if no more jobs running
        if (!isRunning) {
          numUpdates++;
          // report.status = "ReportGenerated";
        }
        if (numUpdates > 0) report = await report.save();
        // TODO: Generate report anyway, with input blocks
        report.projectID = projectID;
        report = await report.save();
        if (!isRunning) {
          generateReport(report._id);
        }
        resolve(report);
      });
    }, // generateReport
  }, // Mutation
  Subscription: {
    testTaskUpdatedNoFilter: {
      resolve: (payload) => payload.testTaskUpdated,
      subscribe: () => pubsub.asyncIterator(["TEST_TASK_UPDATED"]),
    },
    testTaskUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["TEST_TASK_UPDATED"]),
        (payload, variables) => {
          return payload.testTaskUpdated.projectID === variables.projectID;
        }
      ),
    },
    reportStatusUpdatedNoFilter: {
      resolve: (payload) => {
        const updated = payload.reportStatusUpdated;
        updated.projectID = updated.project;
        return updated;
      },
      subscribe: () => pubsub.asyncIterator(["REPORT_STATUS_UPDATED"]),
    },
    reportStatusUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["REPORT_STATUS_UPDATED"]),
        (payload, variables) => {
          return payload.reportStatusUpdated.project === variables.projectID;
        }
      ),
    },
  }, // Subscription
};

export default resolvers;
