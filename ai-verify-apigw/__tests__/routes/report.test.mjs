import {jest} from '@jest/globals';
import supertest from 'supertest';

import { setupServerWithRouter } from '#testutil/testExpressRouter.mjs';
import path from 'node:path';
import url from 'url';
import mongoose from 'mongoose';

const __filename = url.fileURLToPath(import.meta.url);
export const srcDir = path.dirname(__filename);

jest.mock('node:fs');
const fsActual = jest.requireActual('node:fs');

describe("Test /report route", () => {
  let report;
  let fs;
  let server;
  let request;
  const projectId = mongoose.Types.ObjectId();
  const pdf_path = path.join(srcDir, "./mock_report.pdf");

  beforeAll(async() => {
    // mocking
    jest.unstable_mockModule("#lib/report.mjs", () => {
      return import("#mocks/lib/report.mjs");
    });
    jest.unstable_mockModule('node:fs', () => {
      const fs = jest.createMockFromModule('fs');
      return {
        __esModule: true,
        default: fs,
        existsSync: fs.existsSync,
        createReadStream: fs.createReadStream,
        statSync: fs.statSync,
      }
    });
    fs = await import("node:fs")

    // start server
    const router = await import("#routes/report.mjs");
    const app = setupServerWithRouter("/report", router.default);
    request = supertest(app);
    server = app.listen(4011);
  })

  afterAll(async() => {
    if (server)
      server.close();
  })

  beforeEach(async () => {
    jest.clearAllMocks();
  })

  it("/report/:projectId should not download PDF report with invalid project id", async() => {
    fs.existsSync.mockReturnValue(true);
    const response = await request.get(`/report/fakeid`);
    expect(response).toBeDefined();
    expect(response.status).toBe(400);
    const response2 = await request.get(`/report/${projectId}`);
    expect(response2).toBeDefined();
    expect(response2.status).toBe(500);
  })

  it("/report/:projectId should download PDF report", async() => {
    let file = fsActual.createReadStream(pdf_path);
    let stat = fsActual.statSync(pdf_path);
    fs.existsSync.mockReturnValue(true);
    fs.createReadStream.mockReturnValue(file);
    fs.statSync.mockReturnValue({
      size: stat.size,
    })
    const response = await request.get(`/report/${projectId}`)
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain('pdf');
    expect(response.headers["content-length"]).toBe(stat.size.toString());
    expect(response.headers["content-disposition"]).toContain("inline");
  })


})