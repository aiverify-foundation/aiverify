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
    ];
  },
};

export default nextConfig;
