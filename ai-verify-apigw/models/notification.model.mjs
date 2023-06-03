import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
    type: { type: String, enum: [
        "ReportStatus",
        "DatasetStatus",
        "ModelStatus",
        "General",
        "Error"
    ]},
    readStatus: { type: String, enum: ["New", "Done"], required: true },
    projectId: { type: String },
    projectName: { type: String },
    reportStatus: { type: String },
    assetType: { type: String, enum: ["Dataset", "Model"] },
    assetName: { type: String },
    assetStatus: { type: String, enum: ["Pending", "Valid", "Invalid", "Error", "Cancelled"] },
    title: { type: String },
    subject: { type: String },
    body: { type: String },
    timestamp: { type: String, required: true }
});

export const NotificationModel = model('NotificationModel', notificationSchema);