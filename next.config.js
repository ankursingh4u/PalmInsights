/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow MediaPipe wasm/model assets and large image uploads via API routes.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

module.exports = nextConfig;
