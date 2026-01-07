const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
};
