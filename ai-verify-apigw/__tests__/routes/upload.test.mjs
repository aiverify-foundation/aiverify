import { afterEach, expect, jest } from "@jest/globals";
import supertest from "supertest";

import { setupServerWithRouter } from "#testutil/testExpressRouter.mjs";

describe("Test /upload route", () => {
  let server;
  let request;
  let fs;
  let multer;

  beforeAll(async () => {
    jest.unstable_mockModule("#lib/testEngineQueue.mjs", () => {
      return import("#mocks/lib/testEngineQueue.mjs");
    });

    jest.unstable_mockModule("#lib/testEngineWorker.mjs", () => {
      return import("#mocks/lib/testEngineWorker.mjs");
    });

    jest.unstable_mockModule("#lib/redisClient.mjs", () => {
      return import("#mocks/lib/redisClient.mjs");
    });

    jest.unstable_mockModule('fs', () => {
      const fs = jest.createMockFromModule('node:fs');
      return {
        __esModule: true,
        default: fs,
        readdirSync: fs.readdirSync,
        createReadStream: fs.createReadStream,
        readFileSync: fs.readFileSync,
        createWriteStream: fs.createWriteStream,
        writeFile: fs.writeFile,
        accessSync: fs.accessSync,
        existsSync: fs.existsSync,
        mkdirSync: fs.mkdirSync,
        copyFileSync: fs.copyFileSync,
        unlinkSync: fs.unlinkSync,
        statSync: fs.statSync,
      }
    });
    fs = await import('fs');
    // console.log("fs", fs);

    jest.unstable_mockModule("multer", () => {
      const multer = jest.createMockFromModule("multer");
      // console.log("multer", multer)

      // const multer = () => ({
      //   array: jest
      //     .fn()
      //     .mockImplementationOnce(() => {
      //       return (req, res, next) => {
      //         req.files = [
      //           {
      //             fieldname: "myFiles",
      //             originalname: "mockdata.sav",
      //             encoding: "7bit",
      //             mimetype: "application/octet-stream",
      //             destination: "/tmp",
      //             filename: "mockdata.sav",
      //             path: "/tmp/mockdata.sav",
      //             size: 2195,
      //           },
      //         ];
      //         return next();
      //       };
      //     })
      //     .mockImplementationOnce(() => {
      //       return (req, res, next) => {
      //         req.files = [
      //           {
      //             fieldname: "myModelFiles",
      //             originalname: "mockmodel.sav",
      //             encoding: "7bit",
      //             mimetype: "application/octet-stream",
      //             destination: "/tmp",
      //             filename: "mockmodel.sav",
      //             path: "/tmp/mockmodel.sav",
      //             size: 132878,
      //           },
      //         ];
      //         req.body = {
      //           myModelFolders: "",
      //           myModelType: "Classification",
      //         };
      //         return next();
      //       };
      //     }),
      // });
      // multer.diskStorage = () => jest.fn();
      // multer.memoryStorage = () => jest.fn();
      const array = jest.fn()
        .mockReturnValueOnce((req, res, next) => {
          req.files = [
            {
              fieldname: "myFiles",
              originalname: "mockdata.sav",
              encoding: "7bit",
              mimetype: "application/octet-stream",
              destination: "/tmp",
              filename: "mockdata.sav",
              path: "/tmp/mockdata.sav",
              size: 2195,
            },
          ];
          return next();
        })
        .mockReturnValueOnce((req, res, next) => {
          req.files = [
            {
              fieldname: "myModelFiles",
              originalname: "mockmodel.sav",
              encoding: "7bit",
              mimetype: "application/octet-stream",
              destination: "/tmp",
              filename: "mockmodel.sav",
              path: "/tmp/mockmodel.sav",
              size: 132878,
            },
          ];
          req.body = {
            myModelFolders: "",
            myModelType: "Classification",
          };
          return next();
        })
      multer.mockReturnValue({
        array
      })
      return {
        __esModule: true,
        default: multer,
        diskStorage: multer.diskStorage,
        memoryStorage: multer.memoryStorage,
        array: jest.fn(),
      };
    });
    multer = await import("multer");

    const router = await import("#routes/upload.mjs");
    const app = setupServerWithRouter("/upload", router.default);
    request = supertest(app);
    server = app.listen(4012);

    // app.use(multer({}).array());
  });

  afterAll((done) => {
    if (server) server.close();
    done();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("/upload/data should upload dataset file", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({});
    fs.readdirSync.mockReturnValue([]);

    const response = await request.post("/upload/data");
    expect(response.status).toBe(201)
  });

  it("/upload/model should upload model file", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({});
    fs.readdirSync.mockReturnValue([]);

    const response = await request.post("/upload/model");
    expect(response.status).toBe(201)
  });
});
