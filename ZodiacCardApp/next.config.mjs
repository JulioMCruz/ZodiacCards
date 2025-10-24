/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  generateBuildId: async () => {
    // Generate a unique build ID
    return `build-${Date.now()}`
  },
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')

    // Fix MetaMask SDK missing React Native dependency
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
    }

    // Ignore dynamic require warnings from web-worker
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/web-worker/ },
    ]

    return config
  },
}

export default nextConfig
