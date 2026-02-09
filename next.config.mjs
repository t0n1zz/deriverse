/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Suppress pino-pretty warning (optional dependency used by some wallet packages)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
    };
    return config;
  },
};

export default nextConfig;
