import type { MetadataRoute } from 'next'
import { DEFAULT_LOCALE, HREFLANG, type Locale } from '@/lib/i18n'
import { INDEXED_LOCALES } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'
import { getSitemapData } from '@/lib/sanity/content'

/**
 * Карта сайта: /sitemap.xml.
 *
 * ── Что в неё входит ──
 * Главная, «Про компанію», «Команда», блог, четыре направления, все
 * практики и все опубликованные статьи — на украинском и английском.
 * Источник тот же, что у меню: Sanity, а без него статика.
 *
 * ── Чего в ней нет, и это намеренно ──
 * /sanity-check и /api — служебное. Русских адресов — их больше нет,
 * они отдают 301, а адрес с редиректом в карте Search Console помечает
 * как ошибку.
 *
 * ── hreflang внутри карты ──
 * У каждого адреса перечислены его языковые версии, включая его самого.
 * То же самое уже стоит в <head> каждой страницы, но Google советует
 * дублировать в карте: страницы он перечитывает раз в недели, а карту —
 * часто, и связь между языками он узнаёт быстрее.
 *
 * priority и changefreq не указаны: Google их игнорирует уже много лет,
 * а лишние поля только делают файл тяжелее.
 *
 * Пересобирается раз в час: новая статья попадает в карту без деплоя.
 */
export const revalidate = 3600

/** Путь для языка: основной без префикса, остальные — с ним. */
const withLang = (lang: Locale, path: string) =>
  lang === DEFAULT_LOCALE ? path || '/' : `/${lang}${path}`

/* Лише мови з перекладом (INDEXED_LOCALES у lib/seo.ts). Поки там
   тільки українська, англійських адрес у карті немає: вони показують
   український текст і закриті noindex. hreflang — лише коли мов кілька. */
function entry(path: string, lastModified?: string): MetadataRoute.Sitemap {
  const languages =
    INDEXED_LOCALES.length > 1
      ? Object.fromEntries([
          ...INDEXED_LOCALES.map((l) => [HREFLANG[l], SITE_URL + withLang(l, path)]),
          ['x-default', SITE_URL + withLang(DEFAULT_LOCALE, path)],
        ])
      : undefined
  return INDEXED_LOCALES.map((lang: Locale) => ({
    url: SITE_URL + withLang(lang, path),
    ...(lastModified ? { lastModified } : {}),
    ...(languages ? { alternates: { languages } } : {}),
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const d = await getSitemapData()

  return [
    ...entry('', d.home),
    ...entry('/about', d.about),
    ...entry('/team', d.team),
    ...entry('/privacy'),
    ...entry('/career', d.career),
    ...entry('/blog'),
    ...entry('/practices'),
    ...d.categories.flatMap((c) => entry(`/practices/${c.slug}`, c.updatedAt)),
    ...d.practices.flatMap((p) => entry(`/practices/${p.category}/${p.slug}`, p.updatedAt)),
    ...d.posts.flatMap((p) => entry(`/blog/${p.slug}`, p.updatedAt)),
  ]
}
