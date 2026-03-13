/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Transpile local workspace packages that ship TypeScript source directly
  transpilePackages: ['@regulyn/config', '@regulyn/ui', '@regulyn/auth', '@regulyn/i18n', '@regulyn/api-client'],
};

module.exports = nextConfig;
