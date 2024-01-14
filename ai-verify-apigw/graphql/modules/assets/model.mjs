import { ModelFileModel, ProjectModel } from "#models";
import { GraphQLError } from "graphql";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import pubsub from "#lib/apolloPubSub.mjs";

const resolvers = {
  Query: {
    /**
     * Returns list of model files
     * @returns Promise with ModelFile[]
     */
    modelFiles: (parent, { modelFileID }) => {
      return new Promise((resolve, reject) => {
        if (modelFileID) {
          ModelFileModel.findById(modelFileID)
            .then((doc) => {
              resolve([doc]);
            })
            .catch((err) => {
              console.log(err);
              let errorrMsg;
              if (err.message) {
                  errorrMsg = err.message
              }
              reject('An error occured while fetching the model file - ' + errorrMsg);
            });
        } else {
          ModelFileModel.find()
            .then((docs) => {
              resolve(docs);
            })
            .catch((err) => {
              console.log(err);
              let errorrMsg;
              if (err.message) {
                  errorrMsg = err.message
              }
              reject('An error occured while fetching model files - ' + errorrMsg);
            });
        }
      });
    },
    getOpenAPISpecFromModel: (parent, { modelFileID }) => {
      return new Promise((resolve, reject) => {
        ModelFileModel.findById(modelFileID).then(async (doc) => {
          if (!doc) return reject("Invalid ID");
          if (doc.type !== "API") return reject("Model is not of type API");
          try {
            const spec = await doc.exportModelAPI();
            if (!spec) return reject("Unable to generate spec");
            resolve(spec);
          } catch (err) {
            console.log(err);
            let errorrMsg;
            if (err.message) {
                errorrMsg = err.message
            }
            reject('An error occured while fetching the model API Spec - ' + errorrMsg);
          }
        });
      });
    },
  },
  Mutation: {
    createModelAPI: (parent, { model }) => {
      if (
        !model.name ||
        !model.modelType ||
        !model.modelAPI ||
        !model.modelAPI.response
      ) {
        return Promise.reject("Missing variable");
      }
      return new Promise((resolve, reject) => {
        const doc = {
          ...model,
          type: "API",
          status: "Valid",
        };
        ModelFileModel.create(doc)
          .then((doc) => {
            resolve(doc);
          })
          .catch((err) => {
            console.log(err);
            let errorrMsg;
            if (err.message) {
                errorrMsg = err.message
            }
            reject('An error occured while creating the model API - ' + errorrMsg);
          });
      });
    },
    updateModelAPI: (parent, { modelFileID, model }) => {
      return new Promise(async (resolve, reject) => {
        try {
          const newdoc = await ModelFileModel.findOneAndUpdate(
            { _id: modelFileID, type: "API" },
            model,
            { new: true, runValidators: true }
          );
          resolve(newdoc);
        } catch (err) {
          console.log(err);
          let errorrMsg;
          if (err.message) {
              errorrMsg = err.message
          }
          reject('An error occured while updating the model API - ' + errorrMsg);
        }
      });
    },
    deleteModelFile: (parent, { id }) => {
      return new Promise((resolve, reject) => {
        ModelFileModel.findById(id)
          .then((result) => {
            if (!result) return reject("Invalid Model ID");
            return result;
          })
          .then(async (model) => {
            const project = await ProjectModel.findOne({
              "modelAndDatasets.model": id,
            });
            if (project) {
              const error = new GraphQLError(
                `Unable to delete ${model.name} as it is used by project ${project.projectInfo.name}. `,
                {
                  extensions: {
                    code: "FILE_IN_USE",
                  },
                }
              );
              return reject(error);
            } else {
              return model;
            }
          })
          .then((model) => {
            if (model.type !== "API") {
              if (model.filePath) {
                var filePath = model.filePath;
              } else {
                return reject("model.filePath is empty");
              }
              if (fs.existsSync(filePath)) {
                let stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                  try {
                    console.log("Removing dir %s", filePath);
                    fs.rmSync(filePath, {
                      recursive: true,
                      force: true,
                    });
                  } catch (err) {
                    console.log("rm dir error", err);
                  }
                } else {
                  console.log("Removing file %s", filePath);
                  fsPromises.unlink(filePath);
                }
              }
            }
            return model;
          })
          .then(() => {
            ModelFileModel.findByIdAndDelete(id).then((result) => {
              if (!result) return reject("Invalid Model ID");
              resolve(id);
            });
          })
          .catch((err) => {
            console.log(err);
            let errorrMsg;
            if (err.message) {
                errorrMsg = err.message
            }
            reject('An error occured while deleting the model file - ' + errorrMsg);
          });
      });
    },
    updateModel: (parent, { modelFileID, modelFile }) => {
      return new Promise((resolve, reject) => {
        ModelFileModel.findOne({ _id: modelFileID }).then(async (doc) => {
          if (doc) {
            if (modelFile.description != null) {
              doc.description = modelFile.description;
            }
            if (modelFile.modelType != null) {
              doc.modelType = modelFile.modelType;
            }
            if (modelFile.name != null && modelFile.name != "") {
              //check if name is already taken
              const existingFile = await ModelFileModel.findOne({
                name: modelFile.name,
              });
              if (existingFile) {
                if (existingFile.id != modelFileID) {
                  console.log(
                    "Another file with the same name already exists, unable to update name to: ",
                    modelFile.name
                  );
                  const error = new GraphQLError("Duplicate File", {
                    extensions: {
                      code: "BAD_USER_INPUT",
                    },
                  });
                  reject(error);
                }
              } else {
                doc.name = modelFile.name;
              }
            }
            if (modelFile.status != null) {
              doc.status = modelFile.status;
            }
            let updatedDoc = await doc.save();
            resolve(updatedDoc);
          } else {
            reject(`Invalid id ${modelFileID}`);
          }
        });
      });
    },
  },
  Subscription: {
    validateModelStatusUpdated: {
      subscribe: () => pubsub.asyncIterator("VALIDATE_MODEL_STATUS_UPDATED"),
    },
  },
};

export default resolvers;
