import { jest } from "@jest/globals";
import casual from "casual";
import mongoose from "mongoose";

casual.define("ObjectId", function () {
  return new mongoose.Types.ObjectId().toString();
});

casual.define("randomString", function (len) {
  if (typeof len !== "number") {
    len = 128; // default 128;
  }
  let str = "";
  for (let i = 0; i < len; i++) {
    str += casual.letter;
  }
  return str;
});

casual.define("algorithm", function () {
  const results = casual.array_of_words(10);
  return {
    data: {
      results,
    },
    inputSchema: {
      type: "object",
      required: ["arg1"],
      properties: {
        arg1: {
          type: "string",
          title: "Argument 1",
        },
        arg2: {
          type: "string",
          title: "Argument 2",
        },
      },
    },
    outputSchema: {
      type: "object",
      required: ["results"],
      properties: {
        results: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
    },
  };
});

casual.define("projectGlobalVars", function (count) {
  if (typeof count !== "number") {
    count = 1;
  }
  let ar = [];
  for (let i = 0; i < count; i++) {
    ar.push({
      key: casual.word,
      value: casual.word,
    });
  }
  return ar;
});

casual.define("reportPages", function (count) {
  if (typeof count !== "number") {
    count = 1;
  }
  let ar = [];
  for (let i = 0; i < count; i++) {
    ar.push({
      layouts: [
        {
          w: casual.integer(1, 12),
          h: casual.integer(1, 36),
          x: casual.integer(1, 12),
          y: casual.integer(1, 36),
          i: casual.randomString(15),
          minW: casual.integer(1, 12),
          maxW: casual.integer(1, 12),
          minH: casual.integer(1, 36),
          maxH: casual.integer(1, 36),
          static: false,
        },
      ],
      reportWidgets: [
        {
          widgetGID: "aiverify.tests:testchart",
          key: "1679406557587",
          layoutItemProperties: {
            justifyContent: casual.random_element(["left", "center", "right"]),
            alignItems: casual.random_element(["top", "center", "bottom"]),
            color: casual.rgb_hex,
            bgcolor: casual.rgb_hex,
          },
          properties: {
            [casual.word]: casual.word,
          },
        },
      ],
    });
  }
  return ar;
});

casual.define("projectTemplate", function () {
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
  };
});

casual.define("multipleProjectTemplates", function (count) {
  if (typeof count !== "number") {
    count = 2;
  }
  let ar = [];
  for (let i = 0; i < count; i++) {
    ar.push(casual.projectTemplate);
  }
  return ar;
});

casual.define("testInformation", function (count) {
  if (typeof count !== "number") {
    count = 2;
  }
  let ar = [];
  for (let i = 0; i < count; i++) {
    ar.push({
      algorithmGID: casual.uuid,
      // isTestArgumentsValid: true,
      testArguments: {
        arg1: "value1",
        arg2: "value2",
      },
    });
  }
  return ar;
});

casual.define("project", function () {
  const template = casual.projectTemplate;
  delete template.fromPlugin;
  return {
    ...template,
    inputBlockData: {},
    testInformationData: casual.testInformation(1),
  };
});

casual.define("multipleProjects", function (count) {
  if (typeof count !== "number") {
    count = 2;
  }
  let ar = [];
  for (let i = 0; i < count; i++) {
    ar.push(casual.project);
  }
  return ar;
});

// report status: ["NoReport","RunningTests","GeneratingReport","ReportGenerated","ReportError"]
casual.define("report", function (project, status) {
  let tests = [];
  for (let test of project.testInformationData) {
    // let status = casual.random_element(["Pending", "Running", "Cancelled", "Success", "Error" ])
    let obj = {
      algorithmGID: test.algorithmGID,
      testArguments: test.testArguments,
      status: "Pending",
    };
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
  };
  if (report.status === "ReportGenerated") {
    let totalTestTimeTaken = 0;
    report = {
      ...report,
      timeStart: casual.moment.toDate(),
      timeTaken: totalTestTimeTaken + casual.integer,
      totalTestTimeTaken,
      inputBlockData: project.inputBlockData,
      tests,
    };
  }
  return report;
});

casual.define("modelFile", function () {
  const d = casual.moment.toDate();
  const filename = `${casual.word}.sav`;
  return {
    filename: filename,
    name: filename,
    filePath: `/home/test/uploads/model/${filename}`,
    ctime: d,
    description: casual.short_description,
    status: "Valid",
    size: "502.71 KB",
    modelType: casual.random_element(["Classification", "Regression"]),
    serializer: "pickle",
    modelFormat: "sklearn",
    errorMessages: "",
    type: "File",
    createdAt: d,
    updatedAt: d,
  };
});

/**
 * Random data for model API models
 * @param {string} encoding - requestBody, path, query
 * @param {boolean} isArray - whether is array
 */
