/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@prosumate/types', '@prosumate/validation'],
};

export default nextConfig;
