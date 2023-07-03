/**
 * Project mongoose models
 */

import { Schema, model } from "mongoose";
// import { componentDependencySchema } from './plugin.model.mjs';
import { REPORT_DIRNAME, getReportFilename } from "../lib/report.mjs";
import fs from "node:fs";
import path from "node:path";
import { Validator } from "jsonschema";
const validator = new Validator();
import { getAlgorithmInputSchema } from "#lib/plugin.mjs";

const pageSchema = new Schema({
  layouts: [Object], // dashboard grid layout
  reportWidgets: [
    {
      widgetGID: { type: String },
      key: { type: String }, // layout item key
      layoutItemProperties: {
        justifyContent: { type: String, default: "left" },
        alignItems: { type: String, default: "top" },
        textAlign: { type: String, default: "left" },
        color: { type: String },
        bgcolor: { type: String },
      },
      properties: { type: Object },
    },
  ],
});

export const componentDependencySchema = new Schema({
  type: { type: String, required: true, enum: ["Algorithm", "InputBlock"] },
  gid: { type: String, required: true },
  version: { type: String, required: true },
});

const projectTemplateSchema = new Schema(
  {
    fromPlugin: {
      type: Boolean,
      default: false,
    },
    projectInfo: {
      name: { type: String },
      description: { type: String },
      reportTitle: { type: String },
      company: { type: String },
    },
    pages: [pageSchema],
    dependencies: [componentDependencySchema],
    inputBlockGIDs: [{ type: String }],
    globalVars: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

projectTemplateSchema.index({
  "projectInfo.name": "text",
  "projectInfo.description": "text",
});

export const ProjectTemplateModel = model(
  "ProjectTemplateModel",
  projectTemplateSchema
);

/**
 * Configuration specific to configuration data for API connector
 */
const apiConfigSchema = new Schema({
  requestBody: { type: Object },
  parameters: { type: Object },
});

export const projectSchema = new Schema(
  {
    template: { type: Schema.Types.ObjectId, ref: "ProjectTemplateModel" }, // reference to template used
    inputBlockData: { type: Object, default: {} },
    testInformationData: [
      {
        algorithmGID: { type: String },
        // isTestArgumentsValid: { type: Boolean },
        testArguments: { type: Object, default: {} },
      },
    ],
    modelAndDatasets: {
      model: { type: Schema.Types.ObjectId, ref: "ModelFileModel" },
      apiConfig: apiConfigSchema,
      testDataset: { type: Schema.Types.ObjectId, ref: "DatasetModel" },
      groundTruthDataset: { type: Schema.Types.ObjectId, ref: "DatasetModel" },
      groundTruthColumn: { type: String },
    },
    report: { type: Schema.Types.ObjectId, ref: "ReportModel" },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

projectSchema.statics.isTestArgumentsValid = async function (testInfo) {
  const inputSchema = await getAlgorithmInputSchema(testInfo.algorithmGID);
  let data = {};
  if (testInfo.testArguments) {
    data = testInfo.testArguments;
  }
  const res = validator.validate(data, inputSchema);
  return res.valid;
};

/**
 * Middeware to auto populate model and datasets
 */
projectSchema.pre("find", function () {
  this.populate("modelAndDatasets.model");
  this.populate("modelAndDatasets.testDataset");
  this.populate("modelAndDatasets.groundTruthDataset");
});

projectSchema.pre("findOne", function () {
  this.populate("modelAndDatasets.model");
  this.populate("modelAndDatasets.testDataset");
  this.populate("modelAndDatasets.groundTruthDataset");
});

/**
 * Middleware to cascade delete corresponding report record
 */
projectSchema.pre("findOneAndDelete", async function () {
  // import { ReportModel } from './report.model.mjs';
  const projectId = this.getQuery()._id;
  const filename = getReportFilename(projectId);
  const pdf_path = path.join(REPORT_DIRNAME, filename);
  // console.log("pdf_path", pdf_path)
  if (fs.existsSync(pdf_path)) {
    console.log("rm");
    fs.rmSync(pdf_path);
  }
  const ReportModel = model("ReportModel");
  await ReportModel.deleteMany({ project: projectId });
});

export const ProjectModel = ProjectTemplateModel.discriminator(
  "ProjectModel",
  projectSchema
);
