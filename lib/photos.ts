/**
 * ═══════════════════════════════════════════════════════════════════
 * ФОТОГРАФИИ — ВРЕМЕННЫЕ ЗАГЛУШКИ
 *
 * Все снимки ниже подтянуты с Unsplash и стоят здесь ТОЛЬКО чтобы
 * увидеть вёрстку с настоящими фотографиями: пропорции, тон, поведение
 * на телефоне. Ни один из них не показывает «АКТИВ».
 *
 * Как заменить на свои: поменять `id` в PHOTOS на свой файл — либо
 * загрузить фото в Sanity и передать URL. Больше нигде в проекте
 * адресов картинок нет, правка ровно в одном месте.
 *
 * Оптимизирует сам CDN Unsplash (`auto=format` отдаёт AVIF/WebP), а не
 * next/image: у оптимизатора Next на Netlify свои лимиты, а заглушкам
 * они не нужны. Когда фото переедут в Sanity — там ровно тот же приём
 * (`cdn.sanity.io` с параметрами), компонент Photo не изменится.
 *
 * TODO(client): фотосессия офиса и команды. До неё сайт нельзя
 * выпускать в продакшен с этими кадрами — они не наши.
 * ═══════════════════════════════════════════════════════════════════
 */

export interface Photo {
  /** id снимка на Unsplash — часть адреса после `photo-` */
  id: string
  /** alt: описывает, что на кадре. Заменить вместе с фотографией. */
  alt: string
  /** родные пропорции — чтобы не гадать с кадрированием */
  ratio: number
}

export const PHOTOS = {
  /* первый экран — низкий ракурс, много воздуха сверху под заголовок */
  hero: { id: '1667738693490-11d17265f0df', alt: 'Ділова забудова, вид знизу', ratio: 0.8 },

  /* переговорная — «про компанію», «нам довіряють» */
  boardroom: { id: '1571055931484-22dce9d6c510', alt: 'Порожня переговорна кімната', ratio: 1.5 },
  table: { id: '1595846265893-f433f6cca81d', alt: 'Дерев’яний стіл для переговорів', ratio: 1.5 },

  /* документы и работа — «шлях справи», кредо */
  documents: { id: '1450101499163-c8848c66ca85', alt: 'Робота з документами', ratio: 1.5 },
  desk: { id: '1635859890085-ec8cb5466806', alt: 'Стіл із документами у справі', ratio: 1.5 },
  meeting: { id: '1681505504714-4ded1bc247e7', alt: 'Зустріч із клієнтом за столом', ratio: 1.5 },

  /* люди в интерьере — команда */
  corridor: { id: '1606836379799-f88b03bc7039', alt: 'Коридор офісу', ratio: 1.5 },

  /* архитектура — разделители и карточки практик */
  tower: { id: '1623057508788-defc1f980a1d', alt: 'Скляний фасад бізнес-центру', ratio: 0.667 },
  facade: { id: '1708876389245-f7709ef8ac53', alt: 'Вікна офісної будівлі', ratio: 0.563 },
  columns: { id: '1712149409914-25d51d49c2e0', alt: 'Будівля з колонами', ratio: 0.667 },
  clock: { id: '1615383618336-90db590bd6d2', alt: 'Будівля суду з годинником', ratio: 0.667 },
  window: { id: '1598139384902-5a8217874645', alt: 'Вікно кабінету', ratio: 0.75 },
  city: { id: '1563195898-a4a01f51d5bd', alt: 'Міська забудова Києва', ratio: 0.75 },
} satisfies Record<string, Photo>

export type PhotoName = keyof typeof PHOTOS

/** Фото на карточку практики — по slug категории. */
export const CATEGORY_PHOTO: Record<string, PhotoName> = {
  'likvidatsiya-bankrutstvo': 'desk',
  'sudova-praktyka': 'clock',
  'biznes-nerukhomist-zemlya': 'facade',
  'vijskove-pravo': 'columns',
}

/** Ширины в srcset. Перекрывают всё от 320px до 2× на 1440. */
const WIDTHS = [480, 768, 1024, 1440, 1920, 2400]

export function photoUrl(photo: Photo, w: number): string {
  return `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&q=72&w=${w}`
}

export function photoSrcSet(photo: Photo): string {
  return WIDTHS.map((w) => `${photoUrl(photo, w)} ${w}w`).join(', ')
}

/** Крошечный кадр под размытие — грузится первым и держит место цветом. */
export function photoBlur(photo: Photo): string {
  return `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&q=40&w=24&blur=60`
}

/**
 * Кадр, готовый к показу: адреса уже посчитаны на сервере.
 *
 * Заглушки Unsplash и фото, загруженные в Sanity, приходят в Photo
 * одной и той же формой — компоненту всё равно, откуда кадр. Считать
 * адреса Sanity в браузере незачем: Photo — клиентский компонент, и
 * конструктор адресов уехал бы в бандл.
 */
export interface PhotoSource {
  src: string
  srcSet: string
  /** крошечный кадр под размытие или data:-URI от Sanity */
  blur?: string
  alt: string
  ratio: number
  /** object-position из точки фокуса, выставленной в студии */
  position?: string
}

export function unsplashSource(name: PhotoName): PhotoSource {
  const photo: Photo = PHOTOS[name]
  return { src: photoUrl(photo, 1440), srcSet: photoSrcSet(photo), blur: photoBlur(photo), alt: photo.alt, ratio: photo.ratio }
}

/** Имя заглушки или готовый кадр → готовый кадр. */
export const resolvePhoto = (p: PhotoName | PhotoSource): PhotoSource =>
  typeof p === 'string' ? unsplashSource(p) : p
