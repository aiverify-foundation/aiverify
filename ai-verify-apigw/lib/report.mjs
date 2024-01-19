'use strict'

import { ReportModel } from '#models';
import pubsub from '#lib/apolloPubSub.mjs';
import puppeteer from 'puppeteer';

import fs from 'node:fs';
import path from 'node:path';

const WEB_REPORT_URL = process.env.WEB_REPORT_URL || "http://localhost:3000/reportStatus/printview";

export const REPORT_DIRNAME = "reports";

if (!fs.existsSync(REPORT_DIRNAME)) {
  fs.mkdirSync(REPORT_DIRNAME);
}


export function getReportFilename(projectId) {
  return `report_${projectId}.pdf`;
} 

export async function generateReport(reportId) {
  let report = await ReportModel.findById(reportId);

  report.status = "GeneratingReport";
  report = await report.save();
  pubsub.publish("REPORT_STATUS_UPDATED", {
    reportStatusUpdated: report.toObject()
  })

  // generate report
  // added --no-sandbox param to make it work in containerized env.
  const browser = await puppeteer.launch({args: ['--no-sandbox'], headless:'new'});
  const page = await browser.newPage();
  const url = `${WEB_REPORT_URL}/${report.project.toString()}`;
  // const pdf_name =  `report_${report.project.toString()}.pdf`;
  const pdf_name =  getReportFilename(report.project.toString());
  const pdf_path = path.join(REPORT_DIRNAME, pdf_name);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  const pdf = await page.pdf({
    path: pdf_path,
    printBackground: true,
    format: 'A4',
    margin: {
      top: 10,
      bottom: 33,
    },
    displayHeaderFooter: true,
    footerTemplate: `
      <style>#header, #footer { padding: 0 !important; }</style>
      <div style="font-size: 9px; padding: 5px 0px 5px 0px; margin: 0px 15px 0px 0px; text-align: right; width: 100%;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `
  });

  // update report status
  report.status = "ReportGenerated";
  const updatedReport = await report.save();
  // const report = await ReportModel.findOneAndUpdate(
  //   { _id: msg.reportId },
  //   {
  //     "$set": {
  //       status: "ReportGenerated",
  //     }
  //   },
  //   { new: true }
  // )
  pubsub.publish("REPORT_STATUS_UPDATED", {
    reportStatusUpdated: updatedReport.toObject()
  })
}