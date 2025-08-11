import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  images: {
    unoptimized: true
  },
  // Production performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  // Development origin configuration
  allowedDevOrigins: ["ed05f478-ebce-4354-8724-e8d53e7b71bb-00-2pl9qknxjef96.sisko.replit.dev"],
  
  // Experimental features for better performance
  experimental: {
    // Enable server actions for better performance
    serverActions: {
      allowedOrigins: ["ed05f478-ebce-4354-8724-e8d53e7b71bb-00-2pl9qknxjef96.sisko.replit.dev"]
    },
    // Enable optimize package imports
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // Webpack optimizations for production
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // 禁用 webpack 的热模块替换
      config.watchOptions = {
        ignored: ['**/*'], // 忽略所有文件变化
      };
    }
    
    // Production optimizations
    if (!dev && !isServer) {
      // Enable code splitting optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
            },
          },
        },
      };
    }
    
    return config;
  },
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
