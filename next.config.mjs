/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/images/[...path]": ["./images/**/*"],
    "/images/[...path]/route": ["./images/**/*"],
    "/app/images/[...path]/route": ["./images/**/*"],
    "/assets/[...path]": ["./assets/**/*"],
    "/assets/[...path]/route": ["./assets/**/*"],
    "/app/assets/[...path]/route": ["./assets/**/*"],
    "/favicon.svg/route": ["./favicon.svg"]
  },
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
