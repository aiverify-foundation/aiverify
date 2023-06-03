import AdmZip from 'adm-zip';
import _ from 'lodash';

import { ProjectTemplateModel } from '#models';


function buildPluginMeta (doc, pluginGID) {
  let meta = {
    "gid": pluginGID,
    "version": "1.0.0",
    "name": doc.projectInfo.name,
    "description": doc.projectInfo.description || "",
    "author": doc.projectInfo.company || "",
  }
  return JSON.stringify(meta,null,2);
}

function buildTemplateMeta (doc, templateCID, tags) {
  let meta = {
    "cid": templateCID,
    "name": doc.projectInfo.name,
    "description": doc.projectInfo.description,
    "tags": tags || undefined,  
  }
  return JSON.stringify(meta,null,2);
}

export function exportToPlugin (doc, pluginGID, templateCID, tags) {
  let zip = new AdmZip();
  const pluginMeta = buildPluginMeta(doc, pluginGID);
  zip.addFile("plugin.meta.json", Buffer.from(pluginMeta, "utf8"));
  const templateMeta = buildTemplateMeta(doc, templateCID, tags);
  zip.addFile(`templates/`, null);
  zip.addFile(`templates/${templateCID}.meta.json`, Buffer.from(templateMeta, "utf8"));
  let data = _.pick(doc.toJSON(),['pages','globalVars']);
  if (data.globalVars) {
    data.globalVars = data.globalVars.map(e => {
      delete e._id;
      return e;
    })
  }
  if (data.pages) {
    for (let page of data.pages) {
      page.reportWidgets = page.reportWidgets.map(e => {
        delete e._id;
        return e;
      })
      delete page._id;
    }
  }
  // console.log("data", data);
  zip.addFile(`templates/${templateCID}.data.json`, Buffer.from(JSON.stringify(data,null,2), "utf8"));
  return zip;
}

