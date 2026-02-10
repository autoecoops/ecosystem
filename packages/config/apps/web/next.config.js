/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 環境變數
  env: {
    NEXT_PUBLIC_APP_NAME: 'Contracts-L1',
    NEXT_PUBLIC_APP_VERSION: '1.0.0'
  },
  
  // 圖片優化
  images: {
    domains: ['localhost', 'contracts-l1.vercel.app'],
    formats: ['image/avif', 'image/webp']
  },
  
  // 實驗性功能
  experimental: {
    serverActions: true
  },
  
  // Webpack 配置
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    return config;
  }
};

module.exports = nextConfig;
