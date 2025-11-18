const { NextFederationPlugin } = require('@module-federation/nextjs-mf')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
  ],
  webpack(config, options) {
    const { isServer } = options
    
    config.plugins.push(
      new NextFederationPlugin({
        name: 'mmq',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './MMQDemo': './pages/index.tsx',
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: false,
            eager: true,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: false,
            eager: true,
          },
          'next/navigation': {
            singleton: true,
            requiredVersion: false,
            eager: true,
          },
        },
        extraOptions: {
          automaticAsyncBoundary: true,
        },
      })
    )

    return config
  },
}

module.exports = nextConfig
