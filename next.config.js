/** @type {import('next').NextConfig} */
const nextConfig = {
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
