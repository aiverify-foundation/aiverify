// Backend
import type { NextApiRequest, NextApiResponse } from 'next'

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

import formidable from 'formidable';
import { existsSync, mkdirSync } from 'node:fs';
import _ from 'lodash';
import AdmZip from 'adm-zip';

import { installPlugin } from 'server/pluginManager';

// const TEMP_DIR = './temp';
const TEMP_DIR = os.tmpdir();

if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR);
}

export const config = {
  api: {
    bodyParser: false,
  },
};

function deleteTempFiles(files: formidable.Files) {
  for (const file of Object.values(files as { [file: string]: formidable.File})) {
    fs.rmSync(file.filepath, { force:true })
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const form = new formidable.IncomingForm({
    uploadDir: TEMP_DIR,
    // keepExtensions: true,
    allowEmptyFiles: false,
    maxFileSize: 500*1024*1024, // 500mb
  });
  form.parse(req, async (err, _fields, files) => {
    // console.log("uploaded", err, files);
    if (err) {
      deleteTempFiles(files);
      return res.status(500).end()
    }

    if (_.isNil(files.myFile)) {
      deleteTempFiles(files)
      return res.status(400).end();
    }

    let file = files.myFile as any;
    // console.log("isSingle", file)

    let tmpdir = path.join(TEMP_DIR, `plugin_${file.newFilename}`);
    try {
      let tmpPluginPath = tmpdir;
      const zip = new AdmZip(file.filepath);
      let zipEntries = zip.getEntries();
      let found = false;
      for (let entry of zipEntries) {
        // console.log("entry", entry.isDirectory, entry.entryName);
        // check if any subdir
        if (entry.isDirectory && (entry.entryName.endsWith("inputs/") || entry.entryName.endsWith("widgets/") || entry.entryName.endsWith("algorithms/") || entry.entryName.endsWith("templates/"))) {
          found = true;
          let ret = entry.entryName.match(/^(.+)\/(inputs|widgets|algorithms|templates)\//)
          // console.log("ret", ret)
          if (ret) {
            tmpPluginPath = path.join(tmpPluginPath, ret[1])
          }
          break;
        }
      }
      if (!found) {
        throw new Error("Invalid plugin")
      }
      // console.log("tmpPluginPath", tmpPluginPath)
      zip.extractAllTo(tmpdir, true);
      const newPlugin = await installPlugin(tmpPluginPath);
      res.status(200).json(newPlugin);
    } catch (error) {
      let errMsg: string;
      if (error instanceof Error) {
        errMsg = error.message;
      } else {
        errMsg = String(error);
      }
      res.status(400).json({ error: errMsg })
    } finally {
      if (fs.existsSync(tmpdir)) {
        fs.rmdirSync(tmpdir, { recursive:true })
      }
      deleteTempFiles(files);
    }

  });
}
