import {jest} from '@jest/globals';
import casual from '#testutil/mockData.mjs';

describe("Test module testEngineWorker.mjs", () => {
  let redis;
  let testEngineWorker;
  let plugin;
  let pubsub;
  let parentPort = jest.fn();
  let pSubscribeCallback;
  let ReportModel;
  let reportData;
  const key = "task:63b3f9764326cf3aa1ffd2ed-63b637da0ddd17d140912582";

  let DatasetModel;
  let datasetData;
  let cancelledDatasetData;
  let ModelFileModel;
  let modelData;
  let cancelledModelData;

  beforeAll(async() => {
    // mocking
    jest.unstable_mockModule("node:worker_threads", () => {
      const worker_threads = jest.createMockFromModule('node:worker_threads');
      return {
        __esModule: true,
        default: worker_threads,
        parentPort: {
          postMessage: jest.fn(),
        }
      }
    });
    jest.unstable_mockModule("lodash", () => {
      const def = {
        debounce: jest.fn(fn => fn),
      }
      return {
        __esModule: true,
        default: def,
        ...def,
      }
    });
    jest.unstable_mockModule("#lib/redisClient.mjs", () => {
      return import("#mocks/lib/redisClient.mjs");
    });
    const redisConnect = await import('#lib/redisClient.mjs');
    redis = redisConnect.default();
    jest.unstable_mockModule("#lib/plugin.mjs", () => {
      return import("#mocks/lib/plugin.mjs");
    });
    plugin = await import("#lib/plugin.mjs");
    jest.unstable_mockModule("#lib/apolloPubSub.mjs", () => {
      return import("#mocks/lib/apolloPubSub.mjs");
    });
    pubsub = await import("#lib/apolloPubSub.mjs");

    const models = await import("#models");
    ReportModel = models.ReportModel;
    const ProjectModel = models.ProjectModel;
    let projectMock = casual.project;
    const projectDoc = new ProjectModel(projectMock);
    const projectData = await projectDoc.save();
    const doc = new ReportModel(casual.report(projectData, "RunningTests"));
    reportData = await doc.save();

    DatasetModel = models.DatasetModel;
    const datasetDoc = new DatasetModel({filePath: 'test/file/path/mockdata.sav', name: 'mock dataset', filename: 'mock dataset'});
    datasetData = await datasetDoc.save();
    const cancelledDatasetDoc = new DatasetModel({filePath: 'test/file/path/mockdata.sav', name: 'mock dataset', filename: 'mock dataset', status: 'Cancelled'});
    cancelledDatasetData = await cancelledDatasetDoc.save();

    ModelFileModel = models.ModelFileModel;
    const modelDoc = new ModelFileModel({filePath: 'test/file/path/mockdata.sav', name: 'mock model', filename: 'mock model'});
    modelData = await modelDoc.save();
    const cancelledModelDoc = new DatasetModel({filePath: 'test/file/path/mockdata.sav', name: 'mock dataset', filename: 'mock dataset', status: 'Cancelled'});
    cancelledModelData = await cancelledModelDoc.save();
    
    redis.keys.mockResolvedValue([]);
    testEngineWorker = await import("#lib/testEngineWorker.mjs");
    const call = redis.pSubscribe.mock.lastCall;
    expect(call).toBeDefined();
    pSubscribeCallback = call[1];
  })

  afterAll(async () => {
    jest.clearAllMocks();
  })

  it("should process TaskResponse with status Running", async() => {
    const resp = {
      testId: reportData.tests[0]._id.toString(),
      reportId: reportData._id.toString(),
      type: 'TaskResponse',
      status: 'Running',
      taskProgress: 0,
      startTime: casual.moment.toISOString(),
      logFile: 'testlog.log',
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:${key}`)
    await new Promise((r) => setTimeout(r, 500));
    // check updated
    const updatedDoc = await ReportModel.findById(reportData._id);
    const test = updatedDoc.tests[0];
    expect(test.status).toBe(resp.status);
    expect(test.progress).toBe(resp.taskProgress);
    expect(test.timeStart.toISOString()).toBe(resp.startTime);
    expect(test.logFile).toBe(resp.logFile);
    // check published
    expect(redis.del).not.toHaveBeenCalled();
    expect(pubsub.default.publish).toHaveBeenCalled();
    const call = pubsub.default.publish.mock.lastCall;
    expect(call[0]).toBe('TEST_TASK_UPDATED')
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should process TaskResponse with progress update", async() => {
    const resp = {
      testId: reportData.tests[0]._id.toString(),
      reportId: reportData._id.toString(),
      type: 'TaskResponse',
      status: 'Running',
      taskProgress: 50,
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:${key}`)
    await new Promise((r) => setTimeout(r, 500));
    // check updated
    const updatedDoc = await ReportModel.findById(reportData._id);
    const test = updatedDoc.tests[0];
    expect(test.progress).toBe(resp.taskProgress);
    // check published
    // expect(redis.del).not.toHaveBeenCalled();
    expect(pubsub.default.publish).toHaveBeenCalled();
    const call = pubsub.default.publish.mock.lastCall;
    expect(call[0]).toBe('TEST_TASK_UPDATED')
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should set test status to Error with invalid response output", async() => {
    const algo = casual.algorithm;
    const resp = {
      testId: reportData.tests[0]._id.toString(),
      reportId: reportData._id.toString(),
      type: 'TaskResponse',
      status: 'Success',
      taskProgress: 100,
      elapsedTime: 5,
      output: JSON.stringify({}),
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:${key}`)
    await new Promise((r) => setTimeout(r, 500));
    // check updated
    const updatedDoc = await ReportModel.findById(reportData._id);
    const test = updatedDoc.tests[0];
    expect(test.status).toBe("Error");
    // check published
    // expect(redis.del).not.toHaveBeenCalled();
    expect(pubsub.default.publish).toHaveBeenCalled();
    const call = pubsub.default.publish.mock.lastCall;
    expect(call[0]).toBe('TEST_TASK_UPDATED')
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should process TaskResponse with success update", async() => {
    const algo = casual.algorithm;
    const resp = {
      testId: reportData.tests[0]._id.toString(),
      reportId: reportData._id.toString(),
      type: 'TaskResponse',
      status: 'Success',
      taskProgress: 100,
      elapsedTime: 5,
      output: JSON.stringify(algo.data),
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:${key}`)
    await new Promise((r) => setTimeout(r, 500));
    // check updated
    const updatedDoc = await ReportModel.findById(reportData._id);
    const test = updatedDoc.tests[0];
    expect(test.status).toBe(resp.status);
    expect(test.progress).toBe(resp.taskProgress);
    expect(test.timeTaken).toBe(resp.elapsedTime);
    expect(test.output).toEqual(algo.data);
    // check published
    // expect(redis.del).not.toHaveBeenCalled();
    expect(pubsub.default.publish).toHaveBeenCalled();
    const call = pubsub.default.publish.mock.lastCall;
    expect(call[0]).toBe('TEST_TASK_UPDATED')
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should process TaskResponse with cancel update", async() => {
    const resp = {
      testId: reportData.tests[0]._id.toString(),
      reportId: reportData._id.toString(),
      type: 'TaskResponse',
      status: 'Cancelled',
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:${key}`)
    await new Promise((r) => setTimeout(r, 500));
    // check updated
    const updatedDoc = await ReportModel.findById(reportData._id);
    const test = updatedDoc.tests[0];
    expect(test.status).toBe(resp.status);
    // check published
    // expect(redis.del).not.toHaveBeenCalled();
    expect(pubsub.default.publish).toHaveBeenCalled();
    const call = pubsub.default.publish.mock.lastCall;
    expect(call[0]).toBe('TEST_TASK_UPDATED')
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should not process validateDataset ServiceResponse if dataset status is cancelled", async() => {
    redis.exists.mockResolvedValue(1);
    const resp = {
      type: 'ServiceResponse',
      serviceType: 'validateDataset',
      datasetId: cancelledDatasetData._id.toString(),
      status: 'done',
      validationResult: 'valid',
      serializedBy: 'pickle',
      dataFormat: 'pandas',
      columns: '[{"name": "age_cat_cat", "datatype": "int64"}, {"name": "sex_code", "datatype": "int64"}]',
      numRows: '1235',
      numCols: '2',
      logFile: 'testlog.log',
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:service:${cancelledDatasetData._id.toString()}`)
    await new Promise((r) => setTimeout(r, 500));
    // check updated
    const updatedDoc = await DatasetModel.findById(cancelledDatasetData._id);
    expect(updatedDoc.status).toBe('Cancelled');

    // check published
    expect(pubsub.default.publish).not.toHaveBeenCalled();
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should not process validateModel ServiceResponse if dataset status is cancelled", async() => {
    redis.exists.mockResolvedValue(1);
    const resp = {
      type: 'ServiceResponse',
      serviceType: 'validateModel',
      modelFileId: cancelledModelData._id.toString(),
      status: 'done',
      validationResult: 'valid',
      serializedBy: 'joblib',
      modelFormat: 'sklearn',
      logFile: 'testlog.log',
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:service:${cancelledModelData._id.toString()}`)
    await new Promise((r) => setTimeout(r, 500));
    // check updated
    
    const updatedDoc = await DatasetModel.findById(cancelledModelData._id);
    expect(updatedDoc.status).toBe('Cancelled');

    // check published
    expect(pubsub.default.publish).not.toHaveBeenCalled();
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should process validateDataset ServiceResponse and update dataset (valid)", async() => {
    redis.exists.mockResolvedValue(1);
    const resp = {
      type: 'ServiceResponse',
      status: 'done',
      validationResult: 'valid',
      serializedBy: 'pickle',
      dataFormat: 'pandas',
      columns: '[{"name": "age_cat_cat", "datatype": "int64"}, {"name": "sex_code", "datatype": "int64"}]',
      numRows: 1235,
      numCols: 2,
      serviceType: 'validateDataset',
      datasetId: datasetData._id.toString(),
      logFile: 'testlog.log',
    }
    
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:service:${datasetData._id.toString()}`)
    await new Promise((r) => setTimeout(r, 500));
    const updatedDoc = await DatasetModel.findById(datasetData._id);
    //check updated
    expect(updatedDoc.status).toBe('Valid');
    expect(updatedDoc.numRows).toBe(1235);
    expect(updatedDoc.numCols).toBe(2);
    expect(updatedDoc.serializer).toBe('pickle');
    expect(updatedDoc.dataFormat).toBe('pandas');

    expect(pubsub.default.publish).toHaveBeenCalled();
    const call = pubsub.default.publish.mock.lastCall;
    expect(call[0]).toBe('VALIDATE_DATASET_STATUS_UPDATED')
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should process validateDataset ServiceResponse and update dataset (invalid)", async() => {
    redis.exists.mockResolvedValue(1);
    const resp = {
      type: 'ServiceResponse',
      serviceType: 'validateDataset',
      datasetId: datasetData._id.toString(),
      status: 'done',
      validationResult: 'invalid',
      errorMessages: '[{"category": "DATA_OR_MODEL_ERROR", "code": "CDATx00059", "description": "The dataset /mock/file/path.sav is not supported. Please upload a supported dataset: Unable to get data instance: There was an error loading dataset(file): /mock/file/path.sav (There was an error deserializing dataset: /mock/file/path.sav)", "severity": "critical", "component": "service_processing.py"}]',
      logFile: 'testlog.log',
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:service:${datasetData._id.toString()}`)
    await new Promise((r) => setTimeout(r, 500));
    const updatedDoc = await DatasetModel.findById(datasetData._id);
    // check updated
    expect(updatedDoc.status).toBe('Invalid');
    expect(updatedDoc.errorMessages).toBe('The dataset /mock/file/path.sav is not supported. Please upload a supported dataset: Unable to get data instance: There was an error loading dataset(file): /mock/file/path.sav (There was an error deserializing dataset: /mock/file/path.sav)');
    // check published
    expect(pubsub.default.publish).toHaveBeenCalled();
    const call = pubsub.default.publish.mock.lastCall;
    expect(call[0]).toBe('VALIDATE_DATASET_STATUS_UPDATED')
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should process validateModel ServiceResponse and update model (valid)", async() => {
    redis.exists.mockResolvedValue(1);
    const resp = {
      type: 'ServiceResponse',
      serviceType: 'validateModel',
      modelFileId: modelData._id.toString(),
      status: 'done',
      validationResult: 'valid',
      serializedBy: 'joblib',
      modelFormat: 'sklearn',
      logFile: 'testlog.log',
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:service:${modelData._id.toString()}`)
    await new Promise((r) => setTimeout(r, 500));
    const updatedDoc = await ModelFileModel.findById(modelData._id);
    //check updated
    expect(updatedDoc.status).toBe('Valid');
    expect(updatedDoc.serializer).toBe('joblib');
    expect(updatedDoc.modelFormat).toBe('sklearn');

    // check published
    expect(pubsub.default.publish).toHaveBeenCalled();
    const call = pubsub.default.publish.mock.lastCall;
    expect(call[0]).toBe('VALIDATE_MODEL_STATUS_UPDATED')
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })

  it("should process validateModel ServiceResponse and update model (invalid)", async() => {
    redis.exists.mockResolvedValue(1);
    const resp = {
      type: 'ServiceResponse',
      serviceType: 'validateModel',
      modelFileId: modelData._id.toString(),
      status: 'done',
      validationResult: 'invalid',
      errorMessages: '[{"category": "DATA_OR_MODEL_ERROR", "code": "CDATx00059", "description": "The model /mock/file/path.sav is not supported. Please upload a supported model: Unable to get data instance: There was an error loading model(file): /mock/file/path.sav (There was an error deserializing model: /mock/file/path.sav)", "severity": "critical", "component": "service_processing.py"}]',
      logFile: 'testlog.log',
    }
    redis.hGetAll.mockResolvedValue(resp);
    pSubscribeCallback(null, `__keyspace@0__:service:${modelData._id.toString()}`)
    await new Promise((r) => setTimeout(r, 500));
    const updatedDoc = await ModelFileModel.findById(modelData._id);
    //check updated
    expect(updatedDoc.status).toBe('Invalid');
    expect(updatedDoc.errorMessages).toBe('The model /mock/file/path.sav is not supported. Please upload a supported model: Unable to get data instance: There was an error loading model(file): /mock/file/path.sav (There was an error deserializing model: /mock/file/path.sav)');

    // check published
    expect(pubsub.default.publish).toHaveBeenCalled();
    const call = pubsub.default.publish.mock.lastCall;
    expect(call[0]).toBe('VALIDATE_MODEL_STATUS_UPDATED')
    redis.hGetAll.mockClear();
    pubsub.default.publish.mockClear();
  })


})