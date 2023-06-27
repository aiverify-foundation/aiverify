// import {jest} from '@jest/globals';
import mongoose from 'mongoose';
import casual from '#testutil/mockData.mjs';

describe("Test Project Template GraphQL queries", () => {
  let server;
  let ProjectTemplateModel;
  let data = [];

  beforeAll(async() => {
    const models = await import("#models");
    ProjectTemplateModel = models.ProjectTemplateModel;
    // make sure collection empty
    // await ProjectTemplateModel.deleteMany();
    // create some initial data
    const docs = casual.multipleProjectTemplates(2);
    for (const doc of docs) { 
      const obj = new ProjectTemplateModel(doc);
      let saveDoc = await obj.save();
      data.push(saveDoc.toObject())
    }
    let { createApolloServer } = await import("#testutil/testApolloServer.mjs");
    let resolver = await import('#graphql/modules/project/projectTemplate.mjs');
    server = createApolloServer(resolver.default);
  })

  afterAll(async () => {
    // clear collection
    // await ProjectTemplateModel.deleteMany();
  })

  it("should list all project templates", async () => {
    const query = `
query {
  projectTemplates {
    id
    projectInfo {
      name
    }
  }
}
`
    const response = await server.executeOperation({
      query,
    })

    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    const docs = response.body.singleResult.data?.projectTemplates;
    expect(docs.length).toBeGreaterThanOrEqual(data.length);
    for (let i=0; i<data.length; i++) {
      let id = data[i]._id.toString();
      const doc = docs.find(e => e.id === id);
      expect(doc).toBeDefined();
      expect(doc.id).toBe(data[i]._id.toString())
      expect(doc.projectInfo.name).toBe(data[i].projectInfo.name);
    }
  })

  it("should retrieve one project templates by id", async () => {
    const query = `
query($id:ObjectID!) {
  projectTemplate(id:$id) {
    id
    projectInfo {
      name
    }
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        id: data[0]._id.toString(),
      }
    })

    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    const doc = response.body.singleResult.data?.projectTemplate;
    expect(doc.id).toBe(data[0]._id.toString());
    expect(doc.projectInfo.name).toBe(data[0].projectInfo.name);
  })

  it("should not retrieve project template with invalid id", async () => {
    const query = `
query($id:ObjectID!) {
  projectTemplate(id:$id) {
    id
  }
}
`
    // test missing variables
    const response = await server.executeOperation({
      query,
    })
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    const response2 = await server.executeOperation({
      query,
      variables: {
        id: "invalid id",
      }
    })
    expect(response2.body.kind).toBe('single');
    expect(response2.body.singleResult.errors).toBeDefined();

  })

  it("should create new project template", async() => {
    const projectTemplate = casual.projectTemplate;
    // console.log("projectTemplate", projectTemplate);

    const query = `
mutation($projectTemplate: ProjectTemplateInput!) {
  createProjectTemplate(projectTemplate:$projectTemplate) {
    id
  }
}    
`
    const response = await server.executeOperation({
      query,
      variables: {
        projectTemplate
      }
    })
    // console.log("create response", response.body.singleResult);
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();

    // check inserted into db
    const docs = await ProjectTemplateModel.find({ __t: null });
    let len = data.length;
    expect(docs.length).toBeGreaterThanOrEqual(len + 1);
    expect(docs[len].name).toBe(projectTemplate.name);
    data.push(docs[len].toObject())
  })

  it("should not create new project template with invalid parameters", async() => {
    const projectTemplate = casual.projectTemplate;
    // console.log("projectTemplate", projectTemplate);

    const query = `
mutation($projectTemplate: ProjectTemplateInput!) {
  createProjectTemplate(projectTemplate:$projectTemplate) {
    id
  }
}    
`
    // test missing name
    let invalidDoc = { ...projectTemplate };
    delete invalidDoc.projectInfo.name;
    let response = await server.executeOperation({
      query,
      variables: {
        projectTemplate
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    // test invalid name
    invalidDoc = { ...projectTemplate };
    invalidDoc.projectInfo.name = casual.randomString(129);
    response = await server.executeOperation({
      query,
      variables: {
        projectTemplate
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    invalidDoc = { ...projectTemplate };
    invalidDoc.projectInfo.name = "";
    response = await server.executeOperation({
      query,
      variables: {
        projectTemplate
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    // test invalid report description
    invalidDoc = { ...projectTemplate };
    invalidDoc.projectInfo.description = casual.randomString(257);
    response = await server.executeOperation({
      query,
      variables: {
        projectTemplate
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    // test invalid report title
    invalidDoc = { ...projectTemplate };
    invalidDoc.projectInfo.reportTitle = casual.randomString(129);
    response = await server.executeOperation({
      query,
      variables: {
        projectTemplate
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    // test invalid company
    invalidDoc = { ...projectTemplate };
    invalidDoc.projectInfo.company = casual.randomString(129);
    response = await server.executeOperation({
      query,
      variables: {
        projectTemplate
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

  })

  it("should update project template", async() => {
    const projectTemplate = casual.projectTemplate;
    // console.log("projectTemplate", projectTemplate);

    const dataLen = data.length;
    const id = data[dataLen-1]._id.toString();

    const query = `
mutation($id: ObjectID!, $projectTemplate: ProjectTemplateInput!) {
  updateProjectTemplate(id:$id, projectTemplate:$projectTemplate) {
    id
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        id,
        projectTemplate: {
          projectInfo: projectTemplate.projectInfo,
        }
      }
    })
    // console.log("update response", response.body.singleResult);
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();

    // check updated into db
    const doc = await ProjectTemplateModel.findOne({ _id: mongoose.Types.ObjectId(id) });
    expect(doc.projectInfo).toEqual(projectTemplate.projectInfo);
  })

  it("should not update project template with invalid id", async() => {
    const projectTemplate = casual.projectTemplate;
    // console.log("projectTemplate", projectTemplate);

    const query = `
mutation($id: ObjectID!, $projectTemplate: ProjectTemplateInput!) {
  updateProjectTemplate(id:$id, projectTemplate:$projectTemplate) {
    id
  }
}
`
    // test missing id
    const response = await server.executeOperation({
      query,
      variables: {
        projectTemplate: {
          projectInfo: projectTemplate.projectInfo,
        }
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    // test invalid id
    const response2 = await server.executeOperation({
      query,
      variables: {
        id: mongoose.Types.ObjectId().toString(),
        projectTemplate: {
          projectInfo: projectTemplate.projectInfo,
        }
      }
    })
    // check response
    expect(response2.body.kind).toBe('single');
    expect(response2.body.singleResult.errors).toBeDefined();

  })

  it("should clone project template", async() => {
    const origDoc = data[0];

    const query = `
mutation($id: ObjectID!) {
  cloneProjectTemplate(id:$id) {
    id
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        id: origDoc._id.toString(),
      }
    })
    // console.log("update response", response.body.singleResult);
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    const obj = response.body.singleResult.data.cloneProjectTemplate;

    // check updated into db
    // const docs = await ProjectTemplateModel.find({ __t: null }).sort({ _id: -1 }).limit(1);
    const doc = await ProjectTemplateModel.findOne({ _id: mongoose.Types.ObjectId(obj.id) });
    expect(doc).toBeDefined();
    expect(doc.projectInfo.name).toBe(`Copy of ${origDoc.projectInfo.name}`);
  })

  it("should not clone project template with invalid id", async() => {
    const origDoc = data[0];

    const query = `
mutation($id: ObjectID!) {
  cloneProjectTemplate(id:$id) {
    id
  }
}
`
    let response = await server.executeOperation({
      query,
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    response = await server.executeOperation({
      query,
      variables: {
        id: mongoose.Types.ObjectId().toString(),
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

  })

  it("should delete project template", async() => {
    const id = data[0]._id;

    let count = await ProjectTemplateModel.countDocuments({ _id: id });
    expect(count).toBe(1);

    const query = `
mutation($id: ObjectID!) {
  deleteProjectTemplate(id:$id)
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
    expect(response.body.singleResult.data?.deleteProjectTemplate).toBe(id.toString())

    // check deleted from db
    count = await ProjectTemplateModel.countDocuments({ _id: id });
    expect(count).toBe(0);
  })

  it("should not delete project template with invalid id", async() => {
    const query = `
mutation($id: ObjectID!) {
  deleteProjectTemplate(id:$id)
}
`
    let response = await server.executeOperation({
      query,
      variables: {
        // id: id.toString(),
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    response = await server.executeOperation({
      query,
      variables: {
        id: mongoose.Types.ObjectId()
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

  })

})