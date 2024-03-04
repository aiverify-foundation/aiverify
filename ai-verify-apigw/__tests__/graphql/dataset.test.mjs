import {jest} from '@jest/globals'
import mongoose from 'mongoose';
import casual from '#testutil/mockData.mjs';


describe("Test Dataset GraphQL queries and mutations", () => {
  let server;
  let ProjectModel;
  let DatasetModel;
  let data = [];
  let projData;

  beforeAll(async() => {

    // set some mocks first
    jest.unstable_mockModule("#lib/redisClient.mjs", () => {
        return import("#mocks/lib/redisClient.mjs");
    });
    const models = await import("#models");
    DatasetModel = models.DatasetModel;
    ProjectModel = models.ProjectModel;
    
    // create some initial data
    const docs = casual.multipleDatasets(3);
    for (const doc of docs) { 
      doc.__t = 'DatasetModel';
      const obj = new DatasetModel(doc);
      let saveDoc = await obj.save();
      data.push(saveDoc.toObject())
    }

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
    let resolver = await import('#graphql/modules/assets/dataset.mjs');
    server = createApolloServer(resolver.default);
  })


  beforeEach(async () => {
    jest.clearAllMocks();
  })


  it("should list all datasets", async () => {
    const query = `
        query {
            datasets {
                id
                name
                filename
                filePath
                ctime
                size
                status
                description
                dataColumns {
                    id
                    name
                    datatype
                    label
                }
                numRows
                numCols
                serializer
                dataFormat
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
    const docs = response.body.singleResult.data?.datasets;
    expect(docs.length).toBeGreaterThanOrEqual(data.length);
    for (let i=0; i<data.length; i++) {
      const doc = docs.find(e => e.id === data[i]._id.toString());
      expect(doc).toBeDefined();
      expect(doc.id).toBe(data[i]._id.toString())
      expect(doc.name).toBe(data[i].name);
    }
  })
  

  it("should not update dataset with invalid id", async() => {

    const dataLen = data.length;
    const id = data[dataLen-1]._id;

    const query = `
        mutation($datasetID: ObjectID!, $dataset: DatasetInput!) {
            updateDataset(datasetID:$datasetID, dataset:$dataset) {
                id
            }
        }
    `

    //test missing id
    const response = await server.executeOperation({
      query,
      variables: {
        //datasetID: id,
        dataset: {
            description: 'Mock Description1',
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
          datasetID: new mongoose.Types.ObjectId(),
          dataset: {
              description: 'Mock Description2',
              name: 'New File Name2.png',
              status: 'Cancelled',
          }
        }
      })
      // check response
      expect(response2.body.kind).toBe('single');
      expect(response2.body.singleResult.errors).toBeDefined();

    // check not updated into db
    const doc = await DatasetModel.findOne({ _id: new mongoose.Types.ObjectId(id) });
    expect(doc.name).toEqual(data[dataLen-1].name);
    expect(doc.status).toEqual(data[dataLen-1].status);

  })


  it("should update dataset", async() => {

    const dataLen = data.length;
    const id = data[dataLen-1]._id;

    const query = `
        mutation($datasetID: ObjectID!, $dataset: DatasetInput!) {
            updateDataset(datasetID:$datasetID, dataset:$dataset) {
                id
            }
        }
    `
    const response = await server.executeOperation({
      query,
      variables: {
        datasetID: id,
        dataset: {
            description: 'Mock Description',
            name: 'New File Name.png',
            status: 'Cancelled',
        }
      }
    })

    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();

    // check updated into db
    const doc = await DatasetModel.findOne({ _id: new mongoose.Types.ObjectId(id) });
    expect(doc.name).toEqual('New File Name.png');
    expect(doc.status).toEqual('Cancelled');
    expect(doc.description).toEqual('Mock Description');
  })


  it("should not delete dataset used by project", async() => {

    let projCount = await ProjectModel.countDocuments({ _id: projData._id });
    expect(projCount).toBe(1);
    
    const id1 = projData.modelAndDatasets.testDataset.id;
    const id2 = projData.modelAndDatasets.groundTruthDataset.id;

    let count1 = await DatasetModel.countDocuments({ _id: id1 });
    expect(count1).toBe(1);
    let count2 = await DatasetModel.countDocuments({ _id: id2 });
    expect(count2).toBe(1);

    const query = `
        mutation($id: ObjectID!) {
            deleteDataset(id:$id)
        }
    `
    // testDataset
    const response = await server.executeOperation({
      query,
      variables: {
        id: id1,
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();
    let count1a = await DatasetModel.countDocuments({ _id: id1 });
    expect(count1a).toBe(1);

    // grountTruthDataset
    const response2 = await server.executeOperation({
      query,
      variables: {
        id: id2,
      }
    })
    // check response
    expect(response2.body.kind).toBe('single');
    expect(response2.body.singleResult.errors).toBeDefined();
    let count2a = await DatasetModel.countDocuments({ _id: id2 });
    expect(count2a).toBe(1);
  })


  it("should delete dataset", async() => {
    const dataLen = data.length;
    const id = data[dataLen-1]._id;

    let count = await DatasetModel.countDocuments({ _id: id });
    expect(count).toBe(1);

    const query = `
        mutation($id: ObjectID!) {
            deleteDataset(id:$id)
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
    expect(response.body.singleResult.data?.deleteDataset).toBe(id.toString())

    // check deleted from db
    count = await DatasetModel.countDocuments({ _id: id });
    expect(count).toBe(0);
  })


  it("should not delete dataset with invalid id", async() => {

    // check initial db count
    let count = await DatasetModel.countDocuments();

    const query = `
        mutation($id: ObjectID!) {
            deleteDataset(id:$id)
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
        id: new mongoose.Types.ObjectId()
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    // check post db count
    let counta = await DatasetModel.countDocuments();
    expect(counta).toBe(count);

  })

});