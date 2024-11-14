/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/test_result/upload',
        destination: `${process.env.APIGW_HOST}/test_result/upload`,
      },
    ];
  },
};

export default nextConfig;
