import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimización de producción
  compress: true,

  // Optimización de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  // Optimización de rendimiento
  poweredByHeader: false,

  // Headers de caché y seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },

  // Optimización experimental
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
