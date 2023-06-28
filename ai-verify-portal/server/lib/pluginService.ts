import path from 'node:path';
import fs, { statSync } from 'node:fs';
import { exec } from 'node:child_process';
import { Validator } from 'jsonschema';
const validator = new Validator();

import redisConnect from '../redisClient';
export const redis = redisConnect();

import { createProjectTemplate } from './projectServiceBackend';

const PLUGIN_DIR = path.join(process.cwd(), 'plugins');
export const pluginPath = PLUGIN_DIR;

const metaSuffix = '.meta.json';
const pluginMetaFile = "plugin.meta.json";

const python_cmd = process.env.PYTHON_EXECUTABLE || "python3";
const python_script_checker = path.join(process.cwd(), "server/scripts/syntax_checker.py");

// read in the schemas
import pluginSchema from 'config/ai-verify.plugin.schema.json';
import algoSchema from 'config/ai-verify.algorithm.schema.json';
import inputBlockSchema from 'config/ai-verify.inputBlock.schema.json';
import templateSchema from 'config/ai-verify.template.schema.json';
import templateDataSchema from 'config/ai-verify.template.data.json';
import widgetSchema from 'config/ai-verify.widget.schema.json';

const PLUGIN_SET_PREFIX = "plugin:list";

import AIFPlugin, { AIFPluginCache, PluginComponentType } from 'src/types/plugin.interface';
import { bundleMDX } from 'mdx-bundler';
import remarkMdxImages from 'remark-mdx-images';
import remarkGfm from 'remark-gfm';
import { toErrorWithMessage } from 'src/lib/errorUtils';

export function readJSONFromFile(filepath: string, errorReturn: any = {}): any {
  try {
    return JSON.parse(fs.readFileSync(filepath).toString('utf8'));
  } catch (e) {
    console.warn("Unable to read JSON from file", filepath);
    return errorReturn;
  }
}

export function readRequirementsFile(filepath: string): string[] | undefined {
  try {
    const text = fs.readFileSync(filepath).toString('utf8');
    const ar = text.split(/\r?\n/).map(e => e.trim()).filter(e => e.length > 0)
    return ar;
  } catch (e) {
    console.warn("Unable to read JSON from file", filepath);
    return undefined;
  }
}

export async function deletePluginKeysFromRedis() {
  // delete plugin set
  let keys = await redis.keys(`${PLUGIN_SET_PREFIX}:*`);
  for (const key of keys)
    await redis.del(key);
  // delete algo keys
  keys = await redis.keys("algo:*");
  for (const key of keys)
    await redis.del(key);
  // delete widget keys
  keys = await redis.keys("widget:*");
  for (const key of keys)
    await redis.del(key);
  // delete input block keys
  keys = await redis.keys("inputBlock:*");
  for (const key of keys)
    await redis.del(key);
  keys = await redis.keys("template:*");
  for (const key of keys)
    await redis.del(key);
}

/**
 * 
 * @param pdir Plugin directory
 * @param cached for caching the data
 * @returns 
 * @note assume that already validated
 */
