/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/projects/projects/:id',
        destination: `${process.env.APIGW_HOST}/projects/projects/:id`,
      },
      {
        source: '/api/test_results/upload',
        destination: `${process.env.APIGW_HOST}/test_results/upload`,
      },
      {
        source: '/api/test_results/upload_zip',
        destination: `${process.env.APIGW_HOST}/test_results/upload_zip`,
      },
      {
        source: '/api/plugins/:pluginId/bundle/:widgetId',
        destination: `${process.env.APIGW_HOST}/plugins/:pluginId/bundle/:widgetId`,
      },
      {
        source: '/api/test_datasets',
        destination: `${process.env.APIGW_HOST}/test_datasets`,
      },
      {
        source: '/api/test_datasets/upload',
        destination: `${process.env.APIGW_HOST}/test_datasets/upload`,
      },
      {
        source: '/api/plugins/upload',
        destination: `${process.env.APIGW_HOST}/plugins/upload`,
      },
      {
        source: '/api/plugins/:id',
        destination: `${process.env.APIGW_HOST}/plugins/:id`,
      },
      {
        source: '/api/plugins/:gid/bundle/:cid',
        destination: `${process.env.APIGW_HOST}/plugins/:gid/bundle/:cid`,
      },
      {
        source: '/api/plugins/:gid/summary/:cid',
        destination: `${process.env.APIGW_HOST}/plugins/:gid/summary/:cid`,
      },
      {
        source: '/api/plugins/:gid/input_blocks',
        destination: `${process.env.APIGW_HOST}/plugins/:gid/input_blocks`,
      },
      {
        source: '/api/input_block_data/:id',
        destination: `${process.env.APIGW_HOST}/input_block_data/:id`,
      },
      {
        source: '/api/input_block_data',
        destination: `${process.env.APIGW_HOST}/input_block_data/`,
      },
    ];
  },
};

export default nextConfig;
