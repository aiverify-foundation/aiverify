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

    const array = jest.fn()
    
    array.mockImplementationOnce(() => jest.fn()
      // mocks for data files upload
      .mockImplementationOnce((req, res, next) => {
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
      .mockImplementationOnce((req, res, next) => {
        req.files = [
          {
            fieldname: "myFiles",
            originalname: "../mockdata.sav",
            encoding: "7bit",
            mimetype: "application/octet-stream",
            destination: "/tmp",
            filename: "../mockdata.sav",
            path: "/tmp/mockdata.sav",
            size: 2195,
          },
        ];
        return next();
      })
      .mockImplementationOnce((req, res, next) => {
        req.files = [
          {
            fieldname: "myFiles",
            originalname: "mockdata2.sav",
            encoding: "7bit",
            mimetype: "application/octet-stream",
            destination: "/tmp",
            filename: "mockdata2.sav",
            path: "/tmp/mockdata2.sav",
            size: 2195,
          },
        ];
        req.body = {
          myFolder: "mock_folder",
          myFolders: [
            "../mock_folder"
          ]
        }
        return next();
      })
    ) // mocks for model files upload
    .mockImplementationOnce(() => jest.fn()
      .mockImplementationOnce((req, res, next) => {
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
          myModelType: "Classification",
        };
        return next();
      })
      .mockImplementationOnce((req, res, next) => {
        req.files = [
          {
            fieldname: "myModelFiles",
            originalname: "../mockmodel.sav",
            encoding: "7bit",
            mimetype: "application/octet-stream",
            destination: "/tmp",
            filename: "../mockmodel.sav",
            path: "/tmp/mockmodel.sav",
            size: 132878,
          },
        ];
        req.body = {
          myModelType: "Classification",
        };
        return next();
      })
      .mockImplementationOnce((req, res, next) => {
        req.files = [
          {
            fieldname: "myModelFiles",
            originalname: "mockmodel2.sav",
            encoding: "7bit",
            mimetype: "application/octet-stream",
            destination: "/tmp",
            filename: "mockmodel2.sav",
            path: "/tmp/mockmodel2.sav",
            size: 132878,
          },
        ];
        req.body = {
          myModelFolder: "mock_folder",
          myModelFolders: [
            "../mock_folder2"
          ],
          myModelType: "Classification",
        };
        return next();
      })
    )


    /*
     const array = jest.fn(() => jest.fn()
      .mockImplementationOnce((req, res, next) => {
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
      .mockImplementationOnce((req, res, next) => {
        req.files = [
          {
            fieldname: "myFiles",
            originalname: "../mockdata.sav",
            encoding: "7bit",
            mimetype: "application/octet-stream",
            destination: "/tmp",
            filename: "../mockdata.sav",
            path: "/tmp/mockdata.sav",
            size: 2195,
          },
        ];
        return next();
      })
      .mockImplementationOnce((req, res, next) => {
        req.files = [
          {
            fieldname: "myFiles",
            originalname: "mockdata2.sav",
            encoding: "7bit",
            mimetype: "application/octet-stream",
            destination: "/tmp",
            filename: "mockdata2.sav",
            path: "/tmp/mockdata2.sav",
            size: 2195,
          },
        ];
        req.body = {
          myFolder: "mock_folder",
          myFolders: [
            "../mock_folder"
          ]
        }
        return next();
      })
      .mockImplementationOnce((req, res, next) => {
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
          myModelType: "Classification",
        };
        return next();
      })
      .mockImplementationOnce((req, res, next) => {
        req.files = [
          {
            fieldname: "myModelFiles",
            originalname: "../mockmodel.sav",
            encoding: "7bit",
            mimetype: "application/octet-stream",
            destination: "/tmp",
            filename: "../mockmodel.sav",
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
      .mockImplementationOnce((req, res, next) => {
        req.files = [
          {
            fieldname: "myModelFiles",
            originalname: "mockmodel2.sav",
            encoding: "7bit",
            mimetype: "application/octet-stream",
            destination: "/tmp",
            filename: "mockmodel2.sav",
            path: "/tmp/mockmodel2.sav",
            size: 132878,
          },
        ];
        req.body = {
          myModelFolder: "mock_folder",
          myModelFolders: [
            "../mock_folder2"
          ],
          myModelType: "Classification",
        };
        return next();
      })
    )
    */

    multer.mockReturnValue({
      array
    })

    return {
        __esModule: true,
        default: multer,
        diskStorage: multer.diskStorage,
        memoryStorage: multer.memoryStorage,
        // array: jest.fn(),
        // array,
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

  /**
   * Data upload tests
   */

  it("/upload/data should upload dataset file", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({});
    fs.readdirSync.mockReturnValue([]);

    const response = await request.post("/upload/data");
    expect(response.status).toBe(201)
  });

  it("/upload/data should not upload invalid data file", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({});
    fs.readdirSync.mockReturnValue([]);

    const response = await request.post("/upload/data");
    expect(response.status).toBe(400)
  });

  it("/upload/data should not upload invalid dataset folder", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({});
    fs.readdirSync.mockReturnValue([]);

    const response = await request.post("/upload/data");
    expect(response.status).toBe(500)
  });

  /**
   * Model upload tests
   */

  it("/upload/model should upload model file", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({});
    fs.readdirSync.mockReturnValue([]);

    const response = await request.post("/upload/model");
    expect(response.status).toBe(201)
  });

  it("/upload/model should not upload invalid model file", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({});
    fs.readdirSync.mockReturnValue([]);

    const response = await request.post("/upload/model");
    expect(response.status).toBe(400)
  });

  it("/upload/model should not upload invalid model file folder", async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({});
    fs.readdirSync.mockReturnValue([]);

    const response = await request.post("/upload/model");
    expect(response.status).toBe(500)
  });

});
