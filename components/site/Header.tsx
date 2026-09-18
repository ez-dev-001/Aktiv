'use client'

import { useEffect, useRef, useState } from 'react'
import { categories, contacts as staticContacts } from '@/lib/content'
import type { Contacts } from '@/lib/sanity/content'
import { trackPhone } from '@/lib/analytics'
import { Icon } from './Icon'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from './Logo'

/**
 * Навигация в два слоя.
 *
 * Слой 1 — липкая шапка с мега-меню: все 36 направлений в одном клике
 * от главной. На старом сайте практик в меню не было вообще, и 17 страниц
 * не были залинкованы ниоткуда, кроме карты сайта.
 *
 * Слой 2 — линия дела (CaseLine), навигация по разделам страницы.
 *
 * ── Шапка поверх фотографии ──
 * На страницах с тёмным первым экраном шапка в верхнем положении
 * прозрачная и белая: полоска бумаги поперёк фотографии срезала бы
 * кадр ровно там, где он начинается. Как только страница тронулась —
 * шапка наливается бумагой. Тот же режим включается при открытом меню,
 * иначе светлая полоса висела бы поверх тёмной панели.
 *
 * ── Панель меню ──
 * Раскрывается маской clip-path сверху вниз, а не выезжает блоком:
 * это тот же приём, что у заголовков (.mask), и меню читается как
 * часть сайта, а не как чужой компонент. Пункты приходят ступенями —
 * задержка живёт в CSS через --i, разметка о таймингах не знает.
 *
 * Мега-меню полностью снято с раскладки ниже 980px (display:none, а не
 * visibility:hidden): скрытый элемент visibility всё равно попадает
 * в scrollWidth и давал 188px горизонтального оверфлоу на телефоне.
 */

/* Якорные ссылки работают только на главной, поэтому разделы,
   у которых есть своя страница, ведут на страницу. */
const NAV = [
  { href: '/#prices', label: 'Вартість' },
  { href: '/about', label: 'Про компанію' },
  { href: '/team', label: 'Команда' },
  { href: '/blog', label: 'Блог' },
  { href: '/#contact', label: 'Контакти' },
]

const LANGS = [
  { id: 'ua', label: 'UA', href: '/' },
  { id: 'en', label: 'EN', href: '/en' },
  { id: 'ru', label: 'RU', href: '/ru' },
]

