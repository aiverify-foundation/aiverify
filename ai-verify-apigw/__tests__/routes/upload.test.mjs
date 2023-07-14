import {afterEach, jest} from '@jest/globals';
import supertest from 'supertest';
import mockfs from 'mock-fs';

import { setupServerWithRouter } from '#testutil/testExpressRouter.mjs';
import multer from 'multer';


describe("Test /upload route", () => {
    let server;
    let request;
  
    beforeAll(async() => {

        jest.unstable_mockModule("#lib/testEngineQueue.mjs", () => {
            return import("#mocks/lib/testEngineQueue.mjs");
        });

        jest.unstable_mockModule("#lib/testEngineWorker.mjs", () => {
            return import("#mocks/lib/testEngineWorker.mjs");
        });

        jest.unstable_mockModule("#lib/redisClient.mjs", () => {
            return import("#mocks/lib/redisClient.mjs");
        });

        jest.mock('multer', () => {
            const multer = () => ({
                array: jest.fn(() => 'default')
                .mockImplementationOnce(() => {
                    return (req, res, next) => {
                            req.files = [
                                {
                                fieldname: 'myFiles',
                                originalname: 'mockdata.sav',
                                encoding: '7bit',
                                mimetype: 'application/octet-stream',
                                destination: '/tmp',
                                filename: 'mockdata.sav',
                                path: '/tmp/mockdata.sav',
                                size: 2195
                                },
                            ];
                            return next();
                        };
                    })
                .mockImplementationOnce(() => {
                    return (req, res, next) => {
                        req.files = [
                        {
                            fieldname: 'myModelFiles',
                            originalname: 'mockmodel.sav',
                            encoding: '7bit',
                            mimetype: 'application/octet-stream',
                            destination: '/tmp',
                            filename: 'mockmodel.sav',
                            path: '/tmp/mockmodel.sav',
                            size: 132878
                        }
                        ];
                        req.body = {
                        myModelFolders: '',
                        myModelType: 'Classification'
                        }
                        return next();
                    };
                })
            })
            multer.diskStorage = () => jest.fn()
            multer.memoryStorage = () => jest.fn()
            return multer
        })

      const router = await import("#routes/upload.mjs");
      const app = setupServerWithRouter("/upload", router.default);
      request = supertest(app);
      server = app.listen(4010);
      
      app.use(multer({}).array());

    })
  
    afterAll(done => {
      if (server)
        server.close();
      done();
    })

    beforeEach(() => {
      jest.clearAllMocks();
      mockfs({
        '/tmp/mockdata.sav': 'mock data content',
        '/tmp/mockmodel.sav': 'mock model content',
      });
    })

    afterEach(() => {
      mockfs.restore();
    })

    it("/upload/data should upload dataset file", async () => {

        request.post("/upload/data")
        .then( response => {
            expect(response.status).toBe(201)
        })

    })

    it("/upload/model should upload model file", async () => {

        request.post("/upload/model")
        .then( response => {
          expect(response.status).toBe(201)
        })

    })
 
})
