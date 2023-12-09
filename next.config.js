/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.profile-image.st-hatena.com",
      },
    ],
  },
};

module.exports = nextConfig;