export function Header({
  lang = 'ua',
  overDark = false,
  contacts = staticContacts,
}: {
  lang?: string
  overDark?: boolean
  /** из Sanity, если siteSettings заполнен; иначе статика */
  contacts?: Contacts
}) {
  const [mega, setMega] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [acc, setAcc] = useState<string | null>(null)
  const [stuck, setStuck] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)

  /* Белое на прозрачном: поверх фотографии или поверх открытой панели.
     При открытом мега-меню — нет: панель меню светлая, и прозрачная
     шапка над ней выглядела бы как оторванная от неё полоса. */
  const light = drawer || (overDark && !stuck && !mega)

  useEffect(() => {
    let raf = 0
    const paint = () => {
      raf = 0
      setStuck(window.scrollY > 12)
    }
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', tick, { passive: true })
    return () => {
      window.removeEventListener('scroll', tick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  /* Escape закрывает и мега-меню, и панель. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMega(false)
        setDrawer(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* Открытая панель забирает фокус и не отпускает его наружу: иначе
     таб уходит на ссылки под панелью, которые с клавиатуры не видно.
     На закрытии фокус возвращается на кнопку, с которой всё началось. */
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    if (!drawer) return

    const node = drawerRef.current
    const sel =
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !node) return
      const items = [burgerRef.current, ...node.querySelectorAll<HTMLElement>(sel)].filter(
        (el): el is HTMLElement => !!el && el.offsetParent !== null,
      )
      if (items.length === 0) return
      const first = items[0]!
      const last = items[items.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onTab)
    return () => {
      document.removeEventListener('keydown', onTab)
      document.body.style.overflow = ''
    }
  }, [drawer])

  const closeDrawer = () => {
    setDrawer(false)
    burgerRef.current?.focus()
  }

  /** Главная в текущей локали: «/» для украинской, «/en» и «/ru» для прочих. */
  const home = lang === 'ua' ? '/' : `/${lang}`

  /* Сквозная нумерация пунктов панели: одна лесенка сверху вниз,
     а не три независимые по каждому списку. */
  let step = 0
  const next = () => ({ '--i': step++ }) as React.CSSProperties

  return (
    <>
      <a
        href="#practices"
        className="absolute -left-[9999px] top-0 z-[99] bg-ink px-4 py-3 text-sm text-white focus:left-0"
      >
        Перейти до практик
      </a>

      <header
        onMouseLeave={() => setMega(false)}
        data-light={light ? 'true' : 'false'}
        style={{ viewTransitionName: 'site-header' }}
        className={`sticky top-[env(safe-area-inset-top,0px)] z-[80] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-[420ms] ease-[cubic-bezier(.4,0,.2,1)] ${
          light
            ? 'border-b border-transparent bg-transparent'
            : 'bg-paper/[0.88] backdrop-blur-[14px] backdrop-saturate-150'
        } ${
          !light && stuck
            ? 'border-b border-hair-soft shadow-[0_1px_18px_-8px_rgb(20_11_51/0.12)]'
            : !light
              ? 'border-b border-transparent'
              : ''
        }`}
      >
        <div className="mx-auto flex h-[var(--hdr)] max-w-[var(--shell)] items-center gap-[clamp(14px,2.4vw,34px)] px-[var(--gut)]">
          {/* Логотип ведёт на главную, а не на якорь #top.
              Раньше стоял якорь: на главной он работал как «наверх»,
              а с любой внутренней страницы просто прыгал к её началу
              и никуда не уводил. На сайте нет второго общепринятого
              способа вернуться домой, поэтому это была не мелочь. */}
          <a
            href={home}
            aria-label="АКТИВ, на головну"
            className="mr-auto flex min-h-11 shrink-0 items-center"
          >
            <Logo light={light} />
          </a>

          <nav
            aria-label="Головне меню"
            className={`hidden items-center gap-[clamp(14px,1.9vw,28px)] transition-colors duration-[420ms] min-[980px]:flex ${
              light ? 'text-white' : 'text-ink'
            }`}
          >
            <button
              type="button"
              aria-expanded={mega}
              aria-controls="mega"
              onClick={() => setMega((v) => !v)}
              className="group relative inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap border-0 bg-transparent py-2 text-[15px] text-inherit"
            >
              Практики
              <Icon
                name="caret"
                className={`size-[9px] transition-transform duration-[260ms] ${mega ? 'rotate-180' : ''}`}
              />
              <span
                className={`absolute inset-x-0 bottom-0.5 h-px origin-left bg-accent transition-transform duration-[260ms] ease-[cubic-bezier(.5,0,.2,1)] ${
                  mega ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="group relative inline-flex min-h-11 items-center whitespace-nowrap py-2 text-[15px] text-inherit">
                {n.label}
                <span className="absolute inset-x-0 bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-[260ms] ease-[cubic-bezier(.5,0,.2,1)] group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 min-[980px]:flex min-[1240px]:gap-[18px]">
            <div
              role="group"
              aria-label="Мова"
              className="hidden gap-0.5 font-mono text-[11px] tracking-[0.06em] min-[1100px]:flex"
            >
              {LANGS.map((l) => (
                <a
                  key={l.id}
                  href={l.href}
                  aria-current={l.id === lang ? 'true' : undefined}
                  className={
                    l.id === lang
                      ? light
                        ? 'grid min-h-11 min-w-11 place-items-center rounded-sm px-2.5 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)]'
                        : 'grid min-h-11 min-w-11 place-items-center rounded-sm bg-paper-2 px-2.5 text-ink shadow-[inset_0_0_0_1px_var(--color-hair)]'
                      : `grid min-h-11 min-w-11 place-items-center rounded-sm px-2.5 ${
                          light ? 'text-white/60 hover:text-white' : 'text-slate-2 hover:text-ink'
                        }`
                  }
                >
                  {l.label}
                </a>
              ))}
            </div>
            <a
              href={contacts.phoneHref}
              onClick={() => trackPhone('header')}
              className={`hidden min-h-11 items-center whitespace-nowrap font-mono text-[13px] transition-colors duration-[420ms] min-[1240px]:inline-flex ${
                light ? 'text-white' : 'text-ink'
              }`}
            >
              {contacts.phone}
            </a>
            <ButtonLink href="#contact" size="sm">
              Консультація
            </ButtonLink>
          </div>

          {/* ── бургер ──
              Две черты, а не три: верхняя и нижняя сходятся в крест,
              и при закрытом состоянии нижняя короче — знак читается как
              знак, а не как «три полоски по умолчанию». */}
          <button
            ref={burgerRef}
            type="button"
            aria-expanded={drawer}
            aria-controls="drawer"
            aria-label={drawer ? 'Закрити меню' : 'Меню'}
            onClick={() => (drawer ? closeDrawer() : setDrawer(true))}
            className="relative ml-auto inline-flex size-11 items-center justify-end border-0 bg-transparent min-[980px]:hidden"
          >
            <span className="relative block h-[13px] w-[24px]">
              <span
                className={`absolute left-0 block h-[1.5px] bg-current transition-[transform,width,background-color] duration-[440ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                  light ? 'text-white' : 'text-ink'
                } ${drawer ? 'top-[6px] w-[24px] rotate-45' : 'top-0 w-[24px] rotate-0'}`}
              />
              <span
                className={`absolute left-0 block h-[1.5px] bg-current transition-[transform,width,background-color] duration-[440ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                  light ? 'text-white' : 'text-ink'
                } ${drawer ? 'top-[6px] w-[24px] -rotate-45' : 'top-[11.5px] w-[15px] rotate-0'}`}
              />
            </span>
          </button>
        </div>

        {/* ── мега-меню: 4 колонки, все направления ── */}
        <div
          id="mega"
          data-open={mega}
          /* Раскрывается маской, а не проявляется прозрачностью.
             Проявление означает, что все 240 мс сквозь панель видно
             первый экран — на тёмном фото это читается как дефект,
             и ровно этот кадр попадает в скриншот. Маска же режет
             панель по нижнему краю: сквозь неё не видно ничего
             ни в один момент. Приём тот же, что у заголовков и
             у мобильной панели. */
          className="absolute inset-x-0 top-full hidden origin-top border-b border-hair-soft bg-paper shadow-[0_24px_48px_-28px_rgb(20_11_51/0.20)] [transition:clip-path_380ms_var(--ease-out-quint),visibility_380ms] data-[open=false]:invisible data-[open=false]:[clip-path:inset(0_0_100%_0)] data-[open=true]:visible data-[open=true]:[clip-path:inset(0_0_0%_0)] min-[980px]:block"
        >
          <div className="mx-auto grid max-w-[var(--shell)] grid-cols-4 gap-[30px] px-[var(--gut)] pb-[34px] pt-9">
            {categories.map((c) => (
              <div key={c.slug}>
                <h5 className="mb-3.5 flex items-center gap-2.5 font-sans text-[11px] font-medium uppercase tracking-[0.11em] text-slate-2">
                  <Icon name={c.icon} className="size-[19px] text-accent" />
                  {c.title}
                </h5>
                {/* Все направления, без обрезки. Раньше здесь стояло
                    slice(0, 9), и в судовій практиці два пункта из
                    одиннадцати не показывались вовсе — ровно тот
                    дефект старого сайта, ради которого меню и делалось. */}
                {c.practices.map((p) => (
                  <a
                    key={p.slug}
                    href={`/practices/${c.slug}/${p.slug}`}
                    onClick={() => setMega(false)}
                    className="block py-1.5 text-sm font-light leading-tight text-ink transition-colors hover:text-accent-ink"
                  >
                    {p.title}
                  </a>
                ))}
                <a
                  href={`/practices/${c.slug}`}
                  onClick={() => setMega(false)}
                  className="mt-3 block border-t border-hair-soft pt-3 font-mono text-[10.5px] uppercase tracking-[0.09em] text-accent-ink"
                >
                  {c.priceHint ?? `Усі ${c.practices.length} напрямів`}
                </a>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── мобильная панель ── */}
      <div
        id="drawer"
        ref={drawerRef}
        data-open={drawer}
        aria-hidden={!drawer}
        className="on-dark fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-ink px-[var(--gut)] pb-[calc(40px+env(safe-area-inset-bottom,0px))] pt-[calc(var(--hdr)+env(safe-area-inset-top,0px)+20px)] text-on-dark [transition:clip-path_620ms_var(--ease-out-quint),visibility_620ms] data-[open=false]:invisible data-[open=false]:[clip-path:inset(0_0_100%_0)] data-[open=true]:visible data-[open=true]:[clip-path:inset(0_0_0%_0)] min-[980px]:hidden"
      >
        <div className="mx-auto max-w-[var(--shell)]">
          {categories.map((c) => (
            <div key={c.slug} className="drawer-item relative" style={next()}>
              <button
                type="button"
                tabIndex={drawer ? 0 : -1}
                aria-expanded={acc === c.slug}
                onClick={() => setAcc((v) => (v === c.slug ? null : c.slug))}
                className="flex w-full items-center justify-between gap-3 border-0 bg-transparent py-[15px] text-left font-serif text-[clamp(20px,5.4vw,26px)] font-semibold text-white"
              >
                {c.title}
                <Icon
                  name="caret"
                  className={`size-3 shrink-0 text-accent-soft transition-transform duration-[320ms] ${
                    acc === c.slug ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <span className="drawer-rule absolute inset-x-0 bottom-0 block h-px bg-on-dark-hair" />

              {/* Раскрытие по grid-template-rows: высота анимируется без
                  замеров в JS и без max-height, подобранного на глаз. */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                  acc === c.slug ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pb-4 pt-2">
                    {c.practices.map((p) => (
                      <a
                        key={p.slug}
                        href={`/practices/${c.slug}/${p.slug}`}
                        tabIndex={drawer && acc === c.slug ? 0 : -1}
                        onClick={closeDrawer}
                        className="block py-[7px] text-[15px] font-light text-on-dark transition-colors hover:text-accent-soft"
                      >
                        {p.title}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              tabIndex={drawer ? 0 : -1}
              onClick={closeDrawer}
              className="drawer-item relative flex items-center justify-between gap-3 py-[15px] font-serif text-[clamp(20px,5.4vw,26px)] font-semibold text-white"
              style={next()}
            >
              {n.label}
              <Icon name="arrow" className="size-3.5 text-accent-soft" />
              <span className="drawer-rule absolute inset-x-0 bottom-0 block h-px bg-on-dark-hair" />
            </a>
          ))}

          <div className="drawer-item mt-9 flex flex-col gap-5" style={next()}>
            <a
              href={contacts.phoneHref}
              tabIndex={drawer ? 0 : -1}
              onClick={() => trackPhone('drawer')}
              className="font-serif text-[22px] font-semibold text-white"
            >
              {contacts.phone}
            </a>
            <div className="flex flex-wrap gap-2">
              {contacts.messengers.map((m) => (
                <a
                  key={m.label}
                  href={m.href}
                  tabIndex={drawer ? 0 : -1}
                  className="rounded-full px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.09em] text-white shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]"
                >
                  {m.label}
                </a>
              ))}
            </div>
            <div className="flex gap-0.5 font-mono text-[11px] tracking-[0.06em]">
              {LANGS.map((l) => (
                <a
                  key={l.id}
                  href={l.href}
                  tabIndex={drawer ? 0 : -1}
                  aria-current={l.id === lang ? 'true' : undefined}
                  className={
                    l.id === lang
                      ? 'grid min-h-11 min-w-11 place-items-center rounded-sm text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.32)]'
                      : 'grid min-h-11 min-w-11 place-items-center rounded-sm text-on-dark-2'
                  }
                >
                  {l.label}
                </a>
              ))}
            </div>
            <ButtonLink
              href="#contact"
              tabIndex={drawer ? 0 : -1}
              onClick={closeDrawer}
              arrow
              className="self-start"
            >
              Отримати консультацію
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  )
}
