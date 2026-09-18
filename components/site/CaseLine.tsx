'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * ЛИНИЯ ДЕЛА — единственный сквозной приём сайта.
 *
 * Путь не задан заранее: он собирается из реальных offsetTop разделов,
 * поэтому станция стоит физически там, где начинается блок, а линия
 * гнётся только на смене раздела.
 *
 * Что делает её живой, а не просто дорисовывающейся полоской:
 *
 *  1. ДЕМПФИРОВАНИЕ. Голова не привязана к скроллу один в один, а
 *     догоняет цель с коэффициентом 0.12 за кадр. При рывке колесом
 *     линия подтягивается с инерцией — это главное отличие дорогой
 *     анимации от дешёвой, и стоит оно четырёх строк.
 *  2. ГРАДИЕНТ. Штрих не одноцветный: у головы полная насыщенность,
 *     дальше назад уходит в приглушённый тон. Линия читается как след,
 *     а не как заливка.
 *  3. КОМЕТА. Короткий яркий сегмент прямо за головой, вырезанный
 *     из того же пути окном dasharray. Он и создаёт ощущение, что
 *     линию проводят сейчас.
 *  3а. ОТКЛИК НА СКОРОСТЬ. Длина кометы зависит от того, насколько
 *     быстро читатель идёт по странице. Мера скорости берётся
 *     бесплатно: это тот же зазор (target - actual), который гасит
 *     демпфер. Рывок колесом вытягивает след почти втрое, медленное
 *     чтение оставляет короткую искру. Линия перестаёт быть одинаковой
 *     на любой скорости — а именно это и выдаёт скрипт.
 *
 *     Сама голова при этом НЕ меняется: её размер и свечение трогать
 *     нельзя. Точка — это «где мы сейчас», она обязана быть неподвижной
 *     мерой; всё движение отдано следу за ней.
 *  4. ПРИБЫТИЕ. Дойдя до станции, голова оставляет расходящееся
 *     кольцо — раздел отмечен как пройденный.
 *
 * Производительность: один rAF-цикл, который сам останавливается,
 * когда догнал цель. Замеры кэшируются, пересчёт только на resize,
 * ResizeObserver и после загрузки шрифтов. GSAP не нужен.
 */

interface Station {
  id: string
  label: string
}

const LANE_A = 16
const LANE_B = 44
/* Отступ станции от начала секции. 98 ставило точку ровно на строку
   надзаголовка (eyebrow), и подпись станции налезала на него.
   140 опускает её на строку заголовка, где слева свободное поле. */
const STATION_OFFSET = 140
/** коэффициент догона за кадр: меньше — тягучее, больше — резче */
const EASE = 0.12
/** длина яркого сегмента за головой в покое, px пути */
const COMET = 110
/** зазор демпфера, при котором отклик на скорость выходит на максимум */
const SPEED_FULL = 420

