import { bundleSummaryMDX } from "./bundler";
import path from "node:path";
import fs from "node:fs";

if (process.argv.length < 3) {
  console.error("Invalid number of arguments");
  process.exit(-1);
}

const scriptPath = path.resolve(process.argv[2]);
const outputFile = process.argv.length >= 4 ? process.argv[3] : null;
// console.log(`Validating script "${scriptPath}"...`)

async function validateMDX(scriptPath: string): Promise<boolean> {
  try {
    const result = await bundleSummaryMDX(scriptPath);
    const json_str = JSON.stringify(result);
    if (outputFile) {
      fs.writeFileSync(outputFile, json_str);
    }
    process.stdout.write(json_str);
    return true;
  } catch {
    return false;
  }
}

validateMDX(scriptPath)
  .then((value) => {
    process.exit(value ? 0 : -1);
  })
  .catch((e) => {
    console.error(`Validate MDX error: ${e}`);
    process.exit(-1);
  });
