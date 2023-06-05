#!/usr/bin/env node
const fs = require("node:fs");

var AdmZip = require("adm-zip");

var zip = new AdmZip();
zip.addLocalFile("plugin.meta.json");

if (fs.existsSync("widgets")) {
  zip.addFile("widgets/", null)
  zip.addLocalFolder("widgets", "widgets")
}

if (fs.existsSync("inputs")) {
  zip.addFile("widgets/", null)
  zip.addLocalFolder("inputs", "inputs")
}

// write to disk
zip.writeZip("aiverify.stock.decorators-1.0.0.zip")
