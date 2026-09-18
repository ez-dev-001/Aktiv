'use client'

import { useEffect, useRef, useState } from 'react'
import { PHOTOS, photoBlur, photoSrcSet, photoUrl, type PhotoName } from '@/lib/photos'

/**
 * Фотография.
 *
 * Три вещи, ради которых это отдельный компонент, а не голый <img>:
 *
 * 1. Место под кадр занято ДО загрузки — aspect-ratio на обёртке.
 *    Иначе при подгрузке каждая фотография дёргает вёрстку вниз,
 *    и на телефоне это самый заметный дефект страницы.
 *
 * 2. Пока кадр летит, на его месте стоит он же в 24px с размытием.
 *    Страница не мигает белыми прямоугольниками: сразу видны тон и
 *    композиция, дальше проявляется резкость.
 *
 * 3. Проявление — не «fade-up при скролле». Кадр приходит в момент,
 *    когда он ЗАГРУЗИЛСЯ, и только один раз: масштаб 1.045 → 1 плюс
 *    непрозрачность. Это читается как проявка, а не как пресет.
 *
 * Оптимизирует CDN Unsplash через srcset, а не next/image — почему,
 * написано в lib/photos.ts.
 */

type Tone = 'none' | 'ink' | 'deep' | 'wash'

/* Затемнение: градиент, а не сплошная заливка — текст лежит внизу
   кадра, и верх изображения незачем гасить целиком. */
const TONES: Record<Tone, string> = {
  none: '',
  wash: 'after:absolute after:inset-0 after:bg-ink/15',
  ink: 'after:absolute after:inset-0 after:bg-[linear-gradient(180deg,rgb(20_11_51/0.30)_0%,rgb(20_11_51/0.52)_52%,rgb(20_11_51/0.86)_100%)]',
  deep: 'after:absolute after:inset-0 after:bg-[linear-gradient(175deg,rgb(20_11_51/0.62)_0%,rgb(20_11_51/0.78)_45%,rgb(20_11_51/0.94)_100%)]',
}

export function Photo({
  name,
  ratio,
  fill = false,
  sizes = '100vw',
  tone = 'none',
  priority = false,
  className = '',
  imgClassName = '',
  children,
}: {
  name: PhotoName
  /** переопределить кадрирование: 1.5 — альбом, 0.75 — портрет */
  ratio?: number
  /** растянуть по родителю вместо собственных пропорций */
  fill?: boolean
  sizes?: string
  tone?: Tone
  priority?: boolean
  className?: string
  imgClassName?: string
  children?: React.ReactNode
}) {
  const photo = PHOTOS[name]
  const img = useRef<HTMLImageElement>(null)
  const [ready, setReady] = useState(false)

  /* Кадр из кэша успевает загрузиться до гидратации — onLoad тогда
     не сработает вовсе, и фотография навсегда останется прозрачной.
     Поэтому состояние сверяется с img.complete при монтировании. */
  useEffect(() => {
    if (img.current?.complete) setReady(true)
  }, [])

  return (
    <div
      className={`isolate overflow-hidden bg-ink-2 ${
        fill ? 'absolute inset-0' : 'relative'
      } ${TONES[tone]} after:pointer-events-none after:z-[1] ${className}`}
      style={fill ? undefined : { aspectRatio: String(ratio ?? photo.ratio) }}
    >
      {/* подложка: тот же кадр в 24px, растянутый и размытый */}
      <span
        aria-hidden="true"
        className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
        style={{ backgroundImage: `url(${photoBlur(photo)})` }}
      />
      <img
        ref={img}
        src={photoUrl(photo, 1440)}
        srcSet={photoSrcSet(photo)}
        sizes={sizes}
        alt={photo.alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        /* React 19 знает это свойство в camelCase и сам пишет в DOM
           атрибут fetchpriority. Строчное написание здесь заставляло
           React ругаться в консоли на каждый кадр — и именно оно висело
           значком «1 issue» в дев-оверлее. */
        fetchPriority={priority ? 'high' : undefined}
        onLoad={() => setReady(true)}
        data-ready={ready ? 'true' : 'false'}
        className={`photo-img absolute inset-0 size-full object-cover ${imgClassName}`}
      />
      {children && <div className="relative z-[2] size-full">{children}</div>}
    </div>
  )
}

/**
 * Фотография-разделитель во всю ширину.
 *
 * Высота задаётся снаружи, кадр растягивается по ней: полосу нельзя
 * ставить на пропорции снимка — на широком экране она стала бы
 * трёхметровой, а на телефоне схлопнулась бы в щель.
 */
export function PhotoBand({
  name,
  tone = 'ink',
  minHeight = 'clamp(280px,44vw,480px)',
  className = '',
  children,
}: {
  name: PhotoName
  tone?: Tone
  minHeight?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`relative isolate flex overflow-hidden ${className}`} style={{ minHeight }}>
      <Photo name={name} tone={tone} sizes="100vw" fill />
      {children && <div className="relative z-[2] flex w-full">{children}</div>}
    </div>
  )
}