export async function scanPluginDirectory(pdir: string, cached: AIFPluginCache | null = null): Promise<AIFPlugin> {
  console.log("scanPluginDirectory", pdir)
  // read in the plugin meta file
  const pluginMeta = readJSONFromFile(path.join(pdir, pluginMetaFile)) as AIFPlugin;
  const pluginKey = `${PLUGIN_SET_PREFIX}:${pluginMeta.gid}`;
  // read in report widgets if any
  const widgets_subdir = path.join(pdir, "widgets");
  let txn = redis.multi();
  if (fs.existsSync(widgets_subdir)) {
    const allfiles = fs.readdirSync(widgets_subdir);
    const metaFiles = allfiles.filter(f => f.endsWith(metaSuffix));
    const reportWidgets = [];
    for (const metaFile of metaFiles) {
      // read widget meta json
      const metaPath = path.join(widgets_subdir, metaFile);
      const widget = readJSONFromFile(metaPath);

      widget.type = PluginComponentType.ReportWidget;
      widget.gid = `${pluginMeta.gid}:${widget.cid}`; // auto set widget gid = <plugin gid>:<cid>
      widget.version = pluginMeta.version;
      widget.pluginGID = pluginMeta.gid;
      // set the path to the MDX
      widget.mdxPath = path.relative(PLUGIN_DIR, path.join(widgets_subdir, `${widget.cid}.mdx`));

      // auto format gid for dependencies
      if (widget.dependencies) {
        for (const dep of widget.dependencies) {
          dep.gid = (dep.gid && dep.gid.length > 0)?`${dep.gid}:${dep.cid}`:`${pluginMeta.gid}:${dep.cid}`;
        }
      }

      // read in mock data if any
      if (widget.mockdata) {
        for (const mock of widget.mockdata) {
          mock.gid = (mock.gid && mock.gid.length > 0)?`${mock.gid}:${mock.cid}`:`${pluginMeta.gid}:${mock.cid}`;
          const datapath = path.join(widgets_subdir, mock.datapath);
          const data = readJSONFromFile(datapath, null);
          mock.data = data;
        }
      }

      const key = `widget:${widget.gid}`;
      txn = txn.hSet(key, "data", JSON.stringify(widget))

      reportWidgets.push(widget.cid);
      if (cached) {
        cached.reportWidgets.push(widget);
      }
    }
    if (reportWidgets.length > 0) {
      txn = txn.hSet(pluginKey, "reportWidgets", JSON.stringify(reportWidgets));
    }
  }

  const inputs_subdir = path.join(pdir, "inputs");
  if (fs.existsSync(inputs_subdir)) {
    const allfiles = fs.readdirSync(inputs_subdir);
    const metaFiles = allfiles.filter(f => f.endsWith(metaSuffix));
    const inputBlocks = [];
    for (const metaFile of metaFiles) {
      // read widget meta json
      const metaPath = path.join(inputs_subdir, metaFile);
      const widget = readJSONFromFile(metaPath);

      widget.type = PluginComponentType.InputBlock;
      widget.gid = `${pluginMeta.gid}:${widget.cid}`; // auto set widget gid = <plugin gid>:<cid>
      widget.version = pluginMeta.version;
      widget.pluginGID = pluginMeta.gid;
      if (!widget.width)
        widget.width = "md"; // set default width to md
      // set the path to the MDX
      widget.mdxPath = path.relative(PLUGIN_DIR, path.join(inputs_subdir, `${widget.cid}.mdx`))
      widget.summaryPath = path.relative(PLUGIN_DIR, path.join(inputs_subdir, `${widget.cid}.summary.mdx`))
      const key = `inputBlock:${widget.gid}`;
      txn = txn.hSet(key, "data", JSON.stringify(widget));
      inputBlocks.push(widget.cid);
      if (cached) {
        cached.inputBlocks.push(widget);
      }
    }
    if (inputBlocks.length > 0) {
      txn = txn.hSet(pluginKey, "inputBlocks", JSON.stringify(inputBlocks));
    }
  }

  const templates_subdir = path.join(pdir, "templates");
  if (fs.existsSync(templates_subdir)) {
    const allfiles = fs.readdirSync(templates_subdir);
    const metaFiles = allfiles.filter(f => f.endsWith(metaSuffix));
    const templates = [];
    for (const metaFile of metaFiles) {
      // console.log("metaFile", metaFile)
      // read widget meta json
      const metaPath = path.join(templates_subdir, metaFile);
      const template = readJSONFromFile(metaPath);

      template.type = PluginComponentType.Template;
      template.gid = `${pluginMeta.gid}:${template.cid}`; // auto set widget gid = <plugin gid>:<cid>
      template.version = pluginMeta.version;
      template.pluginGID = pluginMeta.gid;

      const dataPath = path.join(templates_subdir, `${template.cid}.data.json`);
      const data = readJSONFromFile(dataPath);
      data.fromPlugin = true;
      data.projectInfo = {
        name: template.name,
        description: template.description || undefined,
        company: template.author || undefined,
      }

      const id = await createProjectTemplate(data);
      // data.id = id;
      // console.log("id", id);

      // template.data = path.relative(PLUGIN_DIR, path.join(templates_subdir, `${template.cid}.mdx`))
      const key = `template:${template.gid}`;
      txn = txn.hSet(key, "data", JSON.stringify(template));
      txn = txn.hSet(key, "data2", JSON.stringify(data));
      txn = txn.hSet(key, "id", id);
      // const typedWidget = widget as InputBlock;
      // // console.log("typedWidget", typedWidget.type);
      // pluginMeta.inputBlocks.push(typedWidget);
      templates.push(template.cid);
      if (cached) {
        cached.templates.push(template);
        // cached._mymap[widget.gid] = widget;
      }

    }
    if (templates.length > 0) {
      // pluginMeta.inputBlocks = inputBlocks;
      txn = txn.hSet(pluginKey, "templates", JSON.stringify(templates));
    }
  }

  const algo_subdir = path.join(pdir, "algorithms");
  if (fs.existsSync(algo_subdir)) {
    // console.log("algo_subdir", algo_subdir)
    // console.log("version", pluginMeta)
    const algodirs = fs.readdirSync(algo_subdir);
    // console.log("allfiles", algodirs)
    const algorithms = [];
    for (const cid of algodirs) {
      const mydir = path.join(algo_subdir, cid);
      // console.log("mydir", mydir)
      if (!fs.lstatSync(mydir).isDirectory())
        continue;
      const metaPath = path.join(mydir, `${cid}.meta.json`);
      const algo = readJSONFromFile(metaPath);

      algo.type = PluginComponentType.Algorithm;
      algo.gid = `${pluginMeta.gid}:${algo.cid}`; // auto set widget gid = <plugin gid>:<cid>
      algo.version = pluginMeta.version;
      algo.pluginGID = pluginMeta.gid;
      algo.algoPath = path.join(algo_subdir, cid)
      const key = `algo:${algo.gid}`;
      // read requirements.txt
      const requirements = readRequirementsFile(path.join(mydir, "requirements.txt"));
      // read input and output schema
      const inputSchema = readJSONFromFile(path.join(mydir, "input.schema.json"), null);
      const outputSchema = readJSONFromFile(path.join(mydir, "output.schema.json"), null)

      txn = txn.hSet(key, "data", JSON.stringify(algo))
        .hSet(key, "requirements", JSON.stringify(requirements))
        .hSet(key, "inputSchema", JSON.stringify(inputSchema))
        .hSet(key, "outputSchema", JSON.stringify(outputSchema))

      algo.requirements = requirements;
      algo.inputSchema = inputSchema;
      algo.outputSchema = outputSchema;

      algorithms.push(algo.cid);
      if (cached) {
        cached.algorithms.push(algo);
      }
    }
    if (algorithms.length > 0) {
      txn = txn.hSet(pluginKey, "algorithms", JSON.stringify(algorithms))
    }
  }

  txn = txn.hSet(pluginKey, "meta", JSON.stringify(pluginMeta));

  try {
    const { birthtime } = statSync(pdir);
    const timestamp = new Date(birthtime).getTime();
    txn = txn.hSet(pluginKey, 'installedAt', timestamp.toString());
  } catch(err) {
    console.log(toErrorWithMessage(err));
  }

  txn.exec();
  return pluginMeta;
} // scanPluginDirectory