export function CaseLine({ stations }: { stations: Station[] }) {
  const railRef = useRef<HTMLElement | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const baseRef = useRef<SVGPathElement>(null)
  const fillRef = useRef<SVGPathElement>(null)
  const cometRef = useRef<SVGPathElement>(null)
  const headRef = useRef<SVGGElement>(null)
  const endRef = useRef<SVGGElement>(null)
  const gradRef = useRef<SVGLinearGradientElement>(null)
  const stopMidRef = useRef<SVGStopElement>(null)
  const stopHotRef = useRef<SVGStopElement>(null)
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  const geom = useRef({ railH: 0, railW: 0, pathLen: 0, mainTop: 0, ys: [] as number[] })
  const anim = useRef({ target: 0, actual: 0, running: false, primed: false })
  const activeRef = useRef<boolean[]>([])
  const [reduce, setReduce] = useState(false)

  /* ── замер: геометрия пути из DOM ── */
  const measure = useCallback(() => {
    const rail = railRef.current
    const svg = svgRef.current
    const base = baseRef.current
    const fill = fillRef.current
    const comet = cometRef.current
    if (!rail || !svg || !base || !fill || !comet) return

    const main = rail.parentElement
    if (!main) return

    const railW = rail.offsetWidth
    const railH = main.offsetHeight
    const mainTop = main.getBoundingClientRect().top + window.scrollY
    const wide = railW >= 20
    const laneA = wide ? LANE_A : 1.5
    const laneB = wide ? LANE_B : 1.5

    /* ── Порядок станций берётся из ДОКУМЕНТА, а не из массива ──
       Раньше путь строился прямо по порядку элементов в props.stations,
       и на «Команді» это дало линию, идущую назад: в массиве «Фахівці»
       стояли перед «Виконавцем», а в разметке блоки идут наоборот.
       Кривая честно шла 140 → 1133 → 737 → 1472, то есть спускалась,
       поднималась и снова спускалась.

       Массив задаёт, ЧТО подписать; где это находится, знает только
       DOM. Поэтому станции сортируются по измеренному y, и порядок в
       массиве больше не может сломать геометрию — ошибку, которую я
       только что и допустил, теперь физически негде сделать.

       Станция без своего блока на странице (опечатка в id, блок
       выключили) не тянет путь в ноль, как раньше: она выпадает и из
       кривой, и с экрана. */
    const found = stations
      .map((s, i) => {
        const el = document.getElementById(s.id)
        return el
          ? {
              i,
              y: Math.round(el.getBoundingClientRect().top + window.scrollY - mainTop + STATION_OFFSET),
            }
          : null
      })
      .filter((v): v is { i: number; y: number } => v !== null)
      .sort((a, b) => a.y - b.y)

    if (process.env.NODE_ENV !== 'production') {
      const missing = stations.filter((s) => !document.getElementById(s.id)).map((s) => s.id)
      if (missing.length) {
        console.warn(`[caseline] немає блоків з id: ${missing.join(', ')} — станції пропущено`)
      }
      const reordered = found.some((v, k) => v.i !== k)
      if (reordered) {
        console.warn(
          '[caseline] порядок станцій у масиві не відповідає порядку блоків на сторінці. ' +
            'Лінію побудовано за документом; варто виправити масив, щоб підписи читались у тому ж порядку.',
        )
      }
    }

    const pts: { x: number; y: number }[] = [{ x: laneA, y: 0 }]
    /* ys вырівняний по ИСХОДНОМУ массиву: по нему подсвечиваются точки,
       а btnRefs пронумерованы порядком JSX. Полоса же (lane) назначается
       по позиции В ОТСОРТИРОВАННОМ списке — чтобы линия чередовала
       стороны по ходу движения вниз, а не по порядку в массиве. */
    const ys: number[] = stations.map(() => Number.POSITIVE_INFINITY)

    found.forEach((v, k) => {
      const x = k % 2 === 0 ? laneB : laneA
      ys[v.i] = v.y
      pts.push({ x, y: v.y })
      const btn = btnRefs.current[v.i]
      if (btn) {
        /* Кнопка 22×22 сдвинута на половину себя трансформом, поэтому
           сюда идут координаты точки как есть — центр кнопки садится
           ровно на линию. Заодно вокруг точки 5px остаётся площадь
           нажатия, в которую трудно не попасть. */
        btn.style.top = `${v.y}px`
        btn.style.left = `${x}px`
        btn.style.removeProperty('display')
      }
    })

    /* Станции, которым не нашлось блока, убираем с экрана: точка без
       раздела ведёт в никуда. */
    stations.forEach((_, i) => {
      if (ys[i] === Number.POSITIVE_INFINITY) btnRefs.current[i]?.style.setProperty('display', 'none')
    })

    const last = pts[pts.length - 1]!
    pts.push({ x: last.x, y: railH })

    let d = `M${pts[0]!.x} ${pts[0]!.y}`
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1]!
      const p1 = pts[i]!
      const k = (p1.y - p0.y) * 0.42
      d += ` C${p0.x} ${p0.y + k} ${p1.x} ${p1.y - k} ${p1.x} ${p1.y}`
    }

    svg.setAttribute('width', String(railW))
    svg.setAttribute('height', String(railH))
    svg.setAttribute('viewBox', `0 0 ${railW} ${railH}`)
    base.setAttribute('d', d)
    fill.setAttribute('d', d)
    comet.setAttribute('d', d)
    gradRef.current?.setAttribute('y2', String(railH))
    endRef.current?.setAttribute('transform', `translate(${last.x},${railH - 6})`)

    const pathLen = fill.getTotalLength()
    fill.style.strokeDasharray = String(pathLen)
    geom.current = { railH, railW, pathLen, mainTop, ys }

    if (reduce) {
      fill.style.strokeDashoffset = '0'
      comet.style.opacity = '0'
      stopMidRef.current?.setAttribute('offset', '1')
      stopHotRef.current?.setAttribute('offset', '1')
      endRef.current?.setAttribute('opacity', '1')
      btnRefs.current.forEach((b) => b?.setAttribute('data-on', 'true'))
    }
  }, [stations, reduce])

  /* ── целевая точка: позиция чтения, чуть ниже середины экрана ── */
  const targetY = useCallback(() => {
    const { railH, mainTop } = geom.current
    return Math.max(0, Math.min(railH, window.scrollY + window.innerHeight * 0.56 - mainTop))
  }, [])

  /* ── отрисовка одного кадра по уже сглаженному значению ──
     speed: 0 — стоим, 1 — быстрый рывок. Считается из зазора демпфера,
     поэтому не требует ни отдельного слушателя, ни замера времени. */
  const render = useCallback((drawY: number, speed = 0) => {
    const { railH, pathLen, ys } = geom.current
    const fill = fillRef.current
    const comet = cometRef.current
    if (!fill || !comet || !pathLen || !railH) return

    const r = drawY / railH
    const p = pathLen * r

    fill.style.strokeDashoffset = String(pathLen - p)

    /* градиент: полная насыщенность у головы, дальше назад — приглушённо */
    stopMidRef.current?.setAttribute('offset', String(Math.max(0, r - 0.16)))
    stopHotRef.current?.setAttribute('offset', String(r))

    /* комета: окно [p-len, p], вырезанное из того же пути.
       Шаблон "0, зазор, штрих, остаток" — единственный способ показать
       произвольный отрезок пути без второго <path> с обрезкой.
       Длина тянется за скоростью: COMET в покое, до COMET × 3.2 на рывке. */
    const want = COMET * (1 + speed * 2.2)
    const len = Math.min(want, p)
    if (len > 4) {
      comet.style.strokeDasharray = `0 ${p - len} ${len} ${pathLen}`
      comet.style.opacity = String(Math.min(1, len / COMET))
    } else {
      comet.style.opacity = '0'
    }

    const pt = fill.getPointAtLength(p)
    headRef.current?.setAttribute('transform', `translate(${pt.x},${pt.y})`)
    headRef.current?.setAttribute('opacity', r > 0.004 && r < 0.995 ? '1' : '0')
    endRef.current?.setAttribute('opacity', r > 0.985 ? '1' : '0')

    for (let i = 0; i < ys.length; i++) {
      const on = drawY >= ys[i]!
      if (on !== activeRef.current[i]) {
        activeRef.current[i] = on
        btnRefs.current[i]?.setAttribute('data-on', on ? 'true' : 'false')
      }
    }
  }, [])

  /* ── цикл догона: сам останавливается, когда пришёл ── */
  const loop = useCallback(() => {
    const a = anim.current
    const d = a.target - a.actual
    if (Math.abs(d) < 0.4) {
      a.actual = a.target
      render(a.actual, 0)
      a.running = false
      return
    }
    /* Зазор демпфера и есть мера скорости. SPEED_FULL подобран так,
       чтобы обычная прокрутка колесом давала около половины шкалы,
       а бросок страницы — единицу. */
    const speed = Math.min(1, Math.abs(d) / SPEED_FULL)
    a.actual += d * EASE
    render(a.actual, speed)
    requestAnimationFrame(loop)
  }, [render])

  const tick = useCallback(() => {
    const a = anim.current
    a.target = targetY()
    if (!a.primed) {
      a.primed = true
      a.actual = a.target /* первый кадр без разгона от нуля */
    }
    if (!a.running) {
      a.running = true
      requestAnimationFrame(loop)
    }
  }, [loop, targetY])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    railRef.current = document.getElementById('caseline')
  }, [])

  useEffect(() => {
    measure()
    if (reduce) return

    tick()
    const onResize = () => {
      measure()
      anim.current.primed = false
      tick()
    }
    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', onResize)

    const main = railRef.current?.parentElement
    const ro = main && 'ResizeObserver' in window ? new ResizeObserver(onResize) : null
    if (main && ro) ro.observe(main)
    void document.fonts?.ready.then(onResize)

    return () => {
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', onResize)
      ro?.disconnect()
      anim.current.running = false
    }
  }, [measure, tick, reduce])

  const goTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <nav
      id="caseline"
      aria-label="Шлях справи: розділи сторінки"
      /* ── Где линия существует, а где нет ──
         Раньше ниже 1120px рельс сжимался в полоску 3px и прижимался
         к левому краю экрана. Станций там нет, полос нет, дуг нет —
         оставался обрубок у самой кромки, который читался как артефакт
         отрисовки, а не как приём. Вдобавок он дублировал верхнюю
         полосу прогресса: два индикатора одного и того же.

         Теперь порог опущен до 1000px, и ниже него линии нет совсем —
         там работает только полоса сверху. Опустить порог позволило то,
         что подписи станций стали всплывающими: рельсу больше не нужна
         ширина под вертикальный текст, хватает полос 16 и 44. */
      className="pointer-events-none absolute inset-y-0 z-[3] hidden left-[max(calc((100%-var(--shell))/2+var(--gut)),var(--gut))] w-[58px] min-[1000px]:block"
    >
      {/* Маска висит на SVG, а не на всём рельсе.
          Она нужна, чтобы линия не проступала сквозь прозрачную шапку
          над тёмным первым экраном. Но у mask-clip значение по
          умолчанию — border-box, то есть маска ОБРЕЗАЕТ всё, что вышло
          за коробку элемента. На рельсе шириной 58px это срезало
          подписи станций: «Практики» превращалось в «ПРАК». */}
      <svg ref={svgRef} aria-hidden="true" className="caseline-rail block overflow-visible">
        <defs>
          <linearGradient ref={gradRef} id="caselineGrad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000">
            {/* 0.32 на тёмной секции давало почти невидимый хвост, и
                пройденный путь обрывался вскоре за головой. 0.5 —
                минимум, при котором хвост читается на bg-ink. */}
            <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0.5" />
            <stop ref={stopMidRef} offset="0" stopColor="var(--color-accent)" stopOpacity="0.55" />
            <stop ref={stopHotRef} offset="0" stopColor="var(--color-accent)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* ── Непройденный путь ──
            Цвет не slate-2. Линия идёт сквозь всю страницу и пересекает
            и бумагу, и тёмные секции: на bg-ink трек в slate-2 сливался
            с фоном полностью. Видно было только яркий пройденный
            отрезок — и он висел в воздухе без трека, как обрывок.

            on-dark-2 (#8a83a0) лежит посередине между двумя фонами:
            на белом читается как светло-серая линия, на тёмном — как
            светлая. Один цвет на всю страницу вместо двух, которые
            пришлось бы переключать по секциям. */}
        <path ref={baseRef} fill="none" stroke="var(--color-on-dark-2)" strokeOpacity="0.45" strokeWidth={1.25} />

        {/* пройденный путь: градиент по ходу движения */}
        <path ref={fillRef} fill="none" stroke="url(#caselineGrad)" strokeWidth={1.5} strokeLinecap="round" />

        {/* комета — короткий яркий отрезок прямо за головой */}
        <path
          ref={cometRef}
          fill="none"
          stroke="var(--color-accent-soft)"
          strokeWidth={2.25}
          strokeLinecap="round"
          opacity="0"
          className="transition-opacity duration-300"
        />

        {/* Голова — одна плотная точка.
            Вокруг неё были ещё два круга: дышащий ореол r=13 и
            промежуточное кольцо r=6.5. Вместе с откликом на скорость
            они начинали спорить — ореол пульсировал по своему циклу,
            голова меняла размер по скорости, и в сумме это читалось
            как дрожь, а не как приём. След за головой (комета) даёт
            то же ощущение движения и делает это честнее. */}
        <g ref={headRef} opacity="0" className="transition-opacity duration-[450ms]">
          <circle r="3.75" fill="var(--color-accent)" />
        </g>

        {/* терминал: дело закрыто */}
        <g ref={endRef} opacity="0" className="transition-opacity duration-500">
          <circle r="4.5" fill="none" stroke="var(--color-accent)" strokeWidth={1.25} />
          <circle r="1.75" fill="var(--color-accent)" />
        </g>
      </svg>

      <div className="absolute inset-0">
        {stations.map((s, i) => (
          <button
            key={s.id}
            ref={(el) => {
              btnRefs.current[i] = el
            }}
            type="button"
            onClick={() => goTo(s.id)}
            data-on="false"
            aria-label={`Перейти до розділу: ${s.label}`}
            className="caseline-station group pointer-events-auto absolute hidden size-[22px] -translate-x-[11px] -translate-y-[11px] items-center justify-center border-0 bg-transparent p-0 focus-visible:outline-offset-[6px] min-[1000px]:flex"
          >
            {/* Точка — единственное, что видно всегда. Активная растёт
                и краснеет; этого достаточно, чтобы понять, где ты. */}
            <span className="caseline-dot size-[5px] rounded-full bg-slate-2 opacity-55 transition-[background-color,width,height,opacity] duration-[340ms] ease-[cubic-bezier(.34,1.56,.64,1)] group-data-[on=true]:size-[9px] group-data-[on=true]:bg-accent group-data-[on=true]:opacity-100" />

            {/* ── Подпись ──
                Две предыдущие попытки провалились по одной причине:
                я пытался уместить название ВНУТРИ рельса. Рельс — 58px,
                а «Консультація» занимает под сотню. Горизонтальную резала
                маска, вертикальную («писать сверху вниз») пришлось жать
                до 9.5px, и девять вертикальных строк вдоль поля читались
                как шум, а не как навигация.

                Решение — перестать её туда впихивать. Подпись всплывает
                вправо от точки только на наведении и фокусе: одна за раз,
                горизонтальная, нормального кегля, с подложкой и тенью.
                Ей больше не нужно ни во что помещаться — она лежит
                поверх страницы и через полсекунды исчезает. Ничего не
                обрезается и ни с чем не сталкивается по определению. */}
            <span
              className="pointer-events-none absolute left-full ml-3 origin-left -translate-x-1 scale-95 whitespace-nowrap rounded-[3px] border border-hair bg-white/95 px-2.5 py-1 font-mono text-[10.5px] uppercase leading-none tracking-[0.12em] text-ink opacity-0 shadow-[0_6px_20px_-8px_rgb(17_17_20/0.35)] backdrop-blur-[2px] transition-[opacity,transform] duration-[260ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:scale-100 group-focus-visible:opacity-100"
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}

/** Прогресс-полоса: то же состояние, что у линии, но для мобильного. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const paint = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const r = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (ref.current) ref.current.style.transform = `scaleX(${r})`
    }
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', tick)
    return () => {
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', tick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[80] h-0.5 origin-left scale-x-0 bg-accent will-change-transform min-[1000px]:hidden"
    />
  )
}
