/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  reactStrictMode: false, // 開発環境でAPIが2回呼ばれるのを防止
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.profile-image.st-hatena.com",
      },
      {
        protocol: "https",
        hostname: "cdn-ak-scissors.b.st-hatena.com",
      },
    ],
  },
};

module.exports = nextConfig;
