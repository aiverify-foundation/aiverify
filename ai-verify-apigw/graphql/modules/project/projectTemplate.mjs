"use strict";

import mongoose from "mongoose";
import { ProjectTemplateModel } from "#models";

const resolvers = {
  Query: {
    /**
     * Return list of projectTemplates
     * @returns Promise with Project[]
     */
    projectTemplates: (parent) => {
      return new Promise((resolve, reject) => {
        ProjectTemplateModel.find({ __t: null })
          .then((docs) => {
            resolve(docs);
          })
          .catch((err) => {
            console.log(err);
            let errorrMsg;
            if (err.message) {
              errorrMsg = err.message;
            }
            reject(
              "An error occured while fetching the projectTemplate - " +
                errorMsg
            );
          });
      });
    }, // projectTemplates
    /**
     * Return one projectTemplate
     * @param id - Project ID
     * @returns Promise with Project found, or reject if not found
     */
    projectTemplate: (parent, { id }) => {
      return new Promise((resolve, reject) => {
        ProjectTemplateModel.findById(id)
          .then((doc) => {
            if (!doc) return reject("Invalid ID");
            resolve(doc);
          })
          .catch((err) => {
            console.log(err);
            let errorrMsg;
            if (err.message) {
              errorrMsg = err.message;
            }
            reject(
              "An error occured while fetching the projectTemplate - " +
                errorMsg
            );
          });
      });
    }, // projectTemplate
  }, // Query
  Mutation: {
    /**
     * Create new projectTemplate from input.
     * @todo validate
     * @param projectTemplate - New projectTemplate data
     * @returns Promise with new Project data, including projectTemplate ID
     */
    createProjectTemplate: (parent, { projectTemplate }) => {
      console.debug("createProjectTemplate", projectTemplate);
      if (!projectTemplate.projectInfo.name) {
        return Promise.reject("Missing variable");
      }
      return new Promise((resolve, reject) => {
        ProjectTemplateModel.create(projectTemplate)
          .then((doc) => {
            resolve(doc);
          })
          .catch((err) => {
            console.log(err);
            let errorrMsg;
            if (err.message) {
              errorrMsg = err.message;
            }
            reject(
              "An error occured while creating projectTemplate - " + errorMsg
            );
          });
      });
    }, // createProjectTemplate
    /**
     * Delete projectTemplate.
     * @param id - Project ID
     * @returns Promise of ID of projectTemplate to delete.
     */
    deleteProjectTemplate: (parent, { id }) => {
      console.debug("deleteProjectTemplate", id);
      return new Promise((resolve, reject) => {
        ProjectTemplateModel.findByIdAndDelete(id)
          .then((result) => {
            if (!result) return reject("Invalid ID");
            resolve(id);
          })
          .catch((err) => {
            console.log(err);
          let errorrMsg;
          if (err.message) {
            errorrMsg = err.message
          }
          reject('An error occured while deleting the projectTemplate - ' + errorMsg);
          });
      });
    }, // deleteProjectTemplate
    /**
     * Update projectTemplate
     * @param id - Project ID
     * @param projectTemplate - projectTemplate data to update
     * @returns Promise of updated Project
     */
    updateProjectTemplate: (parent, { id, projectTemplate }) => {
      return new Promise((resolve, reject) => {
        ProjectTemplateModel.findById(id)
          .then(async (doc) => {
            if (!doc) return reject("Invalid ID");
            if (doc.fromPlugin) return reject("Template edit is not allowed");
            doc = Object.assign(doc, projectTemplate);
            doc = await doc.save();
            resolve(doc);
          })
          .catch((err) => {
            console.log(err);
          let errorrMsg;
          if (err.message) {
            errorrMsg = err.message
          }
          reject('An error occured while updating the projectTemplate - ' + errorMsg);
          });
      });
    }, // updateProjectTemplate
    /**
     * Make a copy of the projectTemplate
     * @param id - Project ID
     * @returns Promise of new cloned Project
     */
    cloneProjectTemplate: (parent, { id }) => {
      return new Promise((resolve, reject) => {
        ProjectTemplateModel.findById(id)
          .then((doc) => {
            if (!doc) return reject("Invalid ID");
            let newdoc = new ProjectTemplateModel(doc);
            newdoc._id = mongoose.Types.ObjectId();
            newdoc.fromPlugin = false;
            newdoc.projectInfo.name = `Copy of ${doc.projectInfo.name}`;
            // newdoc.inputBlockData = {};
            newdoc.isNew = true;
            newdoc.save().then((doc) => {
              resolve(doc);
            });
          })
          .catch((err) => {
            console.log(err);
          let errorrMsg;
          if (err.message) {
            errorrMsg = err.message
          }
          reject('An error occured while copying the projectTemplate - ' + errorMsg);
          });
      });
    }, // cloneProjectTemplate
  }, // Mutation
};

export default resolvers;
