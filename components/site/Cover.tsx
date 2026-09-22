import { hasImage, imageSrcSet, imageUrl, type SanityImage } from '@/lib/sanity/image'

/**
 * Обложка статьи.
 *
 * Серверный компонент, без единой строки JS в браузере:
 *
 *  • место под картинку зарезервировано через aspect-ratio — страница
 *    не прыгает, когда фото догружается (CLS остаётся нулевым);
 *  • под картинкой лежит размытое превью в 20 пикселей (lqip), которое
 *    Sanity считает сам при загрузке файла. Пока грузится фото, человек
 *    видит его цветовое пятно, а не серый прямоугольник;
 *  • srcset отдаёт браузеру несколько ширин, и телефон не качает
 *    картинку, рассчитанную на монитор.
 *
 * alt — из поля «Alt» в студии. Если его не заполнили, подставляется
 * заголовок статьи: пустой alt у содержательной картинки — это минус и
 * для доступности, и для поиска по картинкам.
 */
export function Cover({
  image,
  alt,
  ratio,
  widths,
  sizes,
  priority = false,
  className = '',
}: {
  image?: SanityImage | null
  alt: string
  /** ширина / высота */
  ratio: number
  widths: number[]
  sizes: string
  /** Для обложки в шапке статьи: она на первом экране, её нельзя грузить лениво. */
  priority?: boolean
  className?: string
}) {
  if (!hasImage(image)) return null
  const mid = widths[Math.floor(widths.length / 2)] ?? widths[0] ?? 800

  return (
    <div
      className={`relative overflow-hidden bg-paper-2 bg-cover bg-center ${className}`}
      style={{ aspectRatio: String(ratio), backgroundImage: image.lqip ? `url(${image.lqip})` : undefined }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl(image, mid, mid / ratio)}
        srcSet={imageSrcSet(image, widths, ratio)}
        sizes={sizes}
        alt={image.alt?.trim() || alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  )
}
