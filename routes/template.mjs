'use strict'

import express from 'express';
const router = express.Router();
import stream from 'node:stream';
import fs from 'node:fs';
import path from 'node:path';

import { ProjectTemplateModel } from '#models';
import { exportToPlugin } from '#lib/templateService.mjs';

router.post('/export',
  function(req, res) {
    console.log("/template/export", req.body)
    try {
      // const templateId = req.params.templateId;
      let { templateId, pluginGID, templateCID, tags } = req.body;
      if (!templateId || !pluginGID || !templateCID) {
        return res.sendStatus(400);
      }
      if (tags) {
        tags = tags.split(",");
      }
      ProjectTemplateModel.findById(templateId).then(doc => {
        if (!doc) {
          return res.sendStatus(404);
        }
        // console.log("doc", doc);
        const filename = `${pluginGID}.zip`;
        const zip = exportToPlugin(doc, pluginGID, templateCID, tags);
        const buffer = zip.toBuffer();
        let readStream = new stream.PassThrough();
        readStream.end(buffer);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        readStream.pipe(res);  
      }).catch(err => {
        res.sendStatus(500)
      })
    } catch (e) {
      res.sendStatus(500);
    }
  });

export default router;