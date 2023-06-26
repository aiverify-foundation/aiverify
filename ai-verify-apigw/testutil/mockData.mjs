import { jest } from '@jest/globals';
import casual from 'casual';
import mongoose from 'mongoose';

casual.define('ObjectId', function() {
  return mongoose.Types.ObjectId().toString();
})

casual.define('randomString', function(len) {
  if (typeof len !== 'number') {
    len = 128; // default 128;
  }
  let str = "";
  for (let i=0; i<len; i++) {
    str += casual.letter;
  }
  return str;
})

casual.define('algorithm', function() {
  const results = casual.array_of_words(10);
  return {
    data: {
      results
    },
    inputSchema: {
      "type": "object",
      "required": [
        "arg1"
      ],
      "properties": {
        "arg1": {
          "type": "string",
          "title": "Argument 1"
        },
        "arg2": {
          "type": "string",
          "title": "Argument 2"
        }
      }
    },
    outputSchema: {
      "type": "object",
      "required": [
        "results"
      ],
      "properties": {
        "results": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
  }
})

casual.define('projectGlobalVars', function(count) {
  if (typeof count !== 'number') {
    count=1;
  }
  let ar = [];
  for (let i=0; i<count; i++) {
    ar.push({
      key: casual.word,
      value: casual.word,
    })
  }
  return ar;
})

casual.define('reportPages', function(count) {
  if (typeof count !== 'number') {
    count=1;
  }
  let ar = [];
  for (let i=0; i<count; i++) {
    ar.push({
      layouts: [{
        "w": casual.integer(1,12),
        "h": casual.integer(1,36),
        "x": casual.integer(1,12),
        "y": casual.integer(1,36),
        "i": casual.randomString(15),
        "minW": casual.integer(1,12),
        "maxW": casual.integer(1,12),
        "minH": casual.integer(1,36),
        "maxH": casual.integer(1,36),
        "static": false
      }],
      reportWidgets: [
        {
          "widgetGID": "aiverify.tests:testchart",
          "key": "1679406557587",
          "layoutItemProperties": {
            "justifyContent": casual.random_element(['left', 'center', 'right']),
            "alignItems": casual.random_element(['top', 'center', 'bottom']),
            "color": casual.rgb_hex,
            "bgcolor": casual.rgb_hex
          },
          "properties": {
            [casual.word]: casual.word
          }
        },
      ]
    })
  }
  return ar;
})

casual.define('projectTemplate', function() {
  const globalVars = casual.projectGlobalVars(1);
  const pages = casual.reportPages(1);
  return {
    fromPlugin: false,
    projectInfo: {
      name: casual.full_name,
      description: casual.short_description,
      reportTitle: casual.title,
      company: casual.company_name,
    },
    globalVars,
    pages,
  }
})

casual.define('multipleProjectTemplates', function(count) {
  if (typeof count !== 'number') {
    count=2;
  }
  let ar = [];
  for (let i=0; i<count; i++) {
    ar.push(casual.projectTemplate)
  }
  return ar;
})

casual.define('testInformation', function(count) {
  if (typeof count !== 'number') {
    count=2;
  }
  let ar = [];
  for (let i=0; i<count; i++) {
    ar.push({
      algorithmGID: casual.uuid,
      // isTestArgumentsValid: true,
      testArguments: {
        "arg1": "value1",
        "arg2": "value2",
      }
    })
  }
  return ar;
})

casual.define('project', function() {
  const template = casual.projectTemplate;
  delete template.fromPlugin;
  return {
    ...template,
    inputBlockData: {},
    testInformationData: casual.testInformation(1),
    modelAndDatasets: casual.modelAndDatasetInput
  }
})

casual.define('multipleProjects', function(count) {
  if (typeof count !== 'number') {
    count=2;
  }
  let ar = [];
  for (let i=0; i<count; i++) {
    ar.push(casual.project)
  }
  return ar;
})

// report status: ["NoReport","RunningTests","GeneratingReport","ReportGenerated","ReportError"]
casual.define('report', function(project, status) {
  let tests = [];
  for (let test of project.testInformationData) {
    // let status = casual.random_element(["Pending", "Running", "Cancelled", "Success", "Error" ])
    let obj = {
      algorithmGID: test.algorithmGID,
      testArguments: test.testArguments,
      status: "Pending",
    }
    // if (status === "Success") {
    //   const timeTaken = casual.integer;
    //   totalTestTimeTaken += timeTaken;
    //   obj = {
    //     ...obj,
    //     progress: 100,
    //     timeStart: casual.moment.toDate(),
    //     timeTaken,
    //     output: {},
    //   }
    // }
    tests.push(obj); 
  }
  let report = {
    project: project._id,
    status,
    tests,
  }
  if (report.status === "ReportGenerated") {
    let totalTestTimeTaken = 0;
    report = {
      ...report,
      timeStart: casual.moment.toDate(),
      timeTaken: totalTestTimeTaken + casual.integer,
      totalTestTimeTaken,
      inputBlockData: project.inputBlockData,
      tests,
    }
  }
  return report;
})

casual.define('modelAndDataset', function() {
  return {
    model: { modelType: casual.random_element(["Classification","Regression"]) },
    testDataset: {},
    groundTruthDataset: {},
    groundTruthColumn: 'testcolumn',
    toObject: jest.fn().mockImplementation(() => ({
      model: {},
      testDataset: {},
      groundTruthDataset: {},
      groundTruthColumn: 'testcolumn'
    }))
  }
})

casual.define('modelAndDatasetInput', function() {
  return {
    modelId: casual.ObjectId,
    testDatasetId: casual.ObjectId,
    groundTruthDatasetId: casual.ObjectId,
    groundTruthColumn: 'testcolumn',
  }
})

export default casual;