/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // в монорепо-подобном окружении Next иначе угадывает корень по чужому lockfile
  turbopack: { root: import.meta.dirname },
  poweredByHeader: false,
  /* Резюме на странице «Карʼєра» уходит файлом через server action.
     По умолчанию Next принимает до 1 МБ — резюме с фото не пролезло бы.
     Сам файл ограничен 4 МБ в app/actions/lead.ts; запас — на поля формы
     и кодировку. Больше 6 МБ Netlify не пропустит в функцию всё равно. */
  experimental: { serverActions: { bodySizeLimit: '5mb' } },
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
