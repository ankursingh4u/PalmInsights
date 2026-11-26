/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for the Coolify Docker deployment.
  output: "standalone",
  // Allow MediaPipe wasm/model assets and large image uploads via API routes.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

module.exports = nextConfig;
