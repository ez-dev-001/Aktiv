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
  /* Кадры-заглушки на Netlify идут через его Image CDN на своём домене
     (почему — lib/photos.ts). NETLIFY=true Netlify задаёт на сборке сам;
     локально переменной нет, и ссылки остаются прямыми. NEXT_PUBLIC_ —
     потому что адреса считает и клиентский компонент Photo. */
  env: { NEXT_PUBLIC_IMAGE_PROXY: process.env.NETLIFY === 'true' ? 'netlify' : '' },
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
