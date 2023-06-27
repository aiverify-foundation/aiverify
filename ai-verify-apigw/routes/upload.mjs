import _ from 'lodash';
import path from 'path';
import fs from 'fs';

import express from 'express';
import { ModelFileModel, DatasetModel } from '#models';
import { queueDataset, queueModel } from '#lib/testEngineQueue.mjs';
import multer from 'multer';
import moment from 'moment';

const router = express.Router();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp")
  },
  filename: function (req, file, cb) {
    // keep original filename
    cb(null, file.originalname)
  }
})
// const upload = multer({ dest: 'uploads/' })

const upload = multer({ storage: storage })

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}


/**
 * @openapi
 * /api/upload/data:
 *   post:
 *     summary: Upload data file. All files uploaded will be saved under the "uploads" directory.
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - myFiles
 *             properties:
 *               myFiles:
 *                 type: array
 *                 items:
 *                   type: file
 *                 minItems: 1
 *               myFolders:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *     responses:
 *       '200':
 *         description: Response
 *     security:
 *       - bearerAuth: []
 * 
 * /api/upload/model:
 *   post:
 *     summary: Upload model file. All files uploaded will be saved under the "uploads" directory.
 *     tags:
 *       - Upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - myModelFiles
 *             properties:
 *               myModelFiles:
 *                 type: array
 *                 items:
 *                   type: file
 *                 minItems: 1
 *               myModelFolders:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *     responses:
 *       '200':
 *         description: Response
 *     security:
 *       - bearerAuth: []  
 * 
 */


/**
 * Route /api/upload/data
 */
router.post('/data', upload.array('myFiles'), async function (req, res, next) {
  
      const files = req.files
      const myFolders = req.body.myFolders;
      const myFolder = req.body.myFolder;

      if (!files) {
        return res.sendStatus(400).json({ err: "No files to be uploaded"});
      }

      //create /uploads folder if it doesnt exist
      if (!fs.existsSync('../uploads')) {
        fs.mkdirSync('../uploads', { recursive: true });
      }
    
      let baseFolder = `/data`;
      
      const data = [];

      let promises = files.map((file,index) => {
        return new Promise(async (resolve, reject) => {
          const dataFolder = '../uploads/data/';
          //create /data folder if it doesnt exist
          if (!fs.existsSync('../uploads/data')) {
            fs.mkdirSync('../uploads/data', { recursive: true });
          }
          const filenames = fs.readdirSync(dataFolder);

          const getNewName = async (name) => {
            var tempName = name
            for (let count = 1; ( await getDbCount(tempName) || getFsCount(tempName)!=0 ); count++) {
              if (name.split('.')[1]) {
                tempName = `${name.split('.')[0]}_${count}.${name.split('.')[1]}`;
              } else {
                tempName = `${name.split('.')[0]}_${count}`;
              }
            }
            return await tempName
          }
  
          const getDbCount = (tempName) => {
            return new Promise((resolve, reject) => {
              DatasetModel.findOne({name: tempName}, function (err, result) {
                if (err) {
                  reject(err);
                }
                if (!result) {
                  resolve(false);
                } else {
                  resolve(true);
                }
              })
            })
          }
  
          const getFsCount = (tempName) => {
            return filenames.filter(f => f === tempName).length;
          }
  
          let folder = baseFolder
          let subfolder = myFolders?_.isArray(myFolders)?myFolders[index]:myFolders:null;
          let folderCreated = null;

          if (myFolder) {
            // check if folder with same name alreay exists, rename folder and its file/ subfolder paths
            var newFolderName = await getNewName(myFolder);
            let newSubfolder = subfolder.replace(myFolder, newFolderName)
            const joinedPath = path.join(baseFolder, newSubfolder);
            folder = `${joinedPath}`;
            var newFileName = file.filename;
            let uploadFolder = path.join("../uploads", baseFolder, newFolderName);
            let folderPath = path.resolve(uploadFolder);
            if (!fs.existsSync(uploadFolder)) { // only add folderCreated once per folder upload
              fs.mkdirSync(uploadFolder, {recursive: true});
              folderCreated = {
                // subFolderOf: path.basename( path.dirname(folderPath)),
                folderName: newFolderName,
                filePath: folderPath,
                stat: fs.statSync(uploadFolder),
              };
            }
          } else {
            // check for individual duplicated file names
            var newFileName = await getNewName(file.filename);
          }
          let uploadSubfolder = path.join("../uploads", folder);

          if (!fs.existsSync(uploadSubfolder)) {
            fs.mkdirSync(uploadSubfolder, {recursive: true});
            // let folderPath = path.resolve(uploadSubfolder);
            // if (subfolder && subfolder.length > 0) {
            //   folderCreated = {
            //     subFolderOf: path.basename( path.dirname(folderPath)),
            //     folderName: newFolderName,
            //     filePath: folderPath,
            //     stat: fs.statSync(uploadSubfolder),
            //   };
            // }
          }
          
          let uploadPath = path.resolve(uploadSubfolder, newFileName);
          // changed rename to copyFile as src and dst reside in different filesystems in docker env.
          fs.copyFileSync(file.path, uploadPath);
          fs.unlinkSync(file.path);
          let stat = fs.statSync(uploadPath);
  
          resolve({file, subfolder, stat, uploadPath, folderCreated, newFileName});
        })
      })

      Promise.allSettled(promises).then(async results => {
        let numSuccess = 0;
        // console.log("Results is:", results);
        for (let result of results) {
          let value = result.value;
          // console.log("Result value is:", result.value);
          
          if (value.folderCreated) {
            // if (value.folderCreated.subFolderOf == 'data') {
              // only create folder object and send folder for validation
              const newFolderObj = new DatasetModel({       
                name: value.folderCreated.folderName,
                filename: value.folderCreated.folderName,
                filePath: value.folderCreated.filePath,
                status: "Pending",
                type: "Folder",
                ctime: value.folderCreated.stat.ctime,
              });
              await newFolderObj.save(function (err, product, numAffected) {
                console.log("Folder saved: ", product);
              });
              // console.log("newObj is: ", newObj);
              queueDataset(newFolderObj)
              data.push(newFolderObj)
              numSuccess++;
            // }
          } else {
            if ((value.subfolder == '') || (value.subfolder == null)){
              //create file objects and send files for validation
              const fileSize = formatBytes(value.file.size)
              const newObj = new DatasetModel({       
                name: value.newFileName,
                filename: value.newFileName,
                filePath: value.uploadPath,
                description: "",
                status: "Pending",
                size: fileSize,
                ctime: value.stat.ctime,
                serializer: "",
                dataFormat: "",
                errorMessages: "",
                type: "File",
              });
              await newObj.save(function (err, product, numAffected) {
                console.log("Saved: ", product);
                // console.log("Save error: ", err);
              });
    
              // console.log("newObj is: ", newObj);
    
              queueDataset(newObj)
              data.push(newObj)
              numSuccess++;
            }
          }
          
        }

        if (numSuccess > 0){
          console.log("numsuccess is: ", numSuccess);
          res.status(201).json(data);
        }
        else {
          console.log("numsuccess is: ", numSuccess);
          res.status(401).json({ err: "All uploads failed" });
        }

      }).catch(err => {
        res.status(402).json({ err: "File Upload Error:", err});
      })

});




