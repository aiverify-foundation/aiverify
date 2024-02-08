"use strict";
/**
 * Test job queue module
 * @module lib/testJobQueue
 */

import * as _ from "lodash";
import moment from "moment";
import { Worker } from "node:worker_threads";
import { cwd } from "node:process";
import path from "node:path";

import redisConnect from "./redisClient.mjs";
const redis = redisConnect();
import { generateReport } from "./report.mjs";

var worker = new Worker("./lib/testEngineWorker.mjs");

const redisQueueName = "TestEngineTask"; //rename to redisTaskQueue?
const redisServiceQueue = "TestEngineService";
const redisCancelTopic = "task.cancel";

// exports.redis = redis;

// handle events from workers

/** Handle errors from workers */
worker.on("error", (error) => {
  console.error("worker error: %s", error);
});

/** Handle unexpected worker exit */
worker.on("exit", (exitCode) => {
  console.error(`Worker exited with code ${exitCode}`);
});

/** receive msg when all report tests finish running */
worker.on("message", async (msg) => {
  try {
    const resp = JSON.parse(msg);
    // console.debug(`Report message`, resp);
    if (!resp.type) return;
    if (resp.type === "TaskResponse") {
      await generateReport(resp.msg.reportId);
    } else if (resp.type === "ServiceResponse") {
      console.log("Message received is: ", resp.msg);
      return;
    }
  } catch (err) {
    console.error("worker message error: ", err);
  }
});

/**
 * Update TestRun collection.
 * @param {string} reportId - Report id
 * @param {object} update - object values to update
 * @return {Promise} Mongoose Query
 */
function updateReport(reportId, update) {
  // logger.debug("updateTestRun %s %o", id, update)
  return TestRun.findByIdAndUpdate({ _id: reportId }, { $set: update });
}

/**
 * Add the tests defined in the test runs objects to the job queue. Tests that are marked
 * to be skipped are skipped.
 * @param report - Report object including the tests to run
 */
export const queueTests = async (report, modelAndDatasets) => {
  // console.log("modelAndDatasets", modelAndDatasets);

  if (
    !modelAndDatasets ||
    !modelAndDatasets.testDataset ||
    !modelAndDatasets.model
  )
    throw new Error("Missing model and dataset information");

  const reportId = report._id.toString();

  const modelType = modelAndDatasets.model.type;
  const mode = modelType === "API" ? "api" : "upload";
  if (mode === "api") {
    if (!modelAndDatasets.model.modelAPI) {
      throw new Error("Missing modelAPI information");
    }
    if (!modelAndDatasets.apiConfig) {
      throw new Error("Missing apiConfig information");
    }
  } else {
    if (!modelAndDatasets.model.filePath) {
      throw new Error("Missing filePath information");
    }
  }

  // const mode = testRun.scenario.mode;
  let commonProperties = {
    mode,
  };

  for (let test of report.tests) {
    // console.log("test", test);
    const id = `${reportId}-${test._id}`;
    const taskId = `task:${id}`;
    let task = {
      ...commonProperties,
      id: taskId,
      algorithmId: "algo:" + test.algorithmGID,
      algorithmArgs: test.testArguments,
    };

    task.testDataset = modelAndDatasets.testDataset.filePath;
    task.modelType = modelAndDatasets.model.modelType.toLowerCase();
    if (mode === "api") {
      const modelAPI = modelAndDatasets.model.modelAPI.toObject();
      const apiConfig = {
        ...modelAndDatasets.apiConfig.toObject(),
        requestConfig: modelAPI.requestConfig,
        responseBody: modelAPI.response,
      };
      delete apiConfig._id; // remove this field not required
      if (modelAPI.authType !== "No Auth") {
        apiConfig["authentication"] = modelAPI.authTypeConfig;
      }
      // fix for parameters populated as null for a POST config.
      if (apiConfig.parameters === null) {
        delete modelAPI.parameters;
      }
      task.apiConfig = apiConfig;
      task.apiSchema = await modelAndDatasets.model.exportModelAPI();
    } else {
      task.modelFile = modelAndDatasets.model.filePath;
    }

    if (modelAndDatasets.groundTruthDataset) {
      task.groundTruthDataset = modelAndDatasets.groundTruthDataset.filePath;
    }
    if (modelAndDatasets.groundTruthColumn) {
      task.groundTruth = modelAndDatasets.groundTruthColumn;
    }

    // console.log("Add task", task)
    // logger.debug("queue add %s %o", id, task);
    // set some initial parameters for the task
    await Promise.all([
      redis.hSet(taskId, "status", "Pending"),
      redis.hSet(taskId, "type", "TaskResponse"),
      redis.hSet(taskId, "testId", test._id.toString()),
      redis.hSet(taskId, "reportId", reportId),
      redis.hSet(taskId, "gid", test.algorithmGID),
    ]);
    console.debug(`XADD ${redisQueueName} * task '${JSON.stringify(task)}'`);
    await redis.xAdd(redisQueueName, "*", { task: JSON.stringify(task) });
    // worker.postMessage({task});
  }
};

/**
 * @todo Implement job cancellation
 */
export const cancelTestRun = async (report, test) => {
  const taskId = `task:${report._id}-${test._id}`;
  if (test.status === "Pending") {
    // just delete redis
    await redis.publish(redisCancelTopic, taskId);
    await redis.del(taskId); // delete key
  } else {
    // job running
    await redis.publish(redisCancelTopic, taskId);
    await Promise.all([redis.hSet(taskId, "status", "Cancelled")]);
  }
};

/**
 * Add the dataset object to the service queue.
 * @param dataset - Dataset object
 */
export const queueDataset = async (dataset) => {
  const serviceId = `service:${dataset.id}`;
  let service = {
    serviceId: serviceId,
    filePath: dataset.filePath,
  };

  await Promise.all([
    redis.hSet(serviceId, "status", "Pending"),
    redis.hSet(serviceId, "type", "ServiceResponse"),
    redis.hSet(serviceId, "serviceType", "validateDataset"),
    redis.hSet(serviceId, "datasetId", dataset.id),
  ]);
  console.debug(
    `XADD ${redisServiceQueue} * validateDataset '${JSON.stringify(service)}'`
  );
  await redis.xAdd(redisServiceQueue, "*", {
    validateDataset: JSON.stringify(service),
  });
};

/**
 * Add the dataset object to the service queue.
 * @param modelFile - ModelFile object
 */
export const queueModel = async (modelFile) => {
  const serviceId = `service:${modelFile.id}`;
  let service = {
    serviceId: serviceId,
    mode: "upload",
    filePath: modelFile.filePath,
  };
  console.debug("Add model validation service: %o", service);
  await Promise.all([
    redis.hSet(serviceId, "status", "Pending"),
    redis.hSet(serviceId, "type", "ServiceResponse"),
    redis.hSet(serviceId, "serviceType", "validateModel"),
    redis.hSet(serviceId, "modelFileId", modelFile.id),
  ]);
  console.debug(
    `XADD ${redisServiceQueue} * validateModel '${JSON.stringify(service)}'`
  );
  await redis.xAdd(redisServiceQueue, "*", {
    validateModel: JSON.stringify(service),
  });
};

export const shutdown = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await worker.terminate();
      await redis.quit();
    } catch (e) {
    } finally {
      resolve();
    }
  });
};
