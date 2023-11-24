"use strict";

/**
 * Worker thread module to subscripe Redis HSET and process status update. The Redis
 * server MUST be configured with "notify-keyspace-events Kh" in order to subscribe
 * to keyspace events.
 * @module lib/testEngineWorker
 */

import "dotenv/config.js";
import { parentPort } from "node:worker_threads";
import NodeCache from "node-cache";
import pubsub from "./apolloPubSub.mjs";
import fs from "node:fs";
import path from "path";
import fsPromises from "node:fs/promises";

import _ from "lodash";
import moment from "moment";
import { Validator } from "jsonschema";
const validator = new Validator();

// imp: need to import this to connect db
import db from "./mongodb.mjs";

import redisConnect from "./redisClient.mjs";
import { ReportModel, DatasetModel, ModelFileModel } from "#models";
import { getAlgorithmOutputSchema } from "#lib/plugin.mjs";
// import { DatasetModel } from "../models/dataset.model.mjs";

// need 2 connections, one for pub/sub, one for commands
const redis = redisConnect();
const redis2 = redisConnect();

function safeJSONParse(jstr) {
  if (!jstr) return null;
  try {
    return JSON.parse(jstr);
  } catch (err) {
    console.error("Invalid JSON string: %s", jstr);
    return null;
  }
}

/**
 * Process task HSET events.
 * @param {string} key - hset key
 */
const processEvent = (key) => {
  console.log("processEvent", key);
  redis2.hGetAll(key).then(async (values) => {
    // console.log("values", values);
    if (!values.type) return;
    if (values.type === "TaskResponse") {
      // console.error("TASK RESPONSE received is: ", values);
      const { testId, reportId } = values;
      if (!testId || !reportId) {
        // console.error("TaskResponse testId or reportId");
        redis2.del(key); // delete key
        return;
      }

      let doc;
      try {
        doc = await ReportModel.findById(reportId);
        // console.log("doc", doc.project.toString());
        let test = doc.tests.id(testId);
        if (!test) {
          throw "Test not found";
        }
        if (test.status === "Cancelled") {
          // throw "Test was cancelled, just delete key";
        } else if (values.status === "Success") {
          // console.debug("status success")
          // validate output
          const outputSchema = await getAlgorithmOutputSchema(values.gid);
          // console.log("outputSchema", outputSchema)
          const output = safeJSONParse(values.output);
          const res = validator.validate(output, outputSchema);
          if (!res.valid) {
            console.log("Test result does not match output schema");
            test.status = "Error";
            if (!test.errorMessages) test.errorMessages = [];
            test.errorMessages.push({
              severity: "warning",
              description: "Invalid test output",
            });
          } else {
            Object.assign(test, {
              status: values.status,
              progress: 100,
              timeStart: moment(values.startTime).toDate(),
              timeTaken: values.elapsedTime
                ? parseInt(values.elapsedTime)
                : null,
              output,
              logFile: values.logFile,
              errorMessages: safeJSONParse(values.errorMessages),
            });
          }
        } else {
          // console.debug("status not success")
          Object.assign(test, {
            status: values.status,
            progress: values.taskProgress,
            timeStart: moment(values.startTime).toDate(),
            // timeTaken: values.elapsedTime?parseInt(values.elapsedTime):null,
            logFile: values.logFile,
            errorMessages: safeJSONParse(values.errorMessages),
          });
        }
        // console.debug("save")
        doc = await doc.save();
        const payload = {
          ...test.toObject(),
          projectID: doc.project.toString(),
        };
        // console.log("payload", payload);
        pubsub.publish("TEST_TASK_UPDATED", {
          testTaskUpdated: payload,
        });
        // doc = await ReportModel.updateTestResult(reportId, testId, {
        //   status: values.status,
        //   progress: values.taskProgress,
        //   timeStart: moment(values.startTime).toDate(),
        //   timeTaken: values.elapsedTime?parseInt(values.elapsedTime):null,
        //   output: safeJSONParse(values.output),
        //   logFile: values.logFile,
        //   errorMessages: safeJSONParse(values.errorMessages),
        // });
      } catch (err) {
        console.error("Error updating test result: ", err);
        redis2.del(key); // delete key
        return;
      }

      // console.debug("Updated test results", doc)
      if (!doc) {
        console.error(`Test not found: report ${reportId} test ${testId}`);
        redis2.del(key); // delete key
        return;
      }
      // console.log("updated doc", doc);
      if (
        values.status === "Success" ||
        values.status === "Error" ||
        values.status === "Cancelled"
      ) {
        // delete key once task completed
        // console.log("delete key", key)
        redis2.del(key);
      }
      // check whether all tasks completed for this run
      let hasSuccess = false;
      let allDone = true;
      for (let test of doc.tests) {
        if (test.status === "Running" || test.status === "Pending") {
          allDone = false;
          break;
        } else if (test.status === "Success") {
          hasSuccess = true;
        }
      }
      // console.log("allDone", allDone, hasSuccess)
      if (allDone) {
        // compute time taken for test and update
        // console.debug("updaing report status", doc)
        let totalTimeTaken = doc.tests.reduce((acc, test) => {
          if (test.status === "Success") acc += test.timeTaken;
          return acc;
        }, 0);
        // console.log("allDone", hasSuccess)
        await ReportModel.findByIdAndUpdate(
          { _id: reportId },
          {
            $set: {
              totalTestTimeTaken: totalTimeTaken,
            },
          }
        );
        // inform parent test completed
        let msg = {
          type: "TaskResponse",
          msg: {
            status: hasSuccess ? "Success" : "Error",
            reportId,
          },
        };
        parentPort.postMessage(JSON.stringify(msg));
      }
    } // ToolboxResponse
  });
};

