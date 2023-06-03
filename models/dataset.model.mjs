/**
 * Dataset mongoose models
 */

import { Schema, model } from 'mongoose';

export const datasetColumnSchema = new Schema({
    name: { type: String, required: true },
    datatype: { type: String, required: true },
    label: { type: String, required: false },
});

const datasetSchema = new Schema({
    filename: { type: String, required: true },
    name: { type: String, required: true }, // defaults to filename when upload
    type: { type: String, default: "File", enum: ["File","Folder"] },
    filePath: { type: String, required: true },
    ctime: { type: Date },
    dataColumns: [datasetColumnSchema],
    numRows: { type: Number },
    numCols: { type: Number },
    description: { type: String, required: false },
    status: { type: String, default: "Pending", enum: ["Pending","Valid","Invalid","Error","Cancelled"] },
    size: { type: String },
    serializer: { type: String },
    dataFormat: { type: String },
    errorMessages: { type: String },
}, { 
    timestamps: { createdAt: true, updatedAt: true } 
});

export const DatasetModel = model('DatasetModel', datasetSchema);