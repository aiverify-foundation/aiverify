import {jest} from '@jest/globals';
import casual from '#testutil/mockData.mjs';

describe("Test module testEngineQueue.mjs", () => {
  let redis;
  let testEngineQueue;
  let worker;
  let report;
  let onCall = jest.fn();

  let reportData;

  beforeAll(async() => {
    // mocking
    jest.unstable_mockModule("node:worker_threads", () => {
      const worker_threads = jest.createMockFromModule('node:worker_threads');
      return {
        __esModule: true,
        default: worker_threads,
        Worker: worker_threads.Worker.mockImplementation(() => ({
          on: onCall,
        }))
      }
    });
    worker = await import("node:worker_threads");
    jest.unstable_mockModule("#lib/redisClient.mjs", () => {
      return import("#mocks/lib/redisClient.mjs");
    });
    const redisConnect = await import('#lib/redisClient.mjs');
    redis = redisConnect.default();
    jest.unstable_mockModule("#lib/report.mjs", () => {
      return import("#mocks/lib/report.mjs");
    });
    report = await import("#lib/report.mjs");

    const models = await import("#models");
    ReportModel = models.ReportModel;
    const ProjectModel = models.ProjectModel;
    let projectMock = casual.project;
    const projectDoc = new ProjectModel(projectMock);
    const projectData = await projectDoc.save();
    const doc = new ReportModel(casual.report(projectData, "RunningTests"));
    reportData = await doc.save();
    
    testEngineQueue = await import("#lib/testEngineQueue.mjs");
  })

  afterAll(async () => {
    jest.clearAllMocks();
  })


  it("should queue tests", async() => {
    redis.hSet.mockResolvedValue();
    redis.xAdd.mockResolvedValue();
    const modelAndDataset = casual.modelAndDataset;
    await testEngineQueue.queueTests(reportData, modelAndDataset)
    expect(redis.hSet).toHaveBeenCalled();
    expect(redis.xAdd).toHaveBeenCalled();
    const xAddLastCall = redis.xAdd.mock.lastCall;
    expect(xAddLastCall[0]).toBe('TestEngineTask');
    expect(xAddLastCall[1]).toBe('*');
    expect(xAddLastCall[2]).toHaveProperty('task');
    redis.hSet.mockClear();
    redis.xAdd.mockClear();
  })

  it("should cancel pending test run", async() => {
    redis.publish.mockResolvedValue();
    redis.del.mockResolvedValue();
    let test = reportData.tests[0];
    test.status = "Pending";
    await testEngineQueue.cancelTestRun(reportData, test);
    const taskId = `task:${reportData._id}-${test._id}`;
    expect(redis.publish).toHaveBeenCalledWith("task.cancel", taskId);
    expect(redis.del).toHaveBeenCalled();
    redis.publish.mockClear();
    redis.del.mockClear();
  })

  it("should cancel running test run", async() => {
    redis.hSet.mockResolvedValue();
    redis.publish.mockResolvedValue();
    let test = reportData.tests[0];
    test.status = "Running";
    await testEngineQueue.cancelTestRun(reportData, test);
    const taskId = `task:${reportData._id}-${test._id}`;
    expect(redis.publish).toHaveBeenCalledWith("task.cancel", taskId);
    expect(redis.hSet).toHaveBeenCalledWith(taskId, "status", "Cancelled");
    redis.hSet.mockClear();
    redis.publish.mockClear();
  })

  it("should handle error from worker", async() => {
    let call = onCall.mock.calls.find(e => e[0] === "error");
    expect(call).toBeDefined();
  })

  it("should handle exit from worker", async() => {
    let call = onCall.mock.calls.find(e => e[0] === "exit");
    expect(call).toBeDefined();
  })

  it("should handle TaskResponse message from worker", async() => {
    let call = onCall.mock.calls.find(e => e[0] === "message");
    expect(call).toBeDefined();
    const resp = {
      type: 'TaskResponse',
      msg: {
        reportId: reportData._id.toString(),
      }
    }
    await call[1](JSON.stringify(resp));
    expect(report.generateReport).toHaveBeenCalledWith(reportData._id.toString())
  })

})

//assets
describe("Test asset functions in module testEngineQueue.mjs", () => {
  let redis;
  let testEngineQueue;
  let worker;
  let onCall = jest.fn();

  let datasetData;
  let modelData;

  beforeAll(async() => {
    // mocking
    jest.unstable_mockModule("node:worker_threads", () => {
      const worker_threads = jest.createMockFromModule('node:worker_threads');
      return {
        __esModule: true,
        default: worker_threads,
        Worker: worker_threads.Worker.mockImplementation(() => ({
          on: onCall,
        }))
      }
    });
    worker = await import("node:worker_threads");
    jest.unstable_mockModule("#lib/redisClient.mjs", () => {
      return import("#mocks/lib/redisClient.mjs");
    });
    const redisConnect = await import('#lib/redisClient.mjs');
    redis = redisConnect.default();

    const models = await import("#models");

    const datasetDoc = new models.DatasetModel({filePath: 'test/file/path/mockdata.sav', name: 'mock dataset', filename: 'mock dataset'});
    datasetData = await datasetDoc.save();
    const modelFileDoc = new models.ModelFileModel({filePath: 'test/file/path/mockdata.sav', name: 'mock dataset', filename: 'mock dataset'});
    modelData = await modelFileDoc.save();
    
    testEngineQueue = await import("#lib/testEngineQueue.mjs");
  })

  afterAll(async () => {
    jest.clearAllMocks();
  })


  it("should queue datasets", async() => {
    redis.hSet.mockResolvedValue();
    redis.xAdd.mockResolvedValue();
    await testEngineQueue.queueDataset(datasetData);
    expect(redis.hSet).toHaveBeenCalled();
    expect(redis.xAdd).toHaveBeenCalled();
    const xAddLastCall = redis.xAdd.mock.lastCall;
    expect(xAddLastCall[0]).toBe('TestEngineService');
    expect(xAddLastCall[1]).toBe('*');
    expect(xAddLastCall[2]).toHaveProperty('validateDataset');
    redis.hSet.mockClear();
    redis.xAdd.mockClear();
  })

  it("should queue models", async() => {
    redis.hSet.mockResolvedValue();
    redis.xAdd.mockResolvedValue();
    await testEngineQueue.queueModel(modelData);
    expect(redis.hSet).toHaveBeenCalled();
    expect(redis.xAdd).toHaveBeenCalled();
    const xAddLastCall = redis.xAdd.mock.lastCall;
    expect(xAddLastCall[0]).toBe('TestEngineService');
    expect(xAddLastCall[1]).toBe('*');
    expect(xAddLastCall[2]).toHaveProperty('validateModel');
    redis.hSet.mockClear();
    redis.xAdd.mockClear();
  })

})