import { Schema, model } from 'mongoose';


const modelFileSchema = new Schema({
    filename: { type: String, required: true }, 
    name: { type: String, required: true },
    filePath: { type: String, required: true },
    ctime: { type: Date },
    description: { type: String, required: false },
    status: { type: String, default: "Pending", enum: ["Pending","Valid","Invalid","Error","Cancelled","Temp"] },
    size: { type: String },
    modelType: { type: String, required: false, enum: ["Classification","Regression"] },
    serializer: { type: String },
    modelFormat: { type: String },
    errorMessages: { type: String },
    type: { type: String, default: "File", enum: ["File","Folder","Pipeline"] },
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