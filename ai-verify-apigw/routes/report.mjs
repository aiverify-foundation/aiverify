'use strict'

import express from 'express';
const router = express.Router();
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

import { REPORT_DIRNAME, getReportFilename } from '../lib/report.mjs';


/**
 * @openapi
 * /report/{projectId}:
 *   get:
 *     summary: Retrieve project report PDF.
 *     tags:
 *       - Report
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID ID
 *     responses:
 *       '200':
 *         description: Response
 *       '401':
 *         description: Not Found
 *         content:
 *           text/plain:
 *             example: Not Found
 */

router.get('/:projectId',
  function(req, res) {
    try {
      const projectId = req.params.projectId;

      // check projectId only consists of hexadecimal letters
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        console.log("not valid object ID")
        return res.sendStatus(400).end();
      }

      // console.log("get report", projectId)
      const filename = getReportFilename(projectId);
      const pdf_path = path.join(REPORT_DIRNAME, filename);

      if (!fs.existsSync(pdf_path)) {
        return res.sendStatus(400).end();
      }
  
      let file = fs.createReadStream(pdf_path);
      let stat = fs.statSync(pdf_path);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      file.pipe(res);  
    } catch (e) {
      res.sendStatus(500).end();
    }
  });

export default router;