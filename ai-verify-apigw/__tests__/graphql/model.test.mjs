import {jest} from '@jest/globals'
import mongoose from 'mongoose';
import casual from '#testutil/mockData.mjs';


describe("Test Model GraphQL queries and mutations", () => {
  let server;
  let ProjectModel;
  let ModelFileModel;
  let data = [];
  let projData;

  beforeAll(async() => {

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
      doc.__t = 'ModelFileModel';
      const obj = new ModelFileModel(doc);
      let saveDoc = await obj.save();
      data.push(saveDoc.toObject())
    }

    // ProjectModel = models.ProjectModel;
    const project = casual.project;
    project.__t = 'ProjectModel';
    project.modelAndDatasets = {
        groundTruthColumn: 'two_year_recid',
        model: data[0]._id.toString(),
        testDataset: data[0]._id.toString(),
        groundTruthDataset: data[1]._id.toString(),
    }
    const obj = new ProjectModel(project);
    projData = await obj.save();
    
    let { createApolloServer } = await import("#testutil/testApolloServer.mjs");
    let resolver = await import('#graphql/modules/assets/model.mjs');
    server = createApolloServer(resolver.default);
  })


  beforeEach(async () => {
    jest.clearAllMocks();
  })


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
    `
    const response = await server.executeOperation({
      query,
    })

    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    const docs = response.body.singleResult.data?.modelFiles;
    expect(docs.length).toBeGreaterThanOrEqual(data.length);
    for (let i=0; i<data.length; i++) {
      const doc = docs.find(e => e.id === data[i]._id.toString());
      expect(doc).toBeDefined();
      expect(doc.id).toBe(data[i]._id.toString())
      expect(doc.name).toBe(data[i].name);
    }
  })
  

  it("should not update model with invalid id", async() => {

    const dataLen = data.length;
    const id = data[dataLen-1]._id;

    const query = `
        mutation($modelFileID: ObjectID!, $modelFile: ModelFileInput!) {
            updateModel(modelFileID:$modelFileID, modelFile:$modelFile) {
                id
            }
        }
    `

    //test missing id
    const response = await server.executeOperation({
      query,
      variables: {
        //modelFileID: id,
        modelFile: {
            description: 'Mock Description1',
            modelType: 'Regression',
            name: 'New File Name1.png',
            status: 'Cancelled',
        }
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    //test invalid id
    const response2 = await server.executeOperation({
        query,
        variables: {
            modelFileID: mongoose.Types.ObjectId(),
            modelFile: {
                description: 'Mock Description1',
                modelType: 'Regression',
                name: 'New File Name1.png',
                status: 'Cancelled',
            }
        }
      })
      // check response
      expect(response2.body.kind).toBe('single');
      expect(response2.body.singleResult.errors).toBeDefined();

    // check not updated into db
    const doc = await ModelFileModel.findOne({ _id: mongoose.Types.ObjectId(id) });
    expect(doc.name).toEqual(data[dataLen-1].name);
    expect(doc.status).toEqual(data[dataLen-1].status);

  })


  it("should update model", async() => {

    const dataLen = data.length;
    const id = data[dataLen-1]._id;

    const query = `
        mutation($modelFileID: ObjectID!, $modelFile: ModelFileInput!) {
            updateModel(modelFileID:$modelFileID, modelFile:$modelFile) {
                id
            }
        }
    `
    const response = await server.executeOperation({
      query,
      variables: {
        modelFileID: id,
        modelFile: {
            description: 'Mock Description1',
            modelType: 'Regression',
            name: 'New File Name1.png',
            status: 'Cancelled',
        }
      }
    })

    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();

    // check updated into db
    const doc = await ModelFileModel.findOne({ _id: mongoose.Types.ObjectId(id) });
    expect(doc.name).toEqual('New File Name1.png');
    expect(doc.modelType).toEqual('Regression');
    expect(doc.status).toEqual('Cancelled');
    expect(doc.description).toEqual('Mock Description1');
  })


  it("should not delete model used by project", async() => {

    let projCount = await ProjectModel.countDocuments({ _id: projData._id });
    expect(projCount).toBe(1);
    
    const id1 = projData.modelAndDatasets.model.id;

    let count1 = await ModelFileModel.countDocuments({ _id: id1 });
    expect(count1).toBe(1);

    const query = `
        mutation($id: ObjectID!) {
            deleteModelFile(id:$id)
        }
    `
    const response = await server.executeOperation({
      query,
      variables: {
        id: id1,
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();
    let count1a = await ModelFileModel.countDocuments({ _id: id1 });
    expect(count1a).toBe(1);

  })


  it("should delete model", async() => {
    const dataLen = data.length;
    const id = data[dataLen-1]._id;

    let count = await ModelFileModel.countDocuments({ _id: id });
    expect(count).toBe(1);

    const query = `
        mutation($id: ObjectID!) {
            deleteModelFile(id:$id)
        }
    `
    const response = await server.executeOperation({
      query,
      variables: {
        id: id.toString(),
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(response.body.singleResult.data?.deleteModelFile).toBe(id.toString())

    // check deleted from db
    count = await ModelFileModel.countDocuments({ _id: id });
    expect(count).toBe(0);
  })


  it("should not delete model with invalid id", async() => {

    // check initial db count
    let count = await ModelFileModel.countDocuments();

    const query = `
        mutation($id: ObjectID!) {
            deleteModelFile(id:$id)
        }
    `
    //missing id
    let response = await server.executeOperation({
      query,
      variables: {
        // id: id.toString(),
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    //invalid id
    response = await server.executeOperation({
      query,
      variables: {
        id: mongoose.Types.ObjectId()
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    // check post db count
    let counta = await ModelFileModel.countDocuments();
    expect(counta).toBe(count);

  })

});