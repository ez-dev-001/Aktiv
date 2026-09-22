import { createImageUrlBuilder } from '@sanity/image-url'
import { CATEGORY_PHOTO, type PhotoName, type PhotoSource } from '@/lib/photos'
import { dataset, projectId } from './client'

/**
 * Картинки из Sanity: адреса с нужным размером и кадрированием.
 *
 * ── Почему через конструктор, а не asset->url ──
 * asset->url отдаёт оригинал: фото с телефона в 4000 пикселей и 6 МБ
 * на карточку шириной 380. Конструктор просит у CDN Sanity ровно тот
 * размер, который нужен, в современном формате (auto=format даёт WebP
 * или AVIF тем браузерам, что их понимают).
 *
 * Главное же — он учитывает кадрирование и точку фокуса, которые
 * редактор выставляет в студии: у поля «Обкладинка» включён hotspot.
 * Обложка одна, а форматов три — карточка 3:2, шапка статьи 16:9,
 * превью в соцсетях 1.91:1. Без hotspot каждый формат режется по
 * центру, и на широком кадре голова человека уезжает за верхний край.
 * С ним CDN режет так, чтобы отмеченная точка осталась в кадре.
 *
 * Помощник для фото команды (teamPhoto) устроен проще и режет по
 * центру: там квадрат из портрета, и центр почти всегда верен.
 */

export interface SanityImage {
  asset?: { _ref?: string; _id?: string }
  crop?: { top: number; bottom: number; left: number; right: number }
  hotspot?: { x: number; y: number; height: number; width: number }
  alt?: string
  /** Размытое превью в 20 пикселей, base64. Sanity считает его сам при загрузке. */
  lqip?: string
  /** ширина / высота оригинала */
  ratio?: number
}

const builder = projectId ? createImageUrlBuilder({ projectId, dataset }) : null

/** Есть ли у картинки файл. Поле могли создать и оставить пустым. */
export const hasImage = (img?: SanityImage | null): img is SanityImage =>
  Boolean(builder && (img?.asset?._ref || img?.asset?._id))

/** Адрес картинки заданного размера с учётом кадра и точки фокуса. */
export function imageUrl(img: SanityImage, width: number, height?: number): string {
  let b = builder!.image(img).width(Math.round(width)).auto('format').quality(78)
  if (height) b = b.height(Math.round(height)).fit('crop')
  return b.url()
}

/**
 * srcset для заданного соотношения сторон: браузер сам выберет
 * ширину по экрану и плотности пикселей. Ширины кратные — CDN Sanity
 * кеширует каждый вариант, и одинаковые запросы с разных страниц
 * попадают в кеш.
 */
export function imageSrcSet(img: SanityImage, widths: number[], ratio: number): string {
  return widths.map((w) => `${imageUrl(img, w, w / ratio)} ${w}w`).join(', ')
}

const PHOTO_WIDTHS = [480, 768, 1024, 1440, 1920, 2400]

/**
 * Фото из Sanity в форме, которую понимает компонент Photo.
 *
 * Адреса без высоты: кадр растягивается по блоку через object-cover,
 * а блоки разные — узкая карточка 2.1:1 и первый экран страницы во
 * всю ширину. Вместо того чтобы резать на CDN под каждый, точка
 * фокуса из студии превращается в object-position: браузер режет
 * кадр так, чтобы отмеченное место осталось видно при любой ширине.
 *
 * Кадрирование (crop) CDN применяет сам, поэтому точка фокуса
 * пересчитывается в координаты уже обрезанного кадра.
 */
export function sanityPhotoSource(img: SanityImage, fallbackAlt: string): PhotoSource {
  const url = (w: number) => builder!.image(img).width(w).auto('format').quality(74).url()
  const c = img.crop
  const cw = c ? 1 - c.left - c.right : 1
  const ch = c ? 1 - c.top - c.bottom : 1
  const clamp = (v: number) => Math.min(100, Math.max(0, Math.round(v * 1000) / 10))
  const position = img.hotspot
    ? `${clamp((img.hotspot.x - (c?.left ?? 0)) / cw)}% ${clamp((img.hotspot.y - (c?.top ?? 0)) / ch)}%`
    : undefined
  return {
    src: url(1440),
    srcSet: PHOTO_WIDTHS.map((w) => `${url(w)} ${w}w`).join(', '),
    blur: img.lqip,
    alt: img.alt?.trim() || fallbackAlt,
    ratio: img.ratio ? img.ratio * (cw / ch) : 1.5,
    position,
  }
}

/**
 * Фото категории: загруженное в Sanity → заглушка по slug → ничего.
 * Новая категория без фото получает на карточке тёмную плашку с
 * иконкой, а на своей странице — шапку без кадра.
 */
export function categoryPhoto(cat: {
  slug: string
  title: string
  photo?: SanityImage | null
}): PhotoSource | PhotoName | undefined {
  if (hasImage(cat.photo)) return sanityPhotoSource(cat.photo, cat.title)
  return CATEGORY_PHOTO[cat.slug]
}