function validatePythonScript (scriptPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(scriptPath))
      return reject("Script does not exists");

    try {
      exec(`${python_cmd} ${python_script_checker} "${scriptPath}"`, (error) => {
        if (error)
          return reject("Invalid python script");
        else
          return resolve()
      })
    } catch (e) {
      return reject(e);
    }

  })
} 

async function validateMDX (scriptPath: string): Promise<void> {
  await bundleMDX({
		// cwd: pluginPath,
		file: scriptPath,
		// globals: {'MyCheckbox':'MyCheckbox'},
		// globals: {'ai-verify-shared-library/charts':'ai-verify-shared-library/charts'},
    mdxOptions: options => {
			options.remarkPlugins = [...(options.remarkPlugins ?? []), remarkMdxImages, remarkGfm]
			return options
		},
		esbuildOptions: options => {
			options.loader = {
				...options.loader,
				'.png': 'dataurl',
			}
      options.external = [
        "ai-verify-shared-library/*"
      ]
			return options
		},
	})
  // console.log("validateMDX result", result)
  return;
}

async function validateSummary (scriptPath: string): Promise<void> {
  await bundleMDX({
		file: scriptPath,
	})
}

export function validatePluginDirectory(pdir: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    // read in the plugin meta file
    const pluginMeta = readJSONFromFile(path.join(pdir, pluginMetaFile));
    const res = validator.validate(pluginMeta, pluginSchema);
    if (!res.valid) {
      return reject("Invalid plugin schema");
    }

    const widgets_subdir = path.join(pdir, "widgets");
    if (fs.existsSync(widgets_subdir)) {
      const allfiles = fs.readdirSync(widgets_subdir);
      const metaFiles = allfiles.filter(f => f.endsWith(metaSuffix));
      // pluginMeta.reportWidgets = [];
      for (const metaFile of metaFiles) {
        // read widget meta json
        const metaPath = path.join(widgets_subdir, metaFile);
        const widget = readJSONFromFile(metaPath);
        const res = validator.validate(widget, widgetSchema);
        if (!res.valid) {
          return reject("Invalid widget schema: " + res.errors);
        }

        // validate mdx
        const mdxPath = path.join(widgets_subdir, `${widget.cid}.mdx`);
        try {
          await validateMDX(mdxPath);
        } catch (e) {
          console.log("widget MDX error", e);
          return reject(`widget ${widget.cid} MDX is invalid`);
        }

        // read in mock data if any
        if (widget.mockdata) {
          for (const mock of widget.mockdata) {
            const datapath = path.join(widgets_subdir, mock.datapath);
            const relative = path.relative(pdir, datapath);
            if (relative.startsWith(".")) {
              return reject("Invalid data path");
            }
            // console.log("paths", pdir, datapath)
            // console.log("relative", relative)
            const data = readJSONFromFile(datapath, null);
            if (!data) {
              return reject("Unable to read sample data");
            }
          }
        }
      }
    }

    const inputs_subdir = path.join(pdir, "inputs");
    if (fs.existsSync(inputs_subdir)) {
      const allfiles = fs.readdirSync(inputs_subdir);
      const metaFiles = allfiles.filter(f => f.endsWith(metaSuffix));
      for (const metaFile of metaFiles) {
        // console.log("metaFile", metaFile)
        // read widget meta json
        const metaPath = path.join(inputs_subdir, metaFile);
        const widget = readJSONFromFile(metaPath);
        const res = validator.validate(widget, inputBlockSchema);
        if (!res.valid) {
          return reject("Invalid input block schema: " + res.errors);
        }

        // validate mdx
        const mdxPath = path.join(inputs_subdir, `${widget.cid}.mdx`);
        try {
          await validateMDX(mdxPath);
        } catch (e) {
          console.log("input block mdx error", e)
          return reject(`Input block ${widget.cid} MDX is invalid`);
        }

        const summaryPath = path.join(inputs_subdir, `${widget.cid}.summary.mdx`);
        try {
          await validateSummary(summaryPath);
        } catch (e) {
          console.log("input block summary mdx error", e)
          return reject(`Input block ${widget.cid} summary MDX is invalid`);
        }


      }
    }

    const template_subdir = path.join(pdir, "templates");
    if (fs.existsSync(template_subdir)) {
      const allfiles = fs.readdirSync(template_subdir);
      const metaFiles = allfiles.filter(f => f.endsWith(metaSuffix));
      for (const metaFile of metaFiles) {
        // read template meta json
        const metaPath = path.join(template_subdir, metaFile);
        const template = readJSONFromFile(metaPath);
        const res = validator.validate(template, templateSchema);
        if (!res.valid) {
          return reject("Invalid template schema");
        }
        const dataPath = path.join(template_subdir, `${template.cid}.data.json`);
        const data = readJSONFromFile(dataPath);
        const res2 = validator.validate(data, templateDataSchema as any);
        if (!res2.valid) {
          console.log("data validation failed", res2.errors)
          return reject("Invalid template data schema");
        }

      }
    }

    const algo_subdir = path.join(pdir, "algorithms");
    if (fs.existsSync(algo_subdir)) {
      const algodirs = fs.readdirSync(algo_subdir);
      for (const cid of algodirs) {
        const mydir = path.join(algo_subdir, cid);
        if (!fs.lstatSync(mydir).isDirectory())
          continue;
        
        // read algorithm meta
        const metaPath = path.join(mydir, `${cid}.meta.json`);
        const algo = readJSONFromFile(metaPath);
        const res = validator.validate(algo, algoSchema);
        if (!res.valid) {
          return reject("Invalid algorithm schema");
        }

        // validate algo script
        const scriptPath = path.join(mydir, `${algo.cid}.py`)
        try {
          await validatePythonScript(scriptPath);
        } catch(e) {
          return reject(`Algorithm ${algo.cid} python script is invalid`);
        }

        // read requirements.txt
        const requirements = readRequirementsFile(path.join(mydir, "requirements.txt"));
        if (!requirements) {
          return reject("Unable to read requirements file");
        }
        // read input and output schema
        const inputSchema = readJSONFromFile(path.join(mydir, "input.schema.json"), null);
        if (!inputSchema) {
          return reject("Unable to read input.schema.json");
        }
        const outputSchema = readJSONFromFile(path.join(mydir, "output.schema.json"), null)
        if (!outputSchema) {
          return reject("Unable to read output.schema.json");
        }

      }
    }

    resolve(pluginMeta.gid);
  })

}