/**
 * Process service HSET events.
 * @param {string} key - hset key
 */
const processService = (key) => {
  redis2.hGetAll(key).then(async (values) => {
    if (!values.type) return;
    if (values.serviceType === "validateDataset") {
      const datasetId = values.datasetId;

      try {
        let doc = await DatasetModel.findById(datasetId);
        if (doc) {
          if (doc.status !== "Cancelled") {
            if (values.status === "done") {
              //logic to filter valid or invalid
              if (values.validationResult === "valid") {
                if (
                  values.columns &&
                  values.dataFormat &&
                  values.serializedBy &&
                  values.numRows &&
                  values.numCols &&
                  values.logFile
                ) {
                  let schema = safeJSONParse(values.columns);
                  // console.log("schema of ", datasetId," is: ")
                  // console.log(JSON.stringify(schema));
                  // if (!schema) {
                  //   console.log("values of ", datasetId," is: ")
                  //   console.log(JSON.stringify(values));
                  // }
                  let dataColumns = schema.map((e) => {
                    return {
                      name: e.name,
                      datatype: e.datatype,
                      label: e.name,
                    };
                  });

                  const updatedDoc = await DatasetModel.findByIdAndUpdate(
                    { _id: datasetId },
                    {
                      status: "Valid",
                      dataColumns: dataColumns,
                      numRows: values.numRows,
                      numCols: values.numCols,
                      serializer: values.serializedBy,
                      dataFormat: values.dataFormat,
                    },
                    { new: true }
                  );

                  redis2.exists(key).then((result) => {
                    if (result != 0) {
                      pubsub.publish("VALIDATE_DATASET_STATUS_UPDATED", {
                        validateDatasetStatusUpdated: updatedDoc.toObject(),
                      });
                      redis2.del(key);
                      return;
                    }
                  });
                }
              } else if (values.validationResult === "invalid") {
                // console.log("validationResult not valid", values);
                let message;
                if (values.logFile) {
                  const dataArray = safeJSONParse(values.errorMessages);
                  const errorCategory = "DATA_OR_MODEL_ERROR";
                  const errorDescription = dataArray.find(
                    (item) => item.category === errorCategory
                  )?.description;

                  if (errorDescription) message = errorDescription;
                }
                const updatedDoc = await DatasetModel.findByIdAndUpdate(
                  { _id: datasetId },
                  {
                    status: "Invalid",
                    errorMessages: message,
                  },
                  { new: true }
                );

                redis2.exists(key).then((result) => {
                  if (result != 0) {
                    pubsub.publish("VALIDATE_DATASET_STATUS_UPDATED", {
                      validateDatasetStatusUpdated: updatedDoc.toObject(),
                    });
                    deleteFile(updatedDoc.toObject().filePath);
                    redis2.del(key);
                    return;
                  }
                });
              }
            } else if (values.status === "error") {
              let message;
              if (values.logFile) {
                const dataArray = safeJSONParse(values.errorMessages);
                const errorCategory = "DATA_OR_MODEL_ERROR";
                const errorDescription = dataArray.find(
                  (item) => item.category === errorCategory
                )?.description;

                if (errorDescription) message = errorDescription;
              }
              let updatedDoc = await DatasetModel.findByIdAndUpdate(
                { _id: datasetId },
                {
                  status: "Error",
                  errorMessages: message,
                },
                { new: true }
              );

              redis2.exists(key).then((result) => {
                if (result != 0) {
                  pubsub.publish("VALIDATE_DATASET_STATUS_UPDATED", {
                    validateDatasetStatusUpdated: updatedDoc.toObject(),
                  });
                  deleteFile(updatedDoc.toObject().filePath);
                  redis2.del(key);
                  return;
                }
              });
            }
          }
        }
      } catch (err) {
        console.error(
          "Error updating dataset validation result for ",
          datasetId,
          ", error: ",
          err
        );
        redis2.del(key); // delete key
        return;
      }
    } else if (values.serviceType === "validateModel") {
      // console.log("modelresponse received: ", values)

      const modelFileId = values.modelFileId;

      try {
        let doc = await ModelFileModel.findById(modelFileId);
        if (doc) {
          if (doc.status !== "Cancelled") {
            if (values.status === "done") {
              if (values.validationResult === "valid") {
                if (values.modelFormat && values.serializedBy) {
                  let updatedDoc = await ModelFileModel.findByIdAndUpdate(
                    { _id: modelFileId },
                    {
                      status: "Valid",
                      serializer: values.serializedBy,
                      modelFormat: values.modelFormat,
                    },
                    { new: true }
                  );

                  redis2.exists(key).then((result) => {
                    if (result != 0) {
                      pubsub.publish("VALIDATE_MODEL_STATUS_UPDATED", {
                        validateModelStatusUpdated: updatedDoc.toObject(),
                      });
                      redis2.del(key);
                      return;
                    }
                  });
                }
              } else if (values.validationResult === "invalid") {
                let message;
                if (values.logFile) {
                  const dataArray = safeJSONParse(values.errorMessages);
                  const errorCategory = "DATA_OR_MODEL_ERROR";
                  const errorDescription = dataArray.find(
                    (item) => item.category === errorCategory
                  )?.description;

                  if (errorDescription) message = errorDescription;
                }
                let updatedDoc = await ModelFileModel.findByIdAndUpdate(
                  { _id: modelFileId },
                  {
                    status: "Invalid",
                    errorMessages: message,
                  },
                  { new: true }
                );

                redis2.exists(key).then((result) => {
                  if (result != 0) {
                    pubsub.publish("VALIDATE_MODEL_STATUS_UPDATED", {
                      validateModelStatusUpdated: updatedDoc.toObject(),
                    });
                    deleteFile(updatedDoc.toObject().filePath);
                    redis2.del(key);
                    return;
                  }
                });
              }
            } else if (values.status === "error") {
              let message;
              if (values.logFile) {
                const dataArray = safeJSONParse(values.errorMessages);
                const errorCategory = "DATA_OR_MODEL_ERROR";
                const errorDescription = dataArray.find(
                  (item) => item.category === errorCategory
                )?.description;

                if (errorDescription) message = errorDescription;
              }
              let updatedDoc = await ModelFileModel.findByIdAndUpdate(
                { _id: modelFileId },
                {
                  status: "Error",
                  errorMessages: message,
                },
                { new: true }
              );

              redis2.exists(key).then((result) => {
                if (result != 0) {
                  pubsub.publish("VALIDATE_MODEL_STATUS_UPDATED", {
                    validateModelStatusUpdated: updatedDoc.toObject(),
                  });
                  deleteFile(updatedDoc.toObject().filePath);
                  redis2.del(key);
                  return;
                }
              });
            }
          }
        }
      } catch (err) {
        console.error(
          "Error updating model validation result for ",
          modelFileId,
          ", error: ",
          err
        );
        redis2.del(key);
        return;
      }
    }
  });
};

