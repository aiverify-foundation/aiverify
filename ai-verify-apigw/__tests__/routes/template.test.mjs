import supertest from 'supertest';

import casual from '#testutil/mockData.mjs';
import { setupServerWithRouter } from '#testutil/testExpressRouter.mjs';

describe("Test /template route", () => {
  let server;
  let request;
  let templateDoc;
  const pluginGID = "testPlugin";
  const templateCID = "testTemplate";

  beforeAll(async() => {
    const router = await import("#routes/template.mjs");
    const app = setupServerWithRouter("/template", router.default);
    request = supertest(app);
    server = app.listen(4010);

    // create mock template
    const models = await import("#models");
    ProjectTemplateModel = models.ProjectTemplateModel;
    const obj = new ProjectTemplateModel(casual.projectTemplate);
    templateDoc = await obj.save();
  })

  afterAll(async() => {
    if (server)
      server.close();
  })

  it("/template/export should download zip file containing plugin with template", async() => {
    const response = await request.post("/template/export")
      .send(`templateId=${templateDoc._id.toString()}&pluginGID=${pluginGID}&templateCID=${templateCID}`) // x-www-form-urlencoded upload
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain('zip');
    expect(response.headers["content-disposition"]).toBe(`attachment; filename=${pluginGID}.zip`);
    // expect(response.status).toBe(200);
  })

  it("/template/export should not download zip file with missing request parameters", async() => {
    const response = await request.post("/template/export");
    expect(response.status).toBe(400);
  })

  it("/template/export should not download zip file with invalid templateId", async() => {
    const response = await request.post("/template/export")
      .send(`templateId=12345&pluginGID=${pluginGID}&templateCID=${templateCID}`) // x-www-form-urlencoded upload
    expect(response.status).toBe(500);
  })

})