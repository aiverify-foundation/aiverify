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


})