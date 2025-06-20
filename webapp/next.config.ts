import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Disable source maps in production for smaller bundle size
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    unoptimized: true, // For static export compatibility
  },
  
  // Experimental features
  experimental: {
    // Enable modern bundling
    turbo: {
      loaders: {
        '.svg': ['@svgr/webpack'],
      },
    },
  },
};

export default nextConfig;
