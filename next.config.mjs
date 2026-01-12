/** @type {import('next').NextConfig} */
const nextConfig = {
  // webpack 캐시 비활성화 (OneDrive 동기화 충돌 방지)
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