casual.define("modelAPI", function (encoding, isArray) {
  let modelAPI = {
    method: encoding === "requestBody" ? "POST" : "GET",
    url: casual.url.toLowerCase(),
    response: {
      statusCode: 200,
      mediaType: "text/plain",
      schema: {
        type: "integer",
      },
    },
    requestConfig: {
      sslVerify: false,
      connectionTimeout: -1,
      rateLimit: -1,
      rateLimitTimeout: -1,
      batchLimit: -1,
      connectionRetries: 3,
      maxConnections: -1,
      batchStrategy: "none",
    },
  };

  const authType = casual.random_element([
    "No Auth",
    "Bearer Token",
    "Basic Auth",
  ]);
  modelAPI.authType = authType;
  switch (authType) {
    case "Bearer Token":
      modelAPI.authTypeConfig = {
        token: casual.uuid,
      };
      break;
    case "Basic Auth":
      modelAPI.authTypeConfig = {
        username: casual.word,
        password: casual.password,
      };
      break;
  }

  let randomProperties = (fieldName) => {
    let props = [];
    for (let i = 0; i < casual.integer(1, 10); i++) {
      props.push({
        [fieldName]: casual.word,
        type: casual.random_element(["string", "number", "integer", "boolean"]),
      });
    }
    return props;
  };

  if (encoding === "requestBody") {
    modelAPI.requestBody = {
      isArray,
      mediaType: casual.random_element([
        "application/x-www-form-urlencoded",
        "multipart/form-data",
      ]),
      properties: randomProperties("field"),
    };
  } else if (encoding === "path") {
    const pathParams = randomProperties("name");
    modelAPI.parameters = {
      paths: {
        mediaType: isArray ? "application/json" : "none",
        isArray,
        pathParams,
      },
    };
    if (isArray) {
      modelAPI.urlParams = "/{data}";
    } else {
      modelAPI.urlParams = pathParams.reduce((acc, param) => {
        acc += `/{${param.name}}`;
        return acc;
      }, "");
    }
  } else if (encoding === "query") {
    modelAPI.parameters = {
      queries: {
        mediaType: isArray ? "application/json" : "none",
        name: "data", // not required for non-array but doesn't matter
        isArray,
        queryParams: randomProperties("name"),
      },
    };
  }

  return {
    name: casual.word,
    description: casual.short_description,
    modelType: casual.random_element(["Classification", "Regression"]),
    modelAPI,
  };
});

casual.define("testDataset", function () {
  const d = casual.moment.toDate();
  const filename = `${casual.word}.sav`;
  return {
    filename,
    name: filename,
    type: "File",
    filePath: `/home/test/uploads/data/${filename}`,
    ctime: d,
    description: casual.short_description,
    status: "Valid",
    size: "68.33 KB",
    serializer: "pickle",
    dataFormat: "pandas",
    errorMessages: "",
    dataColumns: [
      {
        name: "age",
        datatype: "int64",
        label: "age",
      },
      {
        name: "gender",
        datatype: "int64",
        label: "gender",
      },
      {
        name: "race",
        datatype: "int64",
        label: "race",
      },
      {
        name: "income",
        datatype: "int64",
        label: "income",
      },
      {
        name: "employment",
        datatype: "int64",
        label: "employment",
      },
      {
        name: "employment_length",
        datatype: "int64",
        label: "employment_length",
      },
      {
        name: "total_donated",
        datatype: "int64",
        label: "total_donated",
      },
      {
        name: "num_donation",
        datatype: "int64",
        label: "num_donation",
      },
      {
        name: "donation",
        datatype: "int64",
        label: "donation",
      },
    ],
    createdAt: d,
    updatedAt: d,
    numCols: 6,
    numRows: 1235,
  };
});

casual.define("modelAndDatasets", function (modelType) {
  let testDataset = casual.testDataset;
  let modelAndDatasets = {
    groundTruthColumn: "donation",
    testDataset,
    groundTruthDataset: testDataset,
  };
  if (modelType === "File") {
    modelAndDatasets.model = casual.modelFile;
  } else {
    const model = casual.modelAPI("requestBody", false);
    model.type = "API";
    model.status = "Valid";
    modelAndDatasets.model = model;
    modelAndDatasets.apiConfig = {
      requestBody: {},
    };
  }
  return modelAndDatasets;
});

casual.define("multipleDatasets", function (count) {
  if (typeof count !== "number") {
    count = 2;
  }
  let ar = [];
  for (let i = 0; i < count; i++) {
    ar.push(casual.testDataset);
  }
  return ar;
});

casual.define("multipleModels", function (count) {
  if (typeof count !== "number") {
    count = 2;
  }
  let ar = [];
  for (let i = 0; i < count; i++) {
    ar.push(casual.modelFile);
  }
  return ar;
});

export default casual;
// export {mockModel, mockTestDataset};
