/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,
      },
    ];
  },
  rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: `${process.env.APIGW_URL}/graphql`,
      },
      {
        source: '/api/upload/data',
        destination: `${process.env.APIGW_URL}/upload/data`,
      },
      {
        source: '/api/upload/model',
        destination: `${process.env.APIGW_URL}/upload/model`,
      },
      {
        source: '/api/report/:projectId',
        destination: `${process.env.APIGW_URL}/report/:projectId`,
      },
      {
        source: '/api/template/:path',
        destination: `${process.env.APIGW_URL}/template/:path`,
      },
      {
        source: '/api/logs/:projectId',
        destination: `${process.env.APIGW_URL}/logs/:projectId`,
      },
      {
        source: '/api/requirements/client',
        destination: process.env.TEST_ENGINE_URL
          ? `${process.env.TEST_ENGINE_URL}/requirements/client`
          : 'http://localhost:8080/requirements/client',
      },
    ];
  },
  eslint: {
    dirs: ['pages', 'server', 'src', 'plugins'],
  },
};
