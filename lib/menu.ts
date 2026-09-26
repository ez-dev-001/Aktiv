import type { Category, IconName } from './content'

/**
 * Направления в том виде, в каком их показывает меню шапки.
 *
 * Шапка — клиентский компонент, и всё, что ей передано, едет в браузер
 * вместе со страницей. Полная категория тащит описания, цены и фото
 * каждой практики; меню нужны только названия и адреса.
 */
export interface MenuCategory {
  slug: string
  title: string
  icon: IconName | string
  practices: { slug: string; title: string }[]
}

export const toMenu = (cats: Category[]): MenuCategory[] =>
  cats.map((c) => ({
    slug: c.slug,
    title: c.title,
    icon: c.icon,
    practices: (c.practices ?? []).map((p) => ({ slug: p.slug, title: p.title })),
  }))
