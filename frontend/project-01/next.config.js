/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
  },
  // Note: Do NOT use output: 'export' for this app
  // This app has API routes that require server runtime
  // Deploy to Vercel or use Cloudflare Workers with @cloudflare/next-on-pages
};

module.exports = nextConfig;
