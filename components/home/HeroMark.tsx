'use client'

import { useEffect, useRef } from 'react'
import { PHOTOS, photoUrl } from '@/lib/photos'

/**
 * Знак «АКТИВ» на першому екрані — велике розімкнене кільце з кадром
 * усередині і стріла, що пробиває його наскрізь.
 *
 * ── Чому не відео ──
 * Сцену придумано й зведено в Remotion (папка hero-video/, там її видно
 * по кадрах). Спершу на сайті стояв відрендерений ролик, але відео при
 * завантаженні поводилося нерівно: порожнє місце, поки файл вантажиться;
 * пауза до гідратації; помилки декодування VP9 у Chrome на Windows;
 * енергозбереження, що зупиняє автозапуск. Тепер та сама сцена з тими
 * самими таймінгами (кадри 30 fps → секунди) — розмітка з CSS-анімаціями:
 *   • стартує з першою ж відмальовкою сторінки, до будь-якого JS;
 *   • векторна — чітка на будь-якому екрані, без файлу на 0,5 МБ;
 *   • не залежить від кодеків і режимів енергозбереження.
 *
 * ── Чому так, а не інакше (плавність) ──
 * Анімуються лише transform, opacity, clip-path і stroke-dashoffset.
 * Жодного SVG-фільтра на тому, що рухається: розмиття перераховується
 * на кожному кадрі й дає ривки на слабких телефонах. Світіння зроблене
 * градієнтами, а розмита копія стріли проявляється вже нерухомою.
 * Кадр у кільці — звичайний <img> під SVG: «ірис» — CSS clip-path,
 * дуотон — grayscale + два шари змішування. Усе це браузер віддає
 * відеокарті.
 *
 * ── Як влаштовано ──
 * Базові стилі кожного елемента — ОСТАННІЙ кадр. Анімації лише
 * описують, звідки елемент приходить (`animation-fill-mode: both`).
 * Тому при «зменшеному русі» досить вимкнути анімації — лишається
 * готовий знак (globals.css, блок HeroMark).
 *
 * Таймлайн (с): кільце 0.1–1.6 з «кометою» на кінчику · кадр 0.53–2.1
 * ірисом з наближенням · стріла 1.93–2.8 зі шлейфом · удар 2.47: спалах
 * у розриві й хвиля · відблиск по кільцю 2.87–4.1 · далі статично.
 *
 * Геометрія — як у components/site/Logo.tsx: кільце R=72 з центром
 * (87.5, 90.5), розімкнене на ±20° праворуч; стріла від 15 до 237.
 * Полотно — viewBox «-26.5 -19.5 300 220» (як у Remotion), відсотки
 * нижче пораховані від нього.
 */

const CX = 87.5
const CY = 90.5
const RING = 'M155.2 115.1 A 72 72 0 1 1 155.2 65.9'
const ARROW = 'M15 84.5 H187 L180.5 66 L237 88.5 L180.5 111 L187 92.5 H15 Z'
/* Хвіст «комети»: дуга 26° перед точкою 0°. Числа округлені, щоб
   сервер і браузер дали той самий рядок. */
const TAIL = 'M152.21 58.94 A 72 72 0 0 1 159.5 90.5'
const DOTS = [
  [175.5, 90.5],
  [87.5, 178.5],
  [-0.5, 90.5],
  [87.5, 2.5],
] as const

/** still — знак без анімації і паралаксу, одразу в останньому кадрі.
    Так на внутрішніх сторінках: анімація «збирання» лого — лише на
    головній, далі знак уже «завантажений» і просто стоїть. */
