"use strict"

import { GraphQLError } from 'graphql';
import { DatasetModel, ProjectModel } from '#models';
import pubsub from '#lib/apolloPubSub.mjs';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { graphqlErrorHandler } from '../errorHandler.mjs';

const resolvers = {
    Query: {
        /**
         * Returns list of datasets
         * @returns Promise with Dataset[]
         */
        datasets: (parent) => {
            return new Promise((resolve, reject) => {
                DatasetModel.find().then(docs => {
                    resolve(docs)
                }).catch(err => graphqlErrorHandler(err, 'An error occured while fetching datasets', reject));
            });
        },
    },
    Mutation: {
        deleteDataset: (parent, {id}) => {
            console.debug("deleteDatset", id);
            return new Promise((resolve, reject) => {
                DatasetModel.findById(id).then(result => {
                    if (!result)
                        return reject("Invalid Dataset ID")
                    return result;
                }).then(async dataset => {

                    const project1 = await ProjectModel.findOne({"modelAndDatasets.testDataset":id});
                    const project2 = await ProjectModel.findOne({"modelAndDatasets.groundTruthDataset":id});

                    if (project1) {
                        const error = new GraphQLError(`Unable to delete ${dataset.name} as it is used by project ${project1.projectInfo.name}. `, {
                            extensions: {
                                code: 'FILE_IN_USE',
                            },
                        });
                        return reject(error)
                    } else if (project2) {
                        const error = new GraphQLError(`Unable to delete ${dataset.name} as it is used by project ${project2.projectInfo.name}. `, {
                            extensions: {
                                code: 'FILE_IN_USE',
                            },
                        });
                        return reject(error)
                    } else {
                        return dataset;
                    }

                }).then(dataset => {
                    if (dataset.filePath) {
                        var filePath = dataset.filePath;
                    } else {
                        return reject("dataset.filePath is empty")
                    }
                    if (fs.existsSync(filePath)) {
                        let stat = fs.statSync(filePath);
                        if (stat.isDirectory()) {
                            try {
                                console.log("Removing dir %s", filePath)
                                fs.rmSync(filePath, {
                                    recursive: true,
                                    force: true
                                });
                            } catch (err) {
                                console.log("rm dir error", err);
                            }
                        } else {
                            console.log("Removing file %s", filePath)
                            fsPromises.unlink(filePath);
                        }
                    }
                    return dataset;
                }).then(() => {
                    DatasetModel.findByIdAndDelete(id).then(result => {
                        if (!result)
                            return reject("Invalid Dataset ID")
                        resolve(id);
                    })
                }).catch(err => graphqlErrorHandler(err, 'An error occured while deleting the dataset', reject));
            });
        },
        updateDataset: (parent, {datasetID, dataset}) => {
            return new Promise((resolve, reject) => {
                DatasetModel.findOne({_id: datasetID}).then(async doc => {
                  if (doc) {
                    if (dataset.description != null) {
                        doc.description = dataset.description;
                    }
                    if (dataset.name != null && dataset.name != "") {
                        //check if name is already taken
                        const existingFile = await DatasetModel.findOne({name: dataset.name});
                        if (existingFile) {
                            //check if its the file's original name
                            if (existingFile.id != datasetID) {
                                console.log("Another file with the same name already exists, unable to update name to: ", dataset.name)
                                const error = new GraphQLError('Duplicate File', {
                                    extensions: {
                                      code: 'BAD_USER_INPUT',
                                    },
                                });
                                reject(error)
                            }
                        } else {
                            doc.name = dataset.name;
                        } 
                    }
                    if (dataset.status != null) {
                        doc.status = dataset.status;
                    }
                    let updatedDoc = await doc.save();
                    resolve(updatedDoc);
                  } else {
                    reject(`Invalid id ${datasetID}`);
                  }
                })
            })
        },
    },
    Subscription: {
        validateDatasetStatusUpdated: {
            subscribe: () => pubsub.asyncIterator('VALIDATE_DATASET_STATUS_UPDATED')
        }
    },
}

export default resolvers;