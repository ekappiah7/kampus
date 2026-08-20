/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@kampus/design-tokens", "@kampus/api-client", "@kampus/shared-types"],
};

module.exports = nextConfig;
