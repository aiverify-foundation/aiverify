import {jest} from '@jest/globals'
import mongoose from 'mongoose';
import casual from '#testutil/mockData.mjs';


describe("Test Project GraphQL queries", () => {
  let server;
  let ProjectModel;
  let ProjectTemplateModel;
  let testEngineQueue;
  let data = [];
  let templateData = [];
  let report;

  beforeAll(async() => {
    // set some mocks first
    jest.unstable_mockModule("#lib/testEngineQueue.mjs", () => {
      return import('#mocks/lib/testEngineQueue.mjs');
    });
    testEngineQueue = await import("#lib/testEngineQueue.mjs");
    
    jest.unstable_mockModule("#lib/plugin.mjs", () => {
      return import('#mocks/lib/plugin.mjs');
    });

    jest.unstable_mockModule("#lib/report.mjs", () => {
      return import("#mocks/lib/report.mjs");
    });
    report = await import("#lib/report.mjs");
    
    const models = await import("#models");
    ProjectModel = models.ProjectModel;
    ProjectTemplateModel = models.ProjectTemplateModel;
    // make sure collection empty
    // await ProjectModel.deleteMany();
    // create some initial data
    const docs = casual.multipleProjects(2);
    for (const doc of docs) { 
      doc.__t = 'ProjectModel';
      const obj = new ProjectModel(doc);
      let saveDoc = await obj.save();
      data.push(saveDoc.toObject())
    }
    const docs2 = casual.multipleProjectTemplates(1);
    for (const doc of docs2) { 
      const obj = new ProjectTemplateModel(doc);
      let saveDoc = await obj.save();
      templateData.push(saveDoc.toObject())
    }
    let { createApolloServer } = await import("#testutil/testApolloServer.mjs");
    let resolver = await import('#graphql/modules/project/project.mjs');
    server = createApolloServer(resolver.default);
  })

  afterAll(async () => {
    // clear collection
    // await ProjectModel.deleteMany();
  })

  beforeEach(async () => {
    jest.clearAllMocks();
  })

  it("should list all projects", async () => {
    const query = `
query {
  projects {
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
    const docs = response.body.singleResult.data?.projects;
    expect(docs.length).toBeGreaterThanOrEqual(data.length);
    for (let i=0; i<data.length; i++) {
      const doc = docs.find(e => e.id === data[i]._id.toString());
      expect(doc).toBeDefined();
      expect(doc.id).toBe(data[i]._id.toString())
      expect(doc.projectInfo.name).toBe(data[i].projectInfo.name);
    }
  })

  it("should retrieve one project by id", async () => {
    const query = `
query($id:ObjectID!) {
  project(id:$id) {
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
    const doc = response.body.singleResult.data?.project;
    expect(doc.id).toBe(data[0]._id.toString());
    expect(doc.projectInfo.name).toBe(data[0].projectInfo.name);
  })

  it("should not retrieve project with invalid id", async () => {
    const query = `
query($id:ObjectID!) {
  project(id:$id) {
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

  it("should query by text search", async() => {
    const query = `
query($text: String) {
  projectsByTextSearch(text:$text) {
    id
    projectInfo {
      name
      description
    }
  }
}
`
    const name = data[0].projectInfo.name;
    const nameWords = name.split(" ");
    // console.log("query name", name);
    const description = data[1].projectInfo.description;
    // console.log("query description", description);
    const partialDescription = description.substr(0, 20);
    // console.log("query partialDescription", partialDescription);
    const descriptionWords = description.split(" ");
    // console.log("query name", description);

    // test can search full name
    let response = await server.executeOperation({
      query,
      variables: {
        text: `\"${name}\"`,
      }
    })

    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    let docs = response.body.singleResult.data?.projectsByTextSearch;
    // console.log("docs", docs);
    expect(docs.length).toBe(1);
    expect(docs[0].projectInfo.name).toBe(name);

    // test can search partial name
    response = await server.executeOperation({
      query,
      variables: {
        text: casual.random_element(nameWords)
      }
    })
  
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    docs = response.body.singleResult.data?.projectsByTextSearch;
    expect(docs.length).toBe(1);
    expect(docs[0].projectInfo.name).toBe(name);

    // test can search description
    response = await server.executeOperation({
      query,
      variables: {
        text: `\"${description}\"`,
      }
    })

    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    docs = response.body.singleResult.data?.projectsByTextSearch;
    // console.log("docs", docs);
    expect(docs.length).toBe(1);
    expect(docs[0].projectInfo.description).toBe(description);

    // test can search partial description
    response = await server.executeOperation({
      query,
      variables: {
        text: partialDescription,
      }
    })
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    docs = response.body.singleResult.data?.projectsByTextSearch;
    expect(docs.length).toBeGreaterThan(0);
    // expect(docs[0].projectInfo.description).toBe(description);
  })

  it("should create new project", async() => {
    const project = casual.project;
    // console.log("project", project);

    const query = `
mutation($project: ProjectInput!) {
  createProject(project:$project) {
    id
  }
}    
`
    const response = await server.executeOperation({
      query,
      variables: {
        project
      }
    })
    // console.log("create response", response.body.singleResult);
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    const obj = response.body.singleResult.data.createProject;

    // check inserted into db
    const doc = await ProjectModel.findOne({ _id: mongoose.Types.ObjectId(obj.id) });
    let len = data.length;
    expect(doc.name).toBe(project.name);
    data.push(doc.toObject())
  })

  it("should not create new project with invalid parameters", async() => {
    const project = casual.project;
    // console.log("project", project);

    const query = `
mutation($project: ProjectInput!) {
  createProject(project:$project) {
    id
  }
}    
`
    // test missing name
    let invalidDoc = { ...project };
    delete invalidDoc.projectInfo.name;
    let response = await server.executeOperation({
      query,
      variables: {
        project
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

  })

  it("should update project", async() => {
    const project = casual.project;
    // console.log("project", project);

    const dataLen = data.length;
    const id = data[dataLen-1]._id.toString();

    const query = `
mutation($id: ObjectID!, $project: ProjectInput!) {
  updateProject(id:$id, project:$project) {
    id
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        id,
        project: {
          projectInfo: project.projectInfo,
        }
      }
    })
    // console.log("update response", response.body.singleResult);
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();

    // check updated into db
    const doc = await ProjectModel.findOne({ _id: mongoose.Types.ObjectId(id) });
    expect(doc.projectInfo).toEqual(project.projectInfo);
  })

  it("should not update project with invalid id", async() => {
    const project = casual.project;
    // console.log("project", project);

    const query = `
mutation($id: ObjectID!, $project: ProjectInput!) {
  updateProject(id:$id, project:$project) {
    id
  }
}
`
    // test missing id
    const response = await server.executeOperation({
      query,
      variables: {
        project: {
          projectInfo: project.projectInfo,
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
        project: {
          projectInfo: project.projectInfo,
        }
      }
    })
    // check response
    expect(response2.body.kind).toBe('single');
    expect(response2.body.singleResult.errors).toBeDefined();

  })

  it("should clone project", async() => {
    const origDoc = data[0];
    // console.log("origDoc", origDoc)

    const query = `
mutation($id: ObjectID!) {
  cloneProject(id:$id) {
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
    const obj = response.body.singleResult.data.cloneProject;

    // check updated into db
    const doc = await ProjectModel.findOne({ _id: mongoose.Types.ObjectId(obj.id) });
    expect(doc.projectInfo.name).toBe(`Copy of ${origDoc.projectInfo.name}`);
  })

  it("should not clone project with invalid id", async() => {
    const origDoc = data[0];

    const query = `
mutation($id: ObjectID!) {
  cloneProject(id:$id) {
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

  it("should create project from template", async() => {
    const project = casual.project;
    const template = templateData[0];

    const query = `
mutation($project: ProjectInput!, $templateId: String!) {
  createProjectFromTemplate(project:$project, templateId:$templateId) {
    id
    projectInfo {
      name
      description
      reportTitle
      company
    }
    pages {
      layouts {
        h
        i
        isBounded
        isDraggable
        isResizable
        maxH
        maxW
        minH
        minW
        resizeHandles
        static
        w
        x
        y
      }
    }
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        project: { projectInfo: project.projectInfo },
        templateId: template._id.toString(),
      }
    })

    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();

    const obj = response.body.singleResult.data.createProjectFromTemplate;
    expect(obj.projectInfo).toEqual(project.projectInfo);
    expect(obj.pages.length).toBe(template.pages.length);
  })


  it("should save project as template", async() => {
    const proj = data[0];
    const template = casual.projectTemplate;

    const query = `
mutation($projectId: ObjectID!, $templateInfo: ProjectInformationInput!) {
  saveProjectAsTemplate(projectId:$projectId, templateInfo:$templateInfo) {
    id
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        projectId: proj._id.toString(),
        templateInfo: template.projectInfo,
      }
    })

    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();

    const obj = response.body.singleResult.data.saveProjectAsTemplate;
    const doc = await ProjectTemplateModel.findOne({ _id: obj.id });
    expect(doc).toBeDefined();
    expect(doc.projectInfo).toEqual(template.projectInfo);
    expect(doc.pages.length).toBe(proj.pages.length);
  })


  it("should generate report without tests", async() => {
    const proj = data[0];

    const query = `
mutation($projectID: ObjectID!, $algorithms: [String]!) {
  generateReport(projectID:$projectID, algorithms:$algorithms) {
    projectID
    status
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        projectID: proj._id.toString(),
        algorithms: [],
      }
    })

    const obj = response.body.singleResult.data.generateReport;
    
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(obj.projectID).toEqual(proj._id);
    expect(obj.status).toBe("GeneratingReport");
    report.generateReport.mockResolvedValue();
    expect(report.generateReport).toHaveBeenCalled();
  })

  it("should generate report with tests", async() => {
    const proj = data[1];
    const mad = casual.modelAndDataset;

    const algorithms = proj.testInformationData.map(test => test.algorithmGID);

    const query = `
mutation($projectID: ObjectID!, $algorithms: [String]!) {
  generateReport(projectID:$projectID, algorithms:$algorithms) {
    projectID
    status
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        projectID: proj._id.toString(),
        algorithms,
      }
    })

    const obj = response.body.singleResult.data.generateReport;
    
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(obj.projectID).toEqual(proj._id);
    expect(obj.status).toBe("RunningTests");
    report.generateReport.mockResolvedValue();
    expect(report.generateReport).not.toHaveBeenCalled();
    testEngineQueue.queueTests.mockResolvedValue();
    expect(testEngineQueue.queueTests).toHaveBeenCalled();
  })

  it("should not generate reports that are still running or generating", async() => {
    const proj1 = data[0];
    const proj2 = data[1];
    const mad = casual.modelAndDataset;

    const algorithms = proj2.testInformationData.map(test => test.algorithmGID);

    const query = `
mutation($projectID: ObjectID!, $algorithms: [String]!, $modelAndDatasets: ModelAndDatasetsReportInput) {
  generateReport(projectID:$projectID, algorithms:$algorithms, modelAndDatasets:$modelAndDatasets) {
    projectID
  }
}
`
    let response = await server.executeOperation({
      query,
      variables: {
        projectID: proj1._id.toString(),
        algorithms: [],
        modelAndDatasets: mad,
      }
    })

    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();

    response = await server.executeOperation({
      query,
      variables: {
        projectID: proj2._id.toString(),
        algorithms: algorithms,
        modelAndDatasets: mad,
      }
    })

    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeDefined();
  })

  it("should cancel test run", async() => {
    const proj = data[1];

    const algorithms = proj.testInformationData.map(test => test.algorithmGID);

    const query = `
mutation($projectID: ObjectID!, $algorithms: [String]!) {
  cancelTestRuns(projectID:$projectID, algorithms:$algorithms) {
    projectID
    status
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        projectID: proj._id.toString(),
        algorithms: algorithms,
      }
    })

    const obj = response.body.singleResult.data.cancelTestRuns;

    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    expect(obj.projectID).toBe(proj._id.toString());
    // expect(obj.status).toBe("GeneratingReport");
    report.generateReport.mockResolvedValue();
    expect(report.generateReport).toHaveBeenCalled();
  })

  it("should get report", async() => {
    const projectID = data[0]._id;

    const query = `
query($projectID: ObjectID!) {
  report(projectID:$projectID) {
    projectID
    status
  }
}
`
    const response = await server.executeOperation({
      query,
      variables: {
        projectID: projectID.toString(),
      }
    })
    // check response
    expect(response.body.kind).toBe('single');
    expect(response.body.singleResult.errors).toBeUndefined();
    const obj = response.body.singleResult.data.report;
    expect(obj.projectID).toBe(projectID.toString());
    expect(obj.status).toBe("GeneratingReport")
  })

  it("should delete project", async() => {
    const id = data[0]._id;

    let count = await ProjectModel.countDocuments({ _id: id });
    expect(count).toBe(1);

    const query = `
mutation($id: ObjectID!) {
  deleteProject(id:$id)
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
    expect(response.body.singleResult.data?.deleteProject).toBe(id.toString())

    // check deleted from db
    count = await ProjectModel.countDocuments({ _id: id });
    expect(count).toBe(0);
  })

  it("should not delete project with invalid id", async() => {
    const query = `
mutation($id: ObjectID!) {
  deleteProject(id:$id)
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



});