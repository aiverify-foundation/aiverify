/**
 * Service layer for plugin manager
 */
import path from 'node:path';
import fs from 'node:fs';

import AIFPlugin, {
  ReportWidget,
  ReportWidgetStatus,
  InputBlock,
  Algorithm,
  ProjectTemplateComponent,
  BasePluginComponent,
} from 'src/types/plugin.interface';
import PluginManagerType from 'src/types/pluginManager.interface';
import stockPlugins from 'config/plugin.stock';
import {
  redis,
  deletePluginKeysFromRedis,
  pluginPath,
  scanPluginDirectory,
  validatePluginDirectory,
} from './lib/pluginService';
import { deleteProjectTemplate } from './lib/projectServiceBackend';

import moment from 'moment';
import samver from 'semver';
import ProjectTemplate from 'src/types/projectTemplate.interface';
import { toErrorWithMessage } from 'src/lib/errorUtils';

// let cached = global.plugins;
const LAST_MODIFIED_KEY = 'plugin:lastModified';
const PLUGIN_SET_PREFIX = 'plugin:list';

/**
 * Scan the plugins directory and retrieve list of plugins and widgets.
 * No validation here. Assume that plugins already validated and well-behaved.
 */
async function scanPluginDirectories() {
  console.log('scanPluginDirectories');
  const pluginsDir = fs.readdirSync(pluginPath);
  await deletePluginKeysFromRedis();
  const cached = {
    reportWidgets: [] as ReportWidget[],
    inputBlocks: [] as InputBlock[],
    algorithms: [] as Algorithm[],
    templates: [] as ProjectTemplateComponent[],
  };
  for (const dir of pluginsDir) {
    const pdir = path.join(pluginPath, dir);
    try {
      await validatePluginDirectory(pdir);
      await scanPluginDirectory(pdir, cached);
    } catch (e) {
      console.log('Error reading plugin:', e);
    }
  }

  // Check widget dependencies
  /*
  for (let widget of cached.reportWidgets) {
      let status = ReportWidgetStatus.OK;
      if (widget.dependencies) {
          for (let dep of widget.dependencies) {
              // let comp = getByGID(dep.gid);
              let comp = cached._mymap[dep.gid] || null
              // console.log('dep', dep, comp, comp?.type)
              dep.valid = !!comp;
              if (!dep.valid)
                  status = ReportWidgetStatus.MissingDependencies;
          }
      }
      widget.status = status;
      const key = `widget:${widget.gid}`;
      await redis.hSet(key, 'data', JSON.stringify(widget))
  }
  */

  return cached;
}

export async function deletePlugin(gid: string, publish = true) {
  // check if gid exists
  const rediskey = `plugin:list:${gid}`;
  const alldata = await redis.hGetAll(rediskey);
  const keys = Object.keys(alldata);
  if (keys.length == 0) {
    throw new Error('Invalid gid ' + rediskey);
  }

  if (keys.includes('inputBlocks')) {
    const inputBlocks = JSON.parse(alldata['inputBlocks']);
    for (const ib of inputBlocks) {
      await redis.del(`inputBlock:${gid}:${ib}`);
    }
  }
  if (keys.includes('reportWidgets')) {
    const reportWidgets = JSON.parse(alldata['reportWidgets']);
    for (const ib of reportWidgets) {
      await redis.del(`widget:${gid}:${ib}`);
    }
  }
  if (keys.includes('templates')) {
    const templates = JSON.parse(alldata['templates']);
    for (const template of templates) {
      const key = `template:${gid}:${template}`;
      const id = await redis.hGet(key, 'id');
      await redis.del(key);
      if (id) deleteProjectTemplate(id);
    }
  }
  if (keys.includes('algorithms')) {
    const algorithms = JSON.parse(alldata['algorithms']);
    for (const ib of algorithms) {
      const key = `algo:${gid}:${ib}`;
      if (publish) await redis.publish('algo.delete', key);
      await redis.del(key);
    }
  }

  await redis.del(rediskey);

  const pdir = path.join(pluginPath, gid);
  fs.rmSync(pdir, { recursive: true });
}

export async function installPlugin(tempDir: string) {
  const gid = await validatePluginDirectory(tempDir);
  const pdir = path.join(pluginPath, gid);

  // validate path
  const relative = path.relative(pluginPath, pdir);
  if (relative.startsWith('.')) {
    throw 'Invalid GID';
  }
  // if pdir already exists, remove old dir
  let isUpdate = false;
  if (fs.existsSync(pdir)) {
    isUpdate = true;
    await deletePlugin(gid, false);
  }
  // kwk-v0.4.1 - change rename to cp. The plugins folder need to
  // be mapped to a mounted volume for test engine to access the uploaded
  // plugin files. As plugins folder now is a different filesystem then
  // the temp dir, need to change rename to cp and rm as rename doesn't
  // work across filesystems.
  fs.cpSync(tempDir, pdir, { recursive: true });
  fs.rmSync(tempDir, { recursive: true, force: true });

  const cached = {
    reportWidgets: [] as ReportWidget[],
    inputBlocks: [] as InputBlock[],
    algorithms: [] as Algorithm[],
    templates: [] as ProjectTemplateComponent[],
  }; // clear the cached

  const plugin = await scanPluginDirectory(pdir, cached);
  plugin.isStock = stockPlugins.includes(gid);
  if (cached.reportWidgets) plugin.reportWidgets = cached.reportWidgets;
  if (cached.inputBlocks) plugin.inputBlocks = cached.inputBlocks;
  if (cached.templates) plugin.templates = cached.templates;
  if (cached.algorithms) {
    plugin.algorithms = cached.algorithms;
    // publish install msg to redis
    for (const algo of plugin.algorithms) {
      redis.publish(
        isUpdate ? 'algo.update' : 'algo.install',
        `algo:${algo.gid}`
      );
    }
  }

  return plugin;
}

