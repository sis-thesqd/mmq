/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    '@dnd-kit/utilities',
  ],
}

module.exports = nextConfig

