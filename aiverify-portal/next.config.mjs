/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
};

export default nextConfig;
