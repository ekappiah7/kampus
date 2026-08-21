/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@kampus/design-tokens"],
};

module.exports = nextConfig;
