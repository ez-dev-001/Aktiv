/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // в монорепо-подобном окружении Next иначе угадывает корень по чужому lockfile
  turbopack: { root: import.meta.dirname },
  poweredByHeader: false,
  images: {
    // Sanity CDN — единственный внешний источник картинок.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}
export default nextConfig
