/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@prosumate/types', '@prosumate/validation'],
  output: 'standalone',
};

export default nextConfig;
