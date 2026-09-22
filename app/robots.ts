import type { MetadataRoute } from 'next'
import { SITE_URL, isIndexable } from '@/lib/site'

/**
 * robots.txt.
 *
 * До этого файла /robots.txt отдавал 404. Для поисковика это не
 * катастрофа — отсутствие файла он читает как «можно всё», — но тогда
 * некуда было записать адрес карты сайта и нечем закрыть служебные
 * адреса.
 *
 * ── Тестовые адреса закрываются сами ──
 * На *.netlify.app и в предпросмотрах веток индексация запрещена
 * полностью, на боевом домене — открыта. Решает isIndexable() по
 * переменным сборки Netlify; почему это важнее, чем кажется, — там же,
 * в lib/site.ts. Руками ничего переключать не нужно ни до запуска, ни
 * после: привязали домен — robots.txt открылся.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        /* Служебное: CRM, страница после заявки, диагностика Sanity,
           вебхук ревалидации, студия.
           Страница диагностики и так помечена noindex, но robots.txt
           не даёт роботу тратить на неё обход. */
        disallow: ['/api/', '/admin', '/dyakuyemo', '/en/dyakuyemo', '/sanity-check', '/studio'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    /* Директивы host нет намеренно: её читал только Яндекс, а он в
       Украине заблокирован с 2017 года. */
  }
}