export function HeroMark({ still = false }: { still?: boolean }) {
  const root = useRef<HTMLDivElement>(null)

  /* Легкий паралакс при прокрутці. Анімації входу від JS не залежать. */
  useEffect(() => {
    const el = root.current
    if (still || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const paint = () => {
      raf = 0
      const y = Math.min(window.scrollY, window.innerHeight)
      el.style.setProperty('--hm', String(y / window.innerHeight))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [still])

  return (
    <div ref={root} className={`relative -mx-[10%] -my-[7.4%] w-[120%] ${still ? 'hm-still' : ''}`} aria-hidden="true">
      <div className="hero-mark-media hm relative aspect-[300/220] w-full">
        {/* Світіння за знаком — коло радіуса 128 з центром (105.5, 90.5). */}
        <span className="hm-glow absolute left-[1.33%] top-[-8.18%] h-[116.36%] w-[85.33%] rounded-full" />

        <div className="hm-pulse absolute inset-0">
          {/* ── кадр у кільці: коло R=61 з центром (87.5, 90.5) ── */}
          <div className="hm-photo absolute left-[17.67%] top-[22.27%] h-[55.45%] w-[40.67%] overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hm-photo-img absolute inset-0 size-full object-cover object-[50%_40%]"
              src={photoUrl(PHOTOS.tower, 900)}
              alt=""
              fetchPriority="high"
              decoding="async"
            />
            {/* дуотон: множення на блідо-рожевий + «не темніше за фон» */}
            <span className="absolute inset-0 bg-[#e6b3d6] mix-blend-multiply" />
            <span className="absolute inset-0 bg-[#140b33] mix-blend-lighten" />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(20_11_51/0)_35%,rgb(20_11_51/0.55))]" />
            <span className="hm-refl absolute inset-0 bg-[radial-gradient(circle_at_92%_50%,rgb(250_33_99/0.55),rgb(250_33_99/0)_60%)]" />
            <span className="hm-dim absolute inset-0 bg-[#140b33]" />
          </div>

          <svg viewBox="-26.5 -19.5 300 220" className="absolute inset-0 size-full overflow-visible">
            <defs>
              <radialGradient id="hm-dotglow">
                <stop offset="0" stopColor="#fa2163" stopOpacity="0.9" />
                <stop offset="1" stopColor="#fa2163" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="hm-whiteglow">
                <stop offset="0" stopColor="#fff" stopOpacity="1" />
                <stop offset="0.45" stopColor="#ffe3ec" stopOpacity="0.8" />
                <stop offset="1" stopColor="#ffe3ec" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="hm-streak" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#fa2163" stopOpacity="0" />
                <stop offset="1" stopColor="#ff7aa3" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="hm-tail" gradientUnits="userSpaceOnUse" x1="152.21" y1="58.94" x2="159.5" y2="90.5">
                <stop offset="0" stopColor="#ff8fb1" stopOpacity="0" />
                <stop offset="1" stopColor="#ffd1df" stopOpacity="0.95" />
              </linearGradient>
              <filter id="hm-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.2" />
              </filter>
              {/* Стріла вилітає «з-за» кільця: усе лівіше x=6 сховано. */}
              <clipPath id="hm-arrow-clip">
                <rect x="6" y="40" width="300" height="100" />
              </clipPath>
            </defs>

            {/* хвиля від удару */}
            <circle className="hm-ripple" cx={CX} cy={CY} r="72" fill="none" stroke="#fa2163" strokeWidth="4" />

            {/* тонка орбіта з чотирма точками */}
            <circle
              className="hm-orbit"
              cx={CX}
              cy={CY}
              r="88"
              fill="none"
              stroke="#fff"
              strokeOpacity="0.09"
              strokeWidth="0.45"
              pathLength={1}
              transform={`rotate(200 ${CX} ${CY})`}
            />
            {DOTS.map(([x, y], i) => (
              <circle key={i} className={`hm-dot hm-dot-${i}`} cx={x} cy={y} r="0.9" fill="#fff" />
            ))}
            <circle className="hm-inner" cx={CX} cy={CY} r="61.5" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="0.5" />

            {/* кільце: світіння двома широкими штрихами (без фільтра) + саме кільце */}
            <path className="hm-ring" d={RING} fill="none" stroke="#fa2163" strokeWidth="21" strokeOpacity="0.1" pathLength={1} />
            <path className="hm-ring" d={RING} fill="none" stroke="#fa2163" strokeWidth="15" strokeOpacity="0.2" pathLength={1} />
            <path className="hm-ring" d={RING} fill="none" stroke="#fa2163" strokeWidth="11" pathLength={1} />
            <path className="hm-sheen" d={RING} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" pathLength={1} />

            {/* комета на кінчику кільця */}
            <g className="hm-comet">
              <path d={TAIL} fill="none" stroke="url(#hm-tail)" strokeWidth="5" strokeLinecap="round" />
              <circle cx="159.5" cy={CY} r="13" fill="url(#hm-dotglow)" />
              <circle cx="159.5" cy={CY} r="6" fill="url(#hm-whiteglow)" />
            </g>

            {/* розмите світіння стріли — проявляється вже нерухомим, під стрілою */}
            <path className="hm-arrow-glow" d={ARROW} fill="#fa2163" filter="url(#hm-soft)" />

            {/* стріла */}
            <g clipPath="url(#hm-arrow-clip)">
              <g className="hm-arrow">
                <rect className="hm-streak" x="-105" y="85.5" width="292" height="6" fill="url(#hm-streak)" />
                <path d={ARROW} fill="#fa2163" />
              </g>
            </g>

            {/* спалах у розриві кільця */}
            <g className="hm-flash">
              <circle cx="158" cy={CY} r="30" fill="url(#hm-dotglow)" />
              <circle cx="158" cy={CY} r="14" fill="url(#hm-whiteglow)" />
              <rect x="112" y={CY - 1} width="92" height="2" rx="1" fill="#fff" opacity="0.85" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
