/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  skipTrailingSlashRedirect: true,
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/projects/projects/:id',
  //       destination: `${process.env.APIGW_HOST}/projects/projects/:id`,
  //     },
  //     {
  //       source: '/api/test_results/upload',
  //       destination: `${process.env.APIGW_HOST}/test_results/upload`,
  //     },
  //     {
  //       source: '/api/test_results/upload_zip',
  //       destination: `${process.env.APIGW_HOST}/test_results/upload_zip`,
  //     },
  //     {
  //       source: '/api/plugins/:pluginId/bundle/:widgetId',
  //       destination: `${process.env.APIGW_HOST}/plugins/:pluginId/bundle/:widgetId`,
  //     },
  //     {
  //       source: '/api/test_datasets',
  //       destination: `${process.env.APIGW_HOST}/test_datasets`,
  //     },
  //     {
  //       source: '/api/test_datasets/upload',
  //       destination: `${process.env.APIGW_HOST}/test_datasets/upload`,
  //     },
  //     {
  //       source: '/api/test_datasets/upload_folder',
  //       destination: `${process.env.APIGW_HOST}/test_datasets/upload_folder`,
  //     },
  //     {
  //       source: '/api/plugins/upload',
  //       destination: `${process.env.APIGW_HOST}/plugins/upload`,
  //     },
  //     {
  //       source: '/api/plugins/:id',
  //       destination: `${process.env.APIGW_HOST}/plugins/:id`,
  //     },
  //     {
  //       source: '/api/plugins/:gid/bundle/:cid',
  //       destination: `${process.env.APIGW_HOST}/plugins/:gid/bundle/:cid`,
  //     },
  //     {
  //       source: '/api/plugins/:gid/summary/:cid',
  //       destination: `${process.env.APIGW_HOST}/plugins/:gid/summary/:cid`,
  //     },
  //     {
  //       source: '/api/plugins/:gid/input_blocks',
  //       destination: `${process.env.APIGW_HOST}/plugins/:gid/input_blocks`,
  //     },
  //     {
  //       source: '/api/input_block_data/:id',
  //       destination: `${process.env.APIGW_HOST}/input_block_data/:id`,
  //     },
  //     {
  //       source: '/api/input_block_data/groups/:id',
  //       destination: `${process.env.APIGW_HOST}/input_block_data/groups/:id`,
  //     },
  //     {
  //       source: '/api/input_block_data',
  //       destination: `${process.env.APIGW_HOST}/input_block_data/`,
  //     },
  //     {
  //       source: '/api/input_block_data/groups',
  //       destination: `${process.env.APIGW_HOST}/input_block_data/groups/`,
  //     },
  //     {
  //       source: '/api/input_block_data/groups/:gid/:group',
  //       destination: `${process.env.APIGW_HOST}/input_block_data/groups/:gid/:group`,
  //     },
  //     {
  //       source: '/api/test_models/:id',
  //       destination: `${process.env.APIGW_HOST}/test_models/:id`,
  //     },
  //     {
  //       source: '/api/project_templates/:id',
  //       destination: `${process.env.APIGW_HOST}/project_templates/:id`,
  //     },
  //     {
  //       source: '/api/test_models/exportModelAPI/:id',
  //       destination: `${process.env.APIGW_HOST}/test_models/exportModelAPI/:id`,
  //     },
  //     {
  //       source: '/api/test_models/download/:id',
  //       destination: `${process.env.APIGW_HOST}/test_models/download/:id`,
  //     },
  //     {
  //       source: '/api/test_models/upload',
  //       destination: `${process.env.APIGW_HOST}/test_models/upload`,
  //     },
  //     {
  //       source: '/api/test_models/upload_folder',
  //       destination: `${process.env.APIGW_HOST}/test_models/upload_folder`,
  //     },
  //     {
  //       source: '/api/test_models/modelapi',
  //       destination: `${process.env.APIGW_HOST}/test_models/modelapi`,
  //     },
  //     {
  //       source: '/api/project_templates',
  //       destination: `${process.env.APIGW_HOST}/project_templates/`,
  //     },
  //     {
  //       source: '/api/project_templates/:id',
  //       destination: `${process.env.APIGW_HOST}/project_templates/:id`,
  //     },
  //     {
  //       source: '/api/projects/saveProjectAsTemplate/:id',
  //       destination: `${process.env.APIGW_HOST}/projects/saveProjectAsTemplate/:id`,
  //     },
  //     {
  //       source: '/api/project_templates/export/:id',
  //       destination: `${process.env.APIGW_HOST}/project_templates/export/:id`,
  //     },
  //     {
  //       source: '/api/project_templates/clone/:id',
  //       destination: `${process.env.APIGW_HOST}/project_templates/clone/:id`,
  //     },
  //     {
  //       source: '/api/test_runs/run_test',
  //       destination: `${process.env.APIGW_HOST}/test_runs/run_test/`,
  //     },
  //     {
  //       source: '/api/test_runs',
  //       destination: `${process.env.APIGW_HOST}/test_runs/`,
  //     },
  //     {
  //       source: '/api/test_runs/:id',
  //       destination: `${process.env.APIGW_HOST}/test_runs/:id`,
  //     },
  //     {
  //       source: '/api/test_runs/:id/cancel',
  //       destination: `${process.env.APIGW_HOST}/test_runs/:id/cancel`,
  //     },
  //   ];
  // },
  experimental: {
    proxyTimeout: parseInt(process.env.PROXY_TIMEOUT || '60000'),
  },
};

export default nextConfig;
