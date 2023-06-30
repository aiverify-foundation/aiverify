import { Schema, model } from 'mongoose';
import _ from 'lodash';

const PRIMITIVE_TYPES = ["string", "number", "integer", "boolean"];
const ALL_TYPES = [...PRIMITIVE_TYPES, "array", "object"];

const modelAPIAdditionalHeadersSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true, enum: PRIMITIVE_TYPES },
  value: { type: Object, required: true },
})

const modelAPIParametersSchema = new Schema({
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
  urlParams: { type: String },
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
  modelAPI: { type: modelAPISchema, validate: {
    validator: function(api) {
      return new Promise((resolve, reject) => {
        try {
          const spec = _exportModelAPI(api);
          if (spec)
            resolve(true);
          else
            reject(new Error('Invalid model API'))
        } catch (err) {
          reject(err);
        }
      })
    },
    message: props => `ModelAPI is invalid`
  } }, // for API type
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

// very simple URL regex match
const _url_pattern = /^(?<base>https?:\/\/(?:[a-z0-9.@:])+)(?<path>\/?[^?]+)(?<query>\?\/?.+)?/i;
const _url_path_pattern = /\{([a-z0-9_\-\s]+)\}/ig;

modelFileSchema.methods.exportModelAPI = function() {
  if (this.type !== "API") {
    throw new Error("Model is not of type API")
  }
  return _exportModelAPI(this.modelAPI);
}

function _exportModelAPI(modelAPI) {
  // const modelAPI = this.modelAPI;
  // console.log("exportModelAPI", modelAPI)
  let spec = {
    "openapi": "3.0.3",
    "info": {
      "title": "API-Based Testing",
      "version": "1.0.0",
    }
  }

  // build the path
  let pathObj = {
    "parameters": [],
    "responses": {
      [modelAPI.response.statusCode]: {
        "description": "successful operation",
        "content": {
          [modelAPI.response.mediaType]: {
            "schema": {
              "type": (modelAPI.response.mediaType==='text/plain')?"integer":"object"
            }
          }
        }
      }
    }
  };

  const url = modelAPI.url + modelAPI.urlParams;
  const url_match = url.match(_url_pattern);
  // add servers
  spec["servers"] = [{
    "url": url_match.groups.base,
  }]

  // add auth if any
  switch (modelAPI.authType) {
    case 'Bearer Token':
      spec["components"] = {
        "securitySchemes": {
          "myAuth": {
            type: 'http',
            scheme: 'bearer',            
          }
        }
      }
      pathObj["security"] = [{ "myAuth": [] }]
      break;
    case 'Basic Auth':
      spec["components"] = {
        "securitySchemes": {
          "myAuth": {
            type: 'http',
            scheme: 'basic',            
          }
        }
      }
      pathObj["security"] = [{ "myAuth": [] }];
      break;
  }

  // add additional headers if any
  if (modelAPI.additionalHeaders && modelAPI.additionalHeaders.length > 0) {
    for (let p of modelAPI.additionalHeaders) {
      pathObj.parameters.push({
        "in": "header",
        "name": p.name,
        "schema": {
          "type": p.type
        }
      })
    }
  }

  // add path params if any
  const path_match = url_match.groups.path.match(_url_path_pattern);
  if (path_match && modelAPI.parameters && modelAPI.parameters.pathParams && modelAPI.parameters.pathParams.length > 0) {
    // console.log("path_match", path_match);
    for (let item of path_match) {
      let attr = item.replaceAll(/[{}]/g,'');
      const p = modelAPI.parameters.pathParams.find(p => p.name === attr);
      if (!p) {
        throw new Error(`Path parameter {${attr}} not defined`);
      }
      let pobj = {
        "in": "path",
        "name": p.name,
        "required": true,
        "schema": {
          "type": p.type,
        }
      }
      if (p.type === "array") {
        pobj.schema["items"] = {
          "type": p.itemType || "string"
        }
      }
      else if (p.type === "object") {
        pobj.schema["properties"] = {
          "type": p.itemType || "string"
        }
      }
      if (p.type === "array" || p.type === "object") {
        pobj["style"] = p.style || "simple";
        pobj["explode"] = _.isBoolean(p.explode)?p.explode:false;
      }
      pathObj.parameters.push(pobj);
    }
  }

  // add query params if any
  if (modelAPI.parameters && modelAPI.parameters.queryParams && modelAPI.parameters.queryParams.length > 0) {
    // has query params
    for (let p of modelAPI.parameters.queryParams) {
      let pobj = {
        "in": "query",
        "name": p.name,
        "required": true,
        "schema": {
          "type": p.type
        }
      }
      if (p.type === "array") {
        pobj.schema["items"] = {
          "type": p.itemType || "string"
        }
      }
      else if (p.type === "object") {
        pobj.schema["properties"] = {
          "type": p.itemType || "string"
        }
      }
      if (p.type === "array" || p.type === "object") {
        pobj["style"] = p.style || "form";
        pobj["explode"] = _.isBoolean(p.explode)?p.explode:true;
      }
      pathObj.parameters.push(pobj);
    }
  }

  // add request body if any
  if (modelAPI.requestBody && modelAPI.requestBody.mediaType !== 'none') {
    let required = [];
    let properties = {};
    let encoding = {};
    for (let prop of modelAPI.requestBody.properties) {
      required.push(prop.field);
      properties[prop.field] = {
        "type": prop.type,
      }
      if (prop.type === "array") {
        properties[prop.field]["items"] = {
          "type": prop.itemType || "string"
        }
      }
      else if (prop.type === "object") {
        properties[prop.field]["properties"] = {
          "type": prop.itemType || "string"
        }
      }
      if (prop.type === "array" || prop.type === "object") {
        encoding[prop.field] = {
          "style": prop.style || "form",
          "explode": _.isBoolean(prop.explode)?prop.explode:true,
        }
      }
    }
    if (_.isEmpty(encoding))
      encoding = undefined;
    pathObj["requestBody"] = {
      "required": true,
      "content": {
        [modelAPI.requestBody.mediaType]: {
          "schema": {
            "type": "object",
            required,
            properties,
          },
          ..._.isEmpty(encoding)?{}:{encoding},
        }
      }
    }
  }

  spec["paths"] = {
    [url_match.groups.path] : {
      [modelAPI.method.toLowerCase()]: pathObj
    }
  }
  // const json = JSON.parse(spec.getSpecAsJson());
  // console.log("spec", spec)
  // console.log("config", config)
  return spec;
};


export const ModelFileModel = model('ModelFileModel', modelFileSchema);