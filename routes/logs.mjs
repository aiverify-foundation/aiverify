'use strict'

import express from 'express';
const router = express.Router();
import { readFile } from 'node:fs/promises';
import { ReportModel } from '#models';


router.get('/:projectId', 
    async function(req, res) {
        const { projectId } = req.params;
        const reportDoc = await ReportModel.findOne({ project: projectId });
        if (!reportDoc) {
            res.status(404).send('Report Not Found');
            return;
        }

        if (!reportDoc.tests || !reportDoc.tests.length) {
            res.status(404).send('No Tests In Report');
            return;
        }

        let logs = [];
        try {
            logs = await Promise.all(
                reportDoc.tests.map(
                    test => test.logFile ? readFile(test.logFile, { encoding: 'utf8' }) : Promise.resolve('No Logs')
                )
            );
        } catch(err) {
            res.status(500).send({
                code: err.code,
                message: err.message,
            });
            return;
        }

        const result = reportDoc.tests.map((test, i) => ({
            algoGID: test.algorithmGID,
            logs: logs[i]
        }));

        res.json(result);
    }
)

export default router;