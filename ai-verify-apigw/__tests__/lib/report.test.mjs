import {jest} from '@jest/globals';
import casual from '#testutil/mockData.mjs';

describe("Test module report.mjs", () => {
  let puppeteer;
  let pubsub;
  let report;
  let ReportModel;
  let reportId;

  beforeAll(async() => {
    // mocking
    jest.unstable_mockModule("#lib/apolloPubSub.mjs", () => {
      return import('#mocks/lib/apolloPubSub.mjs');
    });
    pubsub = await import('#lib/apolloPubSub.mjs');
    jest.unstable_mockModule('puppeteer', () => {
      const puppeteer = jest.createMockFromModule('puppeteer');
      return {
        __esModule: true,
        default: puppeteer,
        launch: puppeteer.launch,
      }
    });
    puppeteer = await import("puppeteer")

    // setup mock report data
    const models = await import("#models");
    ReportModel = models.ReportModel;
    const ProjectModel = models.ProjectModel;
    let projectMock = casual.project;
    // projectMock.__t = 'ProjectModel';
    const projectDoc = new ProjectModel(projectMock);
    const projectData = await projectDoc.save();
    const doc = new ReportModel({
      status: 'NoReport',
      project: projectData,
    })
    const reportData = await doc.save();
    reportId = reportData._id;

    report = await import("#lib/report.mjs");
  })

  beforeEach(async () => {
    jest.clearAllMocks();
  })

  it("should generate report", async() => {
    const page = {
      goto: jest.fn().mockResolvedValue(),
      pdf: jest.fn().mockResolvedValue(),
    };
    puppeteer.launch.mockResolvedValue({
      newPage: jest.fn().mockResolvedValue(page),
    })

    await report.generateReport(reportId);
    expect(pubsub.default.publish).toHaveBeenCalledTimes(2);
    let updatedDoc = await ReportModel.findById(reportId)
    expect(updatedDoc).toBeDefined();
    expect(updatedDoc.status).toBe("ReportGenerated");
  })

})