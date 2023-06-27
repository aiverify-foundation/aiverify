import { Schema, model } from 'mongoose';

const PRIMITIVE_TYPES = ["string", "number", "integer", "boolean"];
const ALL_TYPES = [...PRIMITIVE_TYPES, "array", "object"];

const modelAPIAdditionalHeadersSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: PRIMITIVE_TYPES },
  value: { type: Object, required: true },
})

const modelAPIParametersSchema = new Schema({
  subpath: { type: String },
  pathParams: [{
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ALL_TYPES },
    itemType: { type: String, enum: PRIMITIVE_TYPES }, // only applicate if "type" is "array"
    style: { type: String, enum: ["simple", "label", "matrix"], default: "simple" },
    explode: { type: Boolean, default: false }
  }],
  queryParams: [{
    name: { type: String, required: true },
    type: { type: String, required: true, enum: ALL_TYPES },
    itemType: { type: String, enum: PRIMITIVE_TYPES }, // only applicate if "type" is "array"
    style: { type: String, enum: ["form", "spaceDelimited", "pipeDelimited", "deepObject"], default: "form" },
    explode: { type: Boolean, default: true }
  }]
})

const modelAPIRequestBodySchema = new Schema({
  mediaType: { type: String, required: true, enum: ["none", "multipart/form-data", "application/x-www-form-urlencoded"] },
  properties: [{
    field: { type: String, required: true },
    type: { type: String, required: true, enum: ALL_TYPES },
    itemType: { type: String, enum: PRIMITIVE_TYPES }, // only applicate if "type" is "array"
    style: { type: String, enum: ["form", "spaceDelimited", "pipeDelimited", "deepObject"], default: "form" },
    explode: { type: Boolean, default: true }
  }]
})

const modelAPISchema = new Schema({
  method: { type: String, required: true, enum: ["POST", "GET"] },
  url: { type: String, required: true },
  authType: { type: String, required: true, enum: ["No Auth", "Bearer Token", "Basic Auth"], default: "No Auth" },
  authTypeConfig: { type: Object },
  additionalHeaders: [modelAPIAdditionalHeadersSchema],
  parameters: modelAPIParametersSchema,
  requestBody: modelAPIRequestBodySchema,
  response: {
    statusCode: { type: Number, required: true, default: 200 },
    mediaType: { type: String, required: true, enum: ["text/plain", "application/json"] },
    type: { type: String, enum: ALL_TYPES, default: "integer" },
    field: { type: String }, // for object, define the prediction field use dot, e.g. xxx.yyy, to denote nested field
  },
  requestConfig: {
    rateLimit: { type: Number, required: true },
    batchStrategy: {  type: String, required: true, enum: ["none","multipart"] },
    batchLimit: { type: Number },
    maxConnections: { type: Number, required: true },
    requestTimeout: { type: Number, required: true },
  }
})

const modelFileSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, default: "File", enum: ["File", "Folder", "Pipeline", "API"] },
  filename: { type: String }, // for non-API type
  filePath: { type: String }, // for non-API type
  modelAPI: { type: modelAPISchema }, // for API type
  ctime: { type: Date },
  description: { type: String, required: false },
  status: { type: String, default: "Pending", enum: ["Pending", "Valid", "Invalid", "Error", "Cancelled", "Temp"] },
  size: { type: String },
  modelType: { type: String, required: false, enum: ["Classification", "Regression"] },
  serializer: { type: String },
  modelFormat: { type: String },
  errorMessages: { type: String },
}, {
  timestamps: { createdAt: true, updatedAt: true }
});

export const ModelFileModel = model('ModelFileModel', modelFileSchema);


// const modelSchema = new Schema({
//     name: { type: String, required: true },
//     description: { type: String, required: false },
//     mode: { type: String, enum: ["API","Upload"] },
//     algorithmType: { type: String, default: "valid", enum: ["pending","valid","invalid"]  },
// });


// api model schema?