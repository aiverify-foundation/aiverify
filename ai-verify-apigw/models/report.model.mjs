/**
 * Plugin mongoose models. NOTE: NOT USED
 */

import { Schema, model } from "mongoose";

const errorMessageSchema = new Schema({
  code: String,
  severity: {
    type: String,
    enum: ["information", "warning", "critical"],
    required: true,
  },
  description: { type: String, required: true },
  category: String,
  origin: String,
  component: String,
});

const testEngineTaskSchema = new Schema({
  algorithmGID: { type: String, required: true },
  testArguments: { type: Object, required: false, default: {} }, // snapshot of test arguments
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Running", "Cancelled", "Success", "Error"],
  },
  progress: { type: Number, default: 0, min: 0, max: 100 }, // progress in percentage
  timeStart: { type: Date },
  timeTaken: { type: Number }, // in seconds
  output: { type: Object },
  logFile: { type: String },
  errorMessages: [errorMessageSchema],
});

/**
 * Report schema
 */
const schema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: "ProjectModel" },
  projectSnapshot: model("ProjectModel").schema, // save snapshot of project, not reference
  status: {
    type: String,
    required: true,
    enum: [
      "NoReport",
      "RunningTests",
      "GeneratingReport",
      "ReportGenerated",
      "ReportError",
    ],
    default: "NoReport",
  },
  timeStart: { type: Date },
  timeTaken: { type: Number }, // in seconds
  totalTestTimeTaken: { type: Number }, // total time taken to run the tests
  inputBlockData: { type: Object }, // snapshot of input block data
  tests: [testEngineTaskSchema],
});

export const ReportModel = model("ReportModel", schema);
