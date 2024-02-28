import _ from "lodash";
import path from "path";
import fs from "fs";

import express from "express";
import { ModelFileModel, DatasetModel } from "#models";
import { queueDataset, queueModel } from "#lib/testEngineQueue.mjs";
import multer from "multer";
import moment from "moment";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp");
  },
  filename: function (req, file, cb) {
    // keep original filename
    cb(null, file.originalname);
  },
});
// const upload = multer({ dest: 'uploads/' })

const upload = multer({ storage: storage });

function validateAndSanitize(userInput) {
  // Allow only alphanumeric characters and underscores
  const allowedCharactersRegex = /^[a-zA-Z0-9_]+$/;
  // Example maximum length constraint
  const maxLength = 50;
  if (typeof userInput !== "string") {
    throw new Error("Invalid input type. Input must be a string.");
  }
  // Trim leading and trailing whitespaces
  userInput = userInput.trim();
  // Check if the input length is within acceptable limits
  if (userInput.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters.`);
  }
  // Check if the input contains only allowed characters
  if (!allowedCharactersRegex.test(userInput)) {
    throw new Error(
      "Invalid characters in the input. Only alphanumeric characters and underscores are allowed."
    );
  }
  return userInput;
}

function validateFileSize(file) {
  const maxFileSizeInGB = 4;
  const maxAllowedFileSize = Math.pow(1024, 3) * maxFileSizeInGB;
  if (file.size === undefined) throw new Error("Invalid file size");
  if (file.size > maxAllowedFileSize)
    throw new Error(
      `File size is larger than the maximum allowed size of ${maxFileSizeInGB} GB`
    );
  return true;
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
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
router.post("/data", upload.array("myFiles"), async function (req, res, next) {
  const files = req.files;
  const myFolders = req.body.myFolders;
  const myFolder = req.body.myFolder;

  if (myFolder) {
    if (!myFolders) {
      return res.status(500).json({ err: "Invalid folder name" });
    }

    try {
      if (_.isArray(myFolders)) {
        for (const folderName of myFolders) {
          validateAndSanitize(folderName);
        }
      } else {
        validateAndSanitize(myFolders);
      }

      validateAndSanitize(myFolder);
    } catch (err) {
      return res.status(500).json({ err });
    }
  }

  if (!files) {
    return res.status(400).json({ err: "No files to be uploaded" });
  }

  //create /uploads folder if it doesnt exist
  if (!fs.existsSync("../uploads")) {
    fs.mkdirSync("../uploads", { recursive: true });
  }

  let baseFolder = `/data`;

  const data = [];

  let promises = files.map((file, index) => {
    return new Promise(async (resolve, reject) => {
      if (file.mimetype !== 'application/octet-stream' && !file.mimetype.startsWith('image/')) {
        return reject("Invalid mimetype: " + file.mimetype) 
      }
      try {
        validateFileSize(file);
      } catch (err) {
        reject(err);
      }
      const dataFolder = "../uploads/data/";
      //create /data folder if it doesnt exist
      if (!fs.existsSync("../uploads/data")) {
        fs.mkdirSync("../uploads/data", { recursive: true });
      }
      const filenames = fs.readdirSync(dataFolder);

      const getNewName = async (name) => {
        var tempName = name;
        for (
          let count = 1;
          (await getDbCount(tempName)) || getFsCount(tempName) != 0;
          count++
        ) {
          if (name.split(".")[1]) {
            tempName = `${name.split(".")[0]}_${count}.${name.split(".")[1]}`;
          } else {
            tempName = `${name.split(".")[0]}_${count}`;
          }
        }
        return await tempName;
      };

      const getDbCount = (tempName) => {
        return new Promise((resolve, reject) => {
          DatasetModel.findOne({ name: tempName }, function (err, result) {
            if (err) {
              reject(err);
            }
            if (!result) {
              resolve(false);
            } else {
              resolve(true);
            }
          });
        });
      };

      const getFsCount = (tempName) => {
        return filenames.filter((f) => f === tempName).length;
      };

      let folder = baseFolder;
      let subfolder = myFolders
        ? _.isArray(myFolders)
          ? myFolders[index]
          : myFolders
        : null;
      let folderCreated = null;

      if (myFolder) {
        // check if folder with same name alreay exists, rename folder and its file/ subfolder paths
        var newFolderName = await getNewName(myFolder);
        let newSubfolder = subfolder.replace(myFolder, newFolderName);
        const joinedPath = path.join(baseFolder, newSubfolder);
        folder = `${joinedPath}`;
        var newFileName = file.filename;
        let uploadFolder = path.join("../uploads", baseFolder, newFolderName); // newFolderName is generated based on already sanitized myFolder
        let folderPath = path.resolve(uploadFolder);
        if (!fs.existsSync(uploadFolder)) {
          // only add folderCreated once per folder upload
          fs.mkdirSync(uploadFolder, { recursive: true });
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
        fs.mkdirSync(uploadSubfolder, { recursive: true });
      }

      let uploadPath = path.resolve(uploadSubfolder, newFileName);

      const relativePath = path.relative(uploadSubfolder, uploadPath);
      if (relativePath.startsWith(".")) {
        return reject("Invalid file path");
      }

      // changed rename to copyFile as src and dst reside in different filesystems in docker env.
      fs.copyFileSync(file.path, uploadPath);
      fs.unlinkSync(file.path);
      let stat = fs.statSync(uploadPath);

      resolve({
        file,
        subfolder,
        stat,
        uploadPath,
        folderCreated,
        newFileName,
      });
    });
  });

  Promise.allSettled(promises)
    .then(async (results) => {
      let numSuccess = 0;
      // console.log("Results is:", results);
      for (let result of results) {
        if (result.status === "rejected") {
          console.log(result.reason);
          continue;
        }
        let value = result.value;
        if (value.folderCreated) {
          const newFolderObj = new DatasetModel({
            name: value.folderCreated.folderName,
            filename: value.folderCreated.folderName,
            filePath: value.folderCreated.filePath,
            status: "Pending",
            type: "Folder",
            ctime: value.folderCreated.stat.ctime,
          });
          await newFolderObj.save(function (err, product, numAffected) {
            // console.log("Folder saved: ", product);
          });
          // Send validation request to backend
          queueDataset(newFolderObj);
          data.push(newFolderObj);
          numSuccess++;
        } else {
          if (value.subfolder == "" || value.subfolder == null) {
            //create file objects and send files for validation
            const fileSize = formatBytes(value.file.size);
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
              // console.log("Saved: ", product);
            });

            queueDataset(newObj);
            data.push(newObj);
            numSuccess++;
          }
        }
      }

      if (numSuccess > 0) {
        // console.log("numsuccess is: ", numSuccess);
        res.status(201).json(data);
      } else {
        // console.log("numsuccess is: ", numSuccess);
        res.status(400).json({ err: "All uploads failed" });
      }
    })
    .catch((err) => {
      res.status(400).json({ err: "File Upload Error:", err });
    });
});

/**
 * Route /api/upload/model
 */
router.post(
  "/model",
  upload.array("myModelFiles"),
  async function (req, res, next) {
    const files = req.files;
    const myFolders = req.body.myModelFolders;
    const myFolder = req.body.myModelFolder;
    const myModelTypes = req.body.myModelType;
    const myFolderModelType = req.body.myFolderModelType;

    if (myFolder) {
      if (!myFolders) {
        return res.status(500).json({ err: "Invalid folder name" });
      }

      try {
        validateAndSanitize(myFolder);
        if (_.isArray(myFolders)) {
          for (const folderName of myFolders) {
            validateAndSanitize(folderName);
          }
        } else {
          validateAndSanitize(myFolders);
        }
      } catch (err) {
        return res.status(500).json({ err });
      }
    }

    if (!files) {
      return res.status(400).json({ err: "No files to be uploaded" });
    }

    //create /uploads folder if it doesnt exist
    if (!fs.existsSync("../uploads")) {
      fs.mkdirSync("../uploads", { recursive: true });
    }

    let baseFolder = `/model`;

    const data = [];

    let promises = files.map((file, index) => {
      return new Promise(async (resolve, reject) => {
        if (file.mimetype !== 'application/octet-stream') {
          return reject("Invalid mimetype: " + file.mimetype) 
        }
        try {
          validateFileSize(file);
        } catch (err) {
          reject(err);
        }
        const dataFolder = "../uploads/model/";
        //create /model folder if it doesnt exist
        if (!fs.existsSync("../uploads/model")) {
          fs.mkdirSync("../uploads/model", { recursive: true });
        }
        const filenames = fs.readdirSync(dataFolder);

        const getNewName = async (name) => {
          var tempName = name;
          for (
            let count = 1;
            (await getDbCount(tempName)) || getFsCount(tempName) != 0;
            count++
          ) {
            if (name.split(".")[1]) {
              tempName = `${name.split(".")[0]}_${count}.${name.split(".")[1]}`;
            } else {
              tempName = `${name.split(".")[0]}_${count}`;
            }
          }
          return await tempName;
        };

        const getDbCount = (tempName) => {
          return new Promise((resolve, reject) => {
            ModelFileModel.findOne({ name: tempName }, function (err, result) {
              if (err) {
                reject(err);
              }
              if (!result) {
                resolve(false);
              } else {
                resolve(true);
              }
            });
          });
        };

        const getFsCount = (tempName) => {
          return filenames.filter((f) => f === tempName).length;
        };

        let folder = baseFolder;
        let subfolder = myFolders
          ? _.isArray(myFolders)
            ? myFolders[index]
            : myFolders
          : null;
        let folderCreated = null;

        if (myFolder) {
          // check if folder with same name alreay exists, rename folder and its file/ subfolder paths
          var newFolderName = await getNewName(myFolder);
          let newSubfolder = subfolder.replace(myFolder, newFolderName);
          const joinedPath = path.join(baseFolder, newSubfolder);
          folder = `${joinedPath}`;
          var newFileName = file.filename;
          let uploadFolder = path.join("../uploads", baseFolder, newFolderName); // newFolderName is generated based on already sanitized myFolder
          let folderPath = path.resolve(uploadFolder);
          if (!fs.existsSync(uploadFolder)) {
            // only add folderCreated once per folder upload
            fs.mkdirSync(uploadFolder, { recursive: true });
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
          fs.mkdirSync(uploadSubfolder, { recursive: true });
        }

        let uploadPath = path.resolve(uploadSubfolder, newFileName);

        const relativePath = path.relative(uploadSubfolder, uploadPath);
        if (relativePath.startsWith(".")) {
          return reject("Invalid file path");
        }

        // using copyFile instead of rename as src and dest folder reside in different filesystem in docker env.
        fs.copyFileSync(file.path, uploadPath);
        fs.unlinkSync(file.path);
        let stat = fs.statSync(uploadPath);

        if (Array.isArray(myModelTypes)) {
          var myModelType = myModelTypes[index];
        } else {
          var myModelType = myModelTypes;
        }

        resolve({
          file,
          subfolder,
          stat,
          uploadPath,
          folderCreated,
          newFileName,
          myModelType,
        });
      });
    });

    Promise.allSettled(promises)
      .then(async (results) => {
        let numSuccess = 0;

        for (let result of results) {
          if (result.status === "rejected") {
            console.log(result.reason);
            continue;
          }
          let value = result.value;
          if (value.folderCreated) {
            const newFolderObj = new ModelFileModel({
              name: value.folderCreated.folderName,
              filename: value.folderCreated.folderName,
              filePath: value.folderCreated.filePath,
              status: "Pending",
              modelType: value.folderCreated.myFolderModelType,
              type: req.body.type == "pipeline" ? "Pipeline" : "Folder",
              ctime: value.folderCreated.stat.ctime,
            });

            await newFolderObj.save(function (err, product, numAffected) {
              // console.log("Folder saved: ", product);
            });
            queueModel(newFolderObj);
            data.push(newFolderObj);
            numSuccess++;
          } else {
            if (value.subfolder == "" || value.subfolder == null) {
              //create file objects and send files for validation
              const fileSize = formatBytes(value.file.size);
              const newObj = new ModelFileModel({
                name: value.newFileName,
                filename: value.newFileName,
                filePath: value.uploadPath,
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
              await newObj.save(function (err, product, numAffected) {
                // console.log("Saved: ", product);
              });
              // Send validation request to backend
              queueModel(newObj);
              data.push(newObj);
              numSuccess++;
            }
          }
        }

        if (numSuccess > 0) {
          // console.log("numsuccess is: ", numSuccess);
          res.status(201).json(data);
        } else {
          // console.log("numsuccess is: ", numSuccess);
          res.status(400).json({ err: "All uploads failed" });
        }
      })
      .catch((err) => {
        res.status(400).json({ err: "File Upload Error:", err });
      });
  }
);

export default router;
