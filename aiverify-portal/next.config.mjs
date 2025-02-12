/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
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
    ];
  },
};

export default nextConfig;
