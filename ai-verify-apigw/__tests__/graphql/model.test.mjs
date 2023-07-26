import { expect, jest } from "@jest/globals";
import mongoose from "mongoose";
import casual from "#testutil/mockData.mjs";

describe("Test Model GraphQL queries and mutations", () => {
  let server;
  let ProjectModel;
  let ModelFileModel;
  let data = [];
  let modelAPIData = [];
  let projData;

  beforeAll(async () => {
    // set some mocks first
    jest.unstable_mockModule("#lib/redisClient.mjs", () => {
      return import("#mocks/lib/redisClient.mjs");
    });
    const models = await import("#models");
    ModelFileModel = models.ModelFileModel;
    ProjectModel = models.ProjectModel;

    // create some initial data
    const docs = casual.multipleModels(2);
    for (const doc of docs) {
      doc.__t = "ModelFileModel";
      const obj = new ModelFileModel(doc);
      let saveDoc = await obj.save();
      data.push(saveDoc.toObject());
    }

    modelAPIData.push(casual.modelAPI("requestBody", false));
    modelAPIData.push(casual.modelAPI("query", false));
    modelAPIData.push(casual.modelAPI("path", false));
    modelAPIData.push(casual.modelAPI("requestBody", true));
    modelAPIData.push(casual.modelAPI("query", true));
    modelAPIData.push(casual.modelAPI("path", true));

    // ProjectModel = models.ProjectModel;
    const project = casual.project;
    project.__t = "ProjectModel";
    project.modelAndDatasets = {
      groundTruthColumn: "two_year_recid",
      model: data[0]._id.toString(),
      testDataset: data[0]._id.toString(),
      groundTruthDataset: data[1]._id.toString(),
    };
    const obj = new ProjectModel(project);
    projData = await obj.save();

    let { createApolloServer } = await import("#testutil/testApolloServer.mjs");
    let resolver = await import("#graphql/modules/assets/model.mjs");
    server = createApolloServer(resolver.default);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it("should list all models", async () => {
    const query = `
        query {
            modelFiles {
                id
                name
                filename
                filePath
                ctime
                size
                status
                description
                serializer
                modelFormat
                modelType
                errorMessages
                type
            }
        }
    `;
    const response = await server.executeOperation({
      query,
    });

    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeUndefined();
    const docs = response.body.singleResult.data?.modelFiles;
    expect(docs.length).toBeGreaterThanOrEqual(data.length);
    for (let i = 0; i < data.length; i++) {
      const doc = docs.find((e) => e.id === data[i]._id.toString());
      expect(doc).toBeDefined();
      expect(doc.id).toBe(data[i]._id.toString());
      expect(doc.name).toBe(data[i].name);
    }
  });

  it("should list one model", async () => {
    const dataLen = data.length;
    const id = data[dataLen - 1]._id;
    const query = `
        query($modelFileId: ObjectID) {
            modelFiles(modelFileID: $modelFileId) {
                id
                name
                filename
                filePath
                ctime
                size
                status
                description
                serializer
                modelFormat
                modelType
                errorMessages
                type
            }
        }
    `;
    const response = await server.executeOperation({
      query,
      variables: {
        modelFileId: id,
      },
    });

    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeUndefined();
    const docs = response.body.singleResult.data?.modelFiles;
    expect(docs.length).toBe(1);
    const doc = docs[0];
    expect(doc).toBeDefined();
    expect(doc.id).toBe(data[dataLen - 1]._id.toString());
    expect(doc.name).toBe(data[dataLen - 1].name);
  });

  it("should not update model with invalid id", async () => {
    const dataLen = data.length;
    const id = data[dataLen - 1]._id;

    const query = `
        mutation($modelFileID: ObjectID!, $modelFile: ModelFileInput!) {
            updateModel(modelFileID:$modelFileID, modelFile:$modelFile) {
                id
            }
        }
    `;

    //test missing id
    const response = await server.executeOperation({
      query,
      variables: {
        //modelFileID: id,
        modelFile: {
          description: "Mock Description1",
          modelType: "Regression",
          name: "New File Name1.png",
          status: "Cancelled",
        },
      },
    });
    // check response
    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeDefined();

    //test invalid id
    const response2 = await server.executeOperation({
      query,
      variables: {
        modelFileID: mongoose.Types.ObjectId(),
        modelFile: {
          description: "Mock Description1",
          modelType: "Regression",
          name: "New File Name1.png",
          status: "Cancelled",
        },
      },
    });
    // check response
    expect(response2.body.kind).toBe("single");
    expect(response2.body.singleResult.errors).toBeDefined();

    // check not updated into db
    const doc = await ModelFileModel.findOne({
      _id: mongoose.Types.ObjectId(id),
    });
    expect(doc.name).toEqual(data[dataLen - 1].name);
    expect(doc.status).toEqual(data[dataLen - 1].status);
  });

  it("should update model", async () => {
    const dataLen = data.length;
    const id = data[dataLen - 1]._id;

    const query = `
        mutation($modelFileID: ObjectID!, $modelFile: ModelFileInput!) {
            updateModel(modelFileID:$modelFileID, modelFile:$modelFile) {
                id
            }
        }
    `;
    const response = await server.executeOperation({
      query,
      variables: {
        modelFileID: id,
        modelFile: {
          description: "Mock Description1",
          modelType: "Regression",
          name: "New File Name1.png",
        },
      },
    });

    // check response
    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeUndefined();

    // check updated into db
    const doc = await ModelFileModel.findOne({
      _id: mongoose.Types.ObjectId(id),
    });
    expect(doc.name).toEqual("New File Name1.png");
    expect(doc.modelType).toEqual("Regression");
    expect(doc.description).toEqual("Mock Description1");
  });

  it("should not delete model used by project", async () => {
    let projCount = await ProjectModel.countDocuments({ _id: projData._id });
    expect(projCount).toBe(1);

    const id1 = projData.modelAndDatasets.model.id;

    let count1 = await ModelFileModel.countDocuments({ _id: id1 });
    expect(count1).toBe(1);

    const query = `
        mutation($id: ObjectID!) {
            deleteModelFile(id:$id)
        }
    `;
    const response = await server.executeOperation({
      query,
      variables: {
        id: id1,
      },
    });
    // check response
    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeDefined();
    let count1a = await ModelFileModel.countDocuments({ _id: id1 });
    expect(count1a).toBe(1);
  });

  it("should delete model", async () => {
    const dataLen = data.length;
    const id = data[dataLen - 1]._id;

    let count = await ModelFileModel.countDocuments({ _id: id });
    expect(count).toBe(1);

    const query = `
        mutation($id: ObjectID!) {
            deleteModelFile(id:$id)
        }
    `;
    const response = await server.executeOperation({
      query,
      variables: {
        id: id.toString(),
      },
    });
    // check response
    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data?.deleteModelFile).toBe(
      id.toString()
    );

    // check deleted from db
    count = await ModelFileModel.countDocuments({ _id: id });
    expect(count).toBe(0);
  });

  it("should not delete model with invalid id", async () => {
    // check initial db count
    let count = await ModelFileModel.countDocuments();

    const query = `
        mutation($id: ObjectID!) {
            deleteModelFile(id:$id)
        }
    `;
    //missing id
    let response = await server.executeOperation({
      query,
      variables: {
        // id: id.toString(),
      },
    });
    // check response
    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeDefined();

    //invalid id
    response = await server.executeOperation({
      query,
      variables: {
        id: mongoose.Types.ObjectId(),
      },
    });
    // check response
    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeDefined();

    // check post db count
    let counta = await ModelFileModel.countDocuments();
    expect(counta).toBe(count);
  });

  it("should create model API", async () => {
    const query = `
mutation($model: ModelAPIInput!) {
  createModelAPI(model: $model) {
    id
    name
    description
    type
    status
    modelType
  }
}
`;
    for (let model of modelAPIData) {
      const response = await server.executeOperation({
        query,
        variables: {
          model,
        },
      });

      // check response
      expect(response.body.kind).toBe("single");
      expect(response.body.singleResult.errors).toBeUndefined();

      const result = response.body.singleResult.data.createModelAPI;
      const id = result.id;
      model.id = id;

      // check updated into db
      const doc = await ModelFileModel.findOne({
        _id: mongoose.Types.ObjectId(id),
      });
      expect(doc).toBeDefined();
      expect(doc.name).toEqual(model.name);
      expect(doc.modelType).toEqual(model.modelType);
      expect(doc.description).toEqual(model.description);
      expect(doc.modelAPI.method).toEqual(model.modelAPI.method);
      expect(doc.modelAPI.url).toEqual(model.modelAPI.url);
      expect(doc.modelAPI.urlParams).toEqual(model.modelAPI.urlParams);
      expect(doc.modelAPI.authType).toEqual(model.modelAPI.authType);
      expect(doc.modelAPI.authTypeConfig).toEqual(
        model.modelAPI.authTypeConfig
      );
      if (model.modelAPI.requestBody) {
        expect(model.modelAPI).toHaveProperty("requestBody");
        expect(doc.modelAPI.requestBody.mediaType).toEqual(
          model.modelAPI.requestBody.mediaType
        );
        expect(doc.modelAPI.requestBody.isArray).toEqual(
          model.modelAPI.requestBody.isArray
        );
        expect(doc.modelAPI.requestBody.maxItems).toEqual(
          model.modelAPI.requestBody.maxItems
        );
        expect(doc.modelAPI.requestBody.properties.length).toEqual(
          model.modelAPI.requestBody.properties.length
        );
        for (let i = 0; i < doc.modelAPI.requestBody.properties.length; i++) {
          const prop1 = doc.modelAPI.requestBody.properties[i];
          const prop2 = model.modelAPI.requestBody.properties[i];
          expect(prop1.field).toEqual(prop2.field);
          expect(prop1.type).toEqual(prop2.type);
        }
      } else if (model.modelAPI.parameters && model.modelAPI.parameters.paths) {
        expect(model.modelAPI).toHaveProperty("parameters.paths");
        expect(doc.modelAPI.parameters.paths.mediaType).toEqual(
          model.modelAPI.parameters.paths.mediaType
        );
        expect(doc.modelAPI.parameters.paths.isArray).toEqual(
          model.modelAPI.parameters.paths.isArray
        );
        expect(doc.modelAPI.parameters.paths.maxItems).toEqual(
          model.modelAPI.parameters.paths.maxItems
        );
        expect(doc.modelAPI.parameters.paths.pathParams.length).toEqual(
          model.modelAPI.parameters.paths.pathParams.length
        );
        for (
          let i = 0;
          i < doc.modelAPI.parameters.paths.pathParams.length;
          i++
        ) {
          const prop1 = doc.modelAPI.parameters.paths.pathParams[i];
          const prop2 = model.modelAPI.parameters.paths.pathParams[i];
          expect(prop1.name).toEqual(prop2.name);
          expect(prop1.type).toEqual(prop2.type);
        }
      } else if (
        model.modelAPI.parameters &&
        model.modelAPI.parameters.queries
      ) {
        expect(model.modelAPI).toHaveProperty("parameters.queries");
        expect(doc.modelAPI.parameters.queries.mediaType).toEqual(
          model.modelAPI.parameters.queries.mediaType
        );
        expect(doc.modelAPI.parameters.queries.isArray).toEqual(
          model.modelAPI.parameters.queries.isArray
        );
        expect(doc.modelAPI.parameters.queries.maxItems).toEqual(
          model.modelAPI.parameters.queries.maxItems
        );
        expect(doc.modelAPI.parameters.queries.queryParams.length).toEqual(
          model.modelAPI.parameters.queries.queryParams.length
        );
        for (
          let i = 0;
          i < doc.modelAPI.parameters.queries.queryParams.length;
          i++
        ) {
          const prop1 = doc.modelAPI.parameters.queries.queryParams[i];
          const prop2 = model.modelAPI.parameters.queries.queryParams[i];
          expect(prop1.name).toEqual(prop2.name);
          expect(prop1.type).toEqual(prop2.type);
        }
      }
    }
  });

  it("should not create model API with missing data", async () => {
    const query = `
mutation($model: ModelAPIInput!) {
  createModelAPI(model: $model) {
    id
    name
    description
    type
    status
    modelType
  }
}
`;

    const model = casual.modelAPI("requestBody", false);
    delete model.modelAPI;
    const response = await server.executeOperation({
      query,
      variables: {
        model,
      },
    });

    // check response
    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeDefined();
  });

  it("should update model API", async () => {
    const query = `
mutation($modelFileID: ObjectID!, $model: ModelAPIInput!) {
  updateModelAPI(modelFileID: $modelFileID, model: $model) {
    id
    name
    description
    type
    status
    modelType
  }
}
`;
    const newModel = casual.modelAPI("requestBody", false);
    // modelAPIData[0] = newModel;
    const id = modelAPIData[0].id;

    const response = await server.executeOperation({
      query,
      variables: {
        modelFileID: id,
        model: newModel,
      },
    });

    // check response
    expect(response.body.kind).toBe("single");
    expect(response.body.singleResult.errors).toBeUndefined();
  });

  it("should build OpenAPI specs from model", async () => {
    const query = `
query($modelFileID: ObjectID!) {
  getOpenAPISpecFromModel(modelFileID: $modelFileID)
}
`;
    for (let model of modelAPIData) {
      const response = await server.executeOperation({
        query,
        variables: {
          modelFileID: model.id,
        },
      });

      // check response
      expect(response.body.kind).toBe("single");
      expect(response.body.singleResult.errors).toBeUndefined();

      const spec = response.body.singleResult.data.getOpenAPISpecFromModel;
      expect(spec).toHaveProperty("paths");
      const keys = Object.keys(spec.paths);
      expect(keys.length).toBe(1);
      const path = spec.paths[keys[0]];

      const method = model.modelAPI.method.toLowerCase();
      expect(path).toHaveProperty(method);

      if (model.modelAPI.requestBody) {
        expect(path[method]).toHaveProperty("requestBody");
      } else if (model.modelAPI.parameters && model.modelAPI.parameters.paths) {
        expect(path[method]).toHaveProperty("parameters");
      } else if (
        model.modelAPI.parameters &&
        model.modelAPI.parameters.queries
      ) {
        expect(path[method]).toHaveProperty("parameters");
      }
    }
  });

  it("should build OpenAPI specs from model with invalid ID", async () => {
    const query = `
query($modelFileID: ObjectID!) {
  getOpenAPISpecFromModel(modelFileID: $modelFileID)
}
`;

    const response1 = await server.executeOperation({
      query,
      variables: {
        modelFileID: casual.uuid,
      },
    });

    // check response
    expect(response1.body.kind).toBe("single");
    expect(response1.body.singleResult.errors).toBeDefined();

    const response2 = await server.executeOperation({
      query,
      variables: {
        modelFileID: data[0]._id,
      },
    });

    // check response
    expect(response2.body.kind).toBe("single");
    expect(response2.body.singleResult.errors).toBeDefined();
  });

  it("should delete model API", async () => {
    const query = `
mutation($id: ObjectID!) {
  deleteModelFile(id: $id)
}
`;
    for (let model of modelAPIData) {
      const count = await ModelFileModel.countDocuments({
        _id: mongoose.Types.ObjectId(model.id),
      });
      expect(count).toBe(1);

      const response = await server.executeOperation({
        query,
        variables: {
          id: model.id,
        },
      });

      // check response
      expect(response.body.kind).toBe("single");
      expect(response.body.singleResult.errors).toBeUndefined();

      // verify delete from db
      const count2 = await ModelFileModel.countDocuments({
        _id: mongoose.Types.ObjectId(model.id),
      });
      expect(count2).toBe(0);
    }
  });
});
