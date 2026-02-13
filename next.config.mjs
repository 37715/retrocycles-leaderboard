/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400"
          }
        ]
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