export async function getByGID(
  gid: string
): Promise<
  AIFPlugin | InputBlock | ReportWidget | Algorithm | ProjectTemplate | null
> {
  const key = await redis.keys(`*:${gid}`);
  if (key.length == 0) return null;
  const data = await redis.hGet(key[0], 'data');
  if (!data) return null;
  const obj = JSON.parse(data);
  switch (obj.type) {
    case 'Algorithm':
      obj.requirements = JSON.parse(
        (await redis.hGet(key[0], 'requirements')) || '[]'
      );
      obj.inputSchema = JSON.parse(
        (await redis.hGet(key[0], 'inputSchema')) || '{}'
      );
      obj.outputSchema = JSON.parse(
        (await redis.hGet(key[0], 'outputSchema')) || '{}'
      );
      return obj as Algorithm;
    case 'InputBlock':
      return obj as InputBlock;
    case 'Template':
      obj.data = JSON.parse((await redis.hGet(key[0], 'data2')) || '{}');
      obj.id = (await redis.hGet(key[0], 'id')) || null;
      return obj as ProjectTemplate;
    case 'ReportWidget':
      return obj as ReportWidget;
    default:
      return null;
  }
}

async function checkPluginDir() {
  if (!fs.existsSync(pluginPath)) {
    await deletePluginKeysFromRedis();
    await redis.del(LAST_MODIFIED_KEY);
    fs.mkdirSync(pluginPath);
    return;
  }
  const mtime = await redis.hGet(LAST_MODIFIED_KEY, 'mtime');
  if (!mtime) {
    await redis.hSet(LAST_MODIFIED_KEY, 'mtime', moment().toISOString());
    try {
      await scanPluginDirectories();
    } catch (e) {
      console.error('Scan plugins dir error', e);
    }
  }
}

export async function getPlugins(populate = true): Promise<PluginManagerType> {
  // check whether plugins directory exists and populate the redis registries if empty
  await checkPluginDir();

  const keys = await redis.keys(`${PLUGIN_SET_PREFIX}:*`);
  const plugins: AIFPlugin[] = [];
  const inputBlocks: InputBlock[] = [];
  const algorithms: Algorithm[] = [];
  const reportWidgets: ReportWidget[] = [];
  const templates: ProjectTemplate[] = [];
  const _mymap: any = {};

  for (const rediskey of keys) {
    const gid = rediskey.slice(PLUGIN_SET_PREFIX.length + 1);
    let plugin = {} as any;
    if (populate) {
      const allKV = await redis.hGetAll(rediskey);
      plugin = JSON.parse(allKV['meta']);

      const getComponents = async (key: string) => {
        if (!allKV[key]) return;
        const obj = JSON.parse(allKV[key]);
        plugin[key] = [];
        for (const cid of obj as string[]) {
          const comp = await getByGID(`${gid}:${cid}`);
          if (comp) {
            if (key !== 'templates')
              _mymap[(comp as BasePluginComponent).gid] = plugin.version;
            plugin[key].push(comp);
            if (key === 'inputBlocks') inputBlocks.push(comp as InputBlock);
            else if (key === 'algorithms') algorithms.push(comp as Algorithm);
            else if (key === 'reportWidgets')
              reportWidgets.push(comp as ReportWidget);
            else if (key === 'templates')
              templates.push(comp as ProjectTemplate);
          }
        }
      };

      await Promise.all([
        getComponents('reportWidgets'),
        getComponents('inputBlocks'),
        getComponents('algorithms'),
        getComponents('templates'),
      ]);

      plugin.isStock = stockPlugins.includes(gid);
      try {
        plugin.installedAt = parseInt(allKV['installedAt']);
      } catch (err) {
        console.log(toErrorWithMessage(err));
      }
      plugins.push(plugin);
    } else {
      const meta = await redis.hGet(rediskey, 'meta');
      if (meta) plugins.push(JSON.parse(meta));
    }
  }

  // Check widget dependencies
  for (const widget of reportWidgets) {
    let status = ReportWidgetStatus.OK;
    if (widget.dependencies) {
      for (const dep of widget.dependencies) {
        dep.valid = false;
        if (_mymap[dep.gid]) {
          if (dep.version)
            dep.valid = samver.satisfies(_mymap[dep.gid], dep.version);
          else dep.valid = true;
        }
        if (!dep.valid) {
          status = ReportWidgetStatus.MissingDependencies;
        }
      }
    }
    widget.status = status;
  }

  plugins.sort((a, b) => (a.installedAt < b.installedAt ? -1 : 1));

  return {
    plugins,
    inputBlocks,
    algorithms,
    templates,
    stockPlugins,
  };
}

export function isStockPlugin(gid: string) {
  return stockPlugins.includes(gid);
}
