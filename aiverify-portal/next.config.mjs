/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      serverActions: {
        bodySizeLimit: '5mb', // Increase body size limit to 5 MB (adjust as needed)
      },
    },
    async rewrites() {
      const apiGatewayHost = process.env.APIGW_HOST || "http://127.0.0.1:4000"; // Use a default or throw error
      return [
        {
          source: '/api/plugins/upload',
          destination: `${apiGatewayHost}/plugins/upload`,
        },
      ];
    },
  };
  
  export default nextConfig;
  