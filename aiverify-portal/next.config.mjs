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
        source: '/api/plugins/upload',
        destination: `${process.env.APIGW_HOST}/plugins/upload`,
      },
      {
        source: '/api/plugins/:id',
        destination: `${process.env.APIGW_HOST}/plugins/:id`,
      },
    ];
  },
};

export default nextConfig;