// Delete invalid files from fs, record to remain in db
const deleteFile = (file) => {
  try {
    // console.log("Deleting invalid file: ", file)
    if (file) {
      var filePath = file;
      if (!fs.existsSync(filePath)) {
        // console.log("File does not exist")
      } else {
        let stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          console.log("Removing dir %s", filePath);
          try {
            fs.rmSync(filePath, {
              recursive: true,
              force: true,
            });
          } catch (err) {
            console.log("rm dir error", err);
          }
        } else {
          console.log("Removing file %s", filePath);
          fsPromises.unlink(filePath);
        }
      }
    } else {
      console.log("filePath is empty");
    }
  } catch (err) {
    console.error("delete err: ", err);
  }
};

// create cache to auto expire keys
let myJobs = new NodeCache({ stdTTL: 900 });

/**
 * Scan redis HSET keys to check for unprocessed task updates.
 */
redis2.keys("task:*").then((keys) => {
  // if (keys && keys.length > 0)
  //   logger.debug("keys to update: %o", keys);
  for (let key of keys) {
    processEvent(key);
  }
});

redis2.keys("service:*").then((keys) => {
  // if (keys && keys.length > 0)
  //   logger.debug("keys to update: %o", keys);
  for (let key of keys) {
    processService(key);
  }
});

/**
 * Subscribe to keychange notifications and process key updates.
 */
redis.pSubscribe("__key*__:*", (event, channel) => {
  // console.log("key received : %o %o", event, channel);

  const key = channel.replace("__keyspace@0__:", "");
  if (key.includes("service:")) {
    // debounce events so that don't have excessive updates
    if (!myJobs.has(key)) {
      myJobs.set(key, _.debounce(processService, 1000));
    }
    myJobs.get(key)(key);
  } else if (key.includes("task:")) {
    // debounce events so that don't have excessive updates
    if (!myJobs.has(key)) {
      myJobs.set(key, _.debounce(processEvent, 1000));
    }
    myJobs.get(key)(key);
  }
});