/**
 * Route /api/upload/model
 */
router.post('/model', upload.array('myModelFiles'), async function (req, res, next) {

        const files = req.files
        const myFolders = req.body.myModelFolders;
        const myFolder = req.body.myModelFolder;
        const myModelTypes = req.body.myModelType;
        const myFolderModelType = req.body.myFolderModelType;
        // console.log("myModelFolders is: ", myFolders);
        // console.log("myModelFolder is: ", myFolder);
  
        if (!files) {
          return res.sendStatus(400).json({ err: "No files to be uploaded"});
        }

        //create /uploads folder if it doesnt exist
        if (!fs.existsSync('../uploads')) {
          fs.mkdirSync('../uploads', { recursive: true });
        }
      
        let baseFolder = `/model`;

        const data = [];

        let promises = files.map((file,index) => {
          return new Promise(async (resolve, reject) => {
            const dataFolder = '../uploads/model/';
            //create /model folder if it doesnt exist
            if (!fs.existsSync('../uploads/model')) {
              fs.mkdirSync('../uploads/model', { recursive: true });
            }
            const filenames = fs.readdirSync(dataFolder);

            const getNewName = async (name) => {
              var tempName = name
              for (let count = 1; ( await getDbCount(tempName) || getFsCount(tempName)!=0 ); count++) {
                if (name.split('.')[1]) {
                  tempName = `${name.split('.')[0]}_${count}.${name.split('.')[1]}`;
                } else {
                  tempName = `${name.split('.')[0]}_${count}`;
                }
              }
              return await tempName
            }
    
            const getDbCount = (tempName) => {
              return new Promise((resolve, reject) => {
                ModelFileModel.findOne({name: tempName}, function (err, result) {
                  if (err) {
                    reject(err);
                  }
                  if (!result) {
                    resolve(false);
                  } else {
                    resolve(true);
                  }
                })
              })
            }
    
            const getFsCount = (tempName) => {
              return filenames.filter(f => f === tempName).length;
            }

            let folder = baseFolder
            let subfolder = myFolders?_.isArray(myFolders)?myFolders[index]:myFolders:null;
            let folderCreated = null;
          
            if (myFolder) {
              // check if folder with same name alreay exists, rename folder and its file/ subfolder paths
              var newFolderName = await getNewName(myFolder);
              let newSubfolder = subfolder.replace(myFolder, newFolderName)
              const joinedPath = path.join(baseFolder, newSubfolder);
              folder = `${joinedPath}`;
              var newFileName = file.filename;
              let uploadFolder = path.join("../uploads", baseFolder, newFolderName);
              let folderPath = path.resolve(uploadFolder);
              // console.log("uploadFolder is: ", uploadFolder);
              // console.log("folderPath is: ", folderPath);
              if (!fs.existsSync(uploadFolder)) { // only add folderCreated once per folder upload
                fs.mkdirSync(uploadFolder, {recursive: true});
                folderCreated = {
                  // subFolderOf: path.basename( path.dirname(folderPath)),
                  folderName: newFolderName,
                  filePath: folderPath,
                  stat: fs.statSync(uploadFolder),
                  myFolderModelType: myFolderModelType,
                };
              }
            } else {
              // check for individual duplicated file names
              var newFileName = await getNewName(file.filename);
            }
            let uploadSubfolder = path.join("../uploads", folder);
          
            if (!fs.existsSync(uploadSubfolder)) {
              fs.mkdirSync(uploadSubfolder, {recursive: true});
              // let folderPath = path.resolve(uploadSubfolder);
              // if (subfolder && subfolder.length > 0) { // only add folderCreated for subfolder creation
              //     folderCreated = {
              //     subFolderOf: path.basename( path.dirname(folderPath)),
              //     folderName: newFolderName,
              //     filePath: folderPath,
              //     stat: fs.statSync(uploadSubfolder),
              //     myFolderModelType: myFolderModelType,
              //   };
              // }
            } 
            
            let uploadPath = path.resolve(uploadSubfolder, newFileName);
            // using copyFile instead of rename as src and dest folder reside in different filesystem in docker env.
            fs.copyFileSync(file.path, uploadPath);
            fs.unlinkSync(file.path);
            let stat = fs.statSync(uploadPath);

            if ( Array.isArray(myModelTypes) ) {
              var myModelType = myModelTypes[index]
            } else {
              var myModelType = myModelTypes
            }

            resolve({file, subfolder, stat, uploadPath, folderCreated, newFileName, myModelType});
          })
        })
  
        Promise.allSettled(promises).then(async results => {
          let numSuccess = 0;

          for (let result of results) {
            let value = result.value;
            // console.log("Result value is:", result.value);
            // console.log("value.stat is:", result.value.stat);
            // console.log("value.uploadPath is:", result.value.uploadPath);

              if (value.folderCreated) {
                //if (value.folderCreated.subFolderOf == 'model') {
                  // console.log("folderCreated is: ", value.folderCreated)
                  // only create folder object and send folder for validation
                  const newFolderObj = new ModelFileModel({
                    name: value.folderCreated.folderName,
                    filename: value.folderCreated.folderName,
                    filePath: value.folderCreated.filePath,
                    // subFolder: value.folderCreated.subFolderOf,
                    status: "Pending",
                    modelType: value.folderCreated.myFolderModelType,
                    type: (req.body.type == "pipeline")?"Pipeline":"Folder",
                    ctime: value.folderCreated.stat.ctime,
                  });
                  
                  await newFolderObj.save(function (err, product, numAffected) {
                    console.log("Folder saved: ", product);
                  })
                  // .catch(err => {
                  //   res.status(400).json({ err: "Error saving folder to db:", err});
                  // });
                  queueModel(newFolderObj) ;
                  data.push(newFolderObj);
                  numSuccess++; 
                //}
              } else {
                if((value.subfolder == '') || (value.subfolder == null)) {
                  //create file objects and send files for validation
                  const fileSize = formatBytes(value.file.size)
                  const newObj = new ModelFileModel({       
                    name: value.newFileName,
                    filename: value.newFileName,
                    filePath: value.uploadPath,
                    // subFolder: value.subfolder,
                    description: "",
                    status: "Pending",
                    size: fileSize,
                    ctime: value.stat.ctime,
                    serializer: "",
                    modelType: value.myModelType,
                    modelFormat: "",
                    errorMessages: "",
                    type: "File",
                  });
                  // console.log("newObj is: ", newObj)
                  await newObj.save(function (err, product, numAffected) {
                    // console.log("save err is: ", err);
                    console.log("Saved: ", product);
                    // console.log("save numaffected is: ", numAffected);
                  })
                  // .catch(err => {
                  //   res.status(400).json({ err: "Error saving file to db:", err});
                  // });
                  queueModel(newObj)
                  data.push(newObj)
                  numSuccess++;
                }
              }
  
          }
  
          if (numSuccess > 0){
            console.log("numsuccess is: ", numSuccess);
            res.status(201).json(data);
          } else {
            console.log("numsuccess is: ", numSuccess);
            res.status(400).json({ err: "All uploads failed" });
          }
  
        }).catch(err => {
          res.status(400).json({ err: "File Upload Error:", err});
        })

  });
  

  export default router;