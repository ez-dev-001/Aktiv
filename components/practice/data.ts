import { groq } from 'next-sanity'
import { sanityFetch } from '@/lib/sanity/client'
import { BLOG_CATEGORIES, type Post } from '@/lib/sanity/content'

/**
 * Данные страниц направления и услуги, которых нет в общих загрузчиках.
 *
 * Запросы локальные, а не в lib/sanity/queries.ts: общий слой сейчас
 * правят параллельно, а этим страницам нужны две связки, которых там
 * нет, — «кто ведёт» (с фото) и «статьи по направлению».
 *
 * Без Sanity оба загрузчика отдают пустой список: в статике связки
 * человек ↔ практика нет, а угадывать её по подписи — значит выдумать.
 */

/** Человек, который ведёт практики: с фото и тем, к чему привязан. */
export interface PracticePerson {
  slug?: string
  name: string
  role: string
  photoUrl?: string
  /** slug'и практик, к которым привязан */
  practices: string[]
  /** slug'и их категорий (напрямів) */
  cats: string[]
}

/* Привязка живёт в двух местах схемы, и обе честные:
   teamMember.practices («за якими напрямами веде справи») и
   practice.lawyers («відповідальні адвокати»). Берём объединение.
   coalesce(…, []) — иначе null + массив в GROQ даёт null. */
const PEOPLE_QUERY = groq`
*[_type == "teamMember" && defined(name)] | order(order asc) {
  "slug": slug.current,
  "name": coalesce(name[$lang], name.ua),
  "role": coalesce(role[$lang], role.ua),
  "photoUrl": photo.asset->url,
  "practices": coalesce(practices[]->slug.current, []) + coalesce(*[_type == "practice" && references(^._id)].slug.current, []),
  "cats": coalesce(practices[]->category->slug.current, []) + coalesce(*[_type == "practice" && references(^._id)].category->slug.current, [])
}`

async function getPeople(lang: string): Promise<PracticePerson[]> {
  const rows = await sanityFetch<PracticePerson[]>(PEOPLE_QUERY, { lang }, ['teamMember', 'practice', 'practiceCategory'])
  return (rows ?? [])
    .filter((m) => m && typeof m.name === 'string' && m.name.trim())
    .map((m) => ({
      ...m,
      role: typeof m.role === 'string' ? m.role : '',
      practices: (m.practices ?? []).filter(Boolean),
      cats: (m.cats ?? []).filter(Boolean),
    }))
}

/** Кто ведёт напрям: привязан хотя бы к одной его практике. */
export async function getCategoryPeople(cat: string, lang = 'ua'): Promise<PracticePerson[]> {
  return (await getPeople(lang)).filter((m) => m.cats.includes(cat))
}

/** Кто ведёт конкретную послугу. */
export async function getPracticePeople(slug: string, lang = 'ua'): Promise<PracticePerson[]> {
  return (await getPeople(lang)).filter((m) => m.practices.includes(slug))
}

const LABEL: Record<string, string> = Object.fromEntries(BLOG_CATEGORIES.map((c) => [c.id, c.label]))
/** Рубрика поста приходит кодом (news, court…) — на карточке нужна подпись. */
export const postLabel = (c?: string) => (c ? (LABEL[c] ?? c) : undefined)

/* Статья «по темі» — та, у которой в «Повʼязані практики» стоит хоть
   одна практика этого направления (см. схему post.practices). */
const CATEGORY_POSTS_QUERY = groq`
*[_type == "post" && defined(slug.current) && $cat in practices[]->category->slug.current]
  | order(publishedAt desc) [0...$limit] {
  "slug": slug.current,
  "title": coalesce(title[$lang], title.ua),
  "excerpt": coalesce(excerpt[$lang], excerpt.ua),
  category, publishedAt,
  "cover": cover{ asset, crop, hotspot, alt, "lqip": asset->metadata.lqip },
  "author": author->name.ua
}`

export async function getCategoryPosts(cat: string, lang = 'ua', limit = 3): Promise<Post[]> {
  const rows = await sanityFetch<Post[]>(CATEGORY_POSTS_QUERY, { cat, lang, limit }, ['post', 'practice'])
  return (rows ?? [])
    .filter((p) => p?.slug && typeof p.title === 'string')
    .map((p) => ({ ...p, excerpt: typeof p.excerpt === 'string' ? p.excerpt : '', category: postLabel(p.category) }))
}
