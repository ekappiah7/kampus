/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@kampus/design-tokens", "@kampus/api-client", "@kampus/shared-types"],
};

module.exports = nextConfig;
