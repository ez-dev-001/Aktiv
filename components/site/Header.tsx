'use client'

import { useEffect, useRef, useState } from 'react'
import { categories as staticCategories, contacts as staticContacts } from '@/lib/content'
import { toMenu, type MenuCategory } from '@/lib/menu'
import type { Contacts } from '@/lib/sanity/content'
import { trackPhone } from '@/lib/analytics'
import { Icon } from './Icon'
import { ButtonLink } from '@/components/ui/Button'
import { Logo } from './Logo'
import { HTML_LANG, LOCALES, LOCALE_LABEL, localeHome, localeHref, swapLocale } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { V2_PRACTICES } from '@/lib/v2/practices'

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
  { href: '/about', key: 'about' },
  { href: '/team', key: 'team' },
  { href: '/career', key: 'career' },
  { href: '/blog', key: 'blog' },
  { href: '/#contact', key: 'contacts' },
] as const

/* Переключатель строится из общего списка языков (lib/i18n.ts), а
   не записан руками: русская версия убрана в одном месте, и здесь она
   исчезла сама. Ссылка на /ru из шапки вела бы теперь на редирект.

   Ведёт на ту же страницу другим языком (/en/team ⇄ /team). Адрес
   читается после монтирования: сервер страницы не знает адресной
   строки (украинский путь переписан proxy на /ua/…), и до гидратации
   ссылки ведут на главную языка — запасной вариант, а не ошибка. */
const LANGS = LOCALES.map((id) => ({ id, label: LOCALE_LABEL[id] }))

const STATIC_MENU = toMenu(staticCategories)

/**
 * До скольких направлений меню остаётся колонками.
 *
 * Четыре колонки по ~260px — это предел: пятая сузила бы каждую до
 * 200px, и «Представництво в органах державної влади» ломалось бы
 * на три строки. С пятого направления меню переходит в две панели:
 * слева список направлений, справа услуги выбранного.
 */
const MAX_COLUMNS = 4

export function Header({
  lang = 'ua',
  overDark = false,
  contacts = staticContacts,
  categories = STATIC_MENU,
}: {
  lang?: string
  overDark?: boolean
  /** из Sanity, если siteSettings заполнен; иначе статика */
  contacts?: Contacts
  /** направления из Sanity (через toMenu); иначе статика */
  categories?: MenuCategory[]
}) {
  const [mega, setMega] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  /* Направление, раскрытое в правой панели (режим 5+ направлений). */
  const [active, setActive] = useState(0)
  /* Направление могли удалить, пока меню открыто на нём. */
  const act = active < categories.length ? active : 0
  const [drawer, setDrawer] = useState(false)
  const [acc, setAcc] = useState<string | null>(null)
  const [stuck, setStuck] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const t = ui(lang)
  /** Внутрішнє посилання в мові сторінки: '/team' → '/en/team'. */
  const to = (href: string) => localeHref(lang, href)
  const nav = NAV.map((n) => ({ href: to(n.href), label: t.common[n.key] }))
  /* Поточний шлях — для перемикача мови (див. LANGS). */
  const [path, setPath] = useState<string | null>(null)
  useEffect(() => setPath(window.location.pathname), [])
  const langHref = (id: string) => (path ? swapLocale(path, id) : localeHome(id))

  /* Белое на прозрачном: поверх фотографии или поверх открытой панели.
     При открытом мега-меню — нет: панель меню светлая, и прозрачная
     шапка над ней выглядела бы как оторванная от неё полоса. */
  const light = drawer || (overDark && !stuck && !mega)

  /* Плавная смена вида шапки включается только после первого кадра.
     Страница может открыться уже прокрученной: переход по якорю,
     «назад» в браузере, обновление посреди статьи. Сервер не знает
     прокрутки и отдаёт прозрачную шапку; если бы переход был включён
     сразу, она полсекунды наливалась бы бумагой поверх текста —
     вспышка на пустом месте. Так она сразу встаёт в нужный вид. */
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    let r2 = 0
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setAnimate(true))
    })
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
    }
  }, [])

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

  /* Фокус возвращается на бургер ТОЛЬКО при работе с клавиатуры.
     После касания пальцем программный focus() на iPhone включал
     :focus-visible — вокруг закрытого бургера оставалась розовая
     рамка, будто кнопку «выделили». Для пальца она лишняя: фокус
     никуда не терялся, его просто не было. Клавиатурное нажатие
     отличает e.detail === 0 — у клика мышью или пальцем там 1. */
  const closeDrawer = (e?: { detail: number }) => {
    setDrawer(false)
    if (!e || e.detail === 0) burgerRef.current?.focus()
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
        {t.header.skip}
      </a>

      <header
        onMouseLeave={() => setMega(false)}
        data-light={light ? 'true' : 'false'}
        style={{ viewTransitionName: 'site-header' }}
        /* Линия под шапкой — тенью, а не border-bottom. Рамка добавляла
           шапке 1px высоты, а тёмный первый экран подтягивается под неё
           ровно на var(--hdr). Этот лишний пиксель оставался сверху
           светлой полоской бумаги над фотографией. Тень места не занимает. */
        className={`sticky top-[env(safe-area-inset-top,0px)] z-[80] ${
          animate ? 'transition-[background-color,box-shadow,backdrop-filter] duration-[420ms] ease-[cubic-bezier(.4,0,.2,1)]' : ''
        } ${
          light
            ? /* Прозрачная шапка над фото: лёгкое затемнение сверху, чтобы
                 малиновый логотип и белое меню читались на любом кадре. */
              'bg-transparent bg-[linear-gradient(180deg,rgb(11_7_16/0.42)_0%,rgb(11_7_16/0)_100%)]'
            : mega ? 'bg-paper' : 'bg-paper/[0.88] backdrop-blur-[14px] backdrop-saturate-150'
        } ${
          !light && stuck
            ? 'shadow-[0_1px_0_var(--color-hair-soft),0_1px_18px_-8px_rgb(11_7_16/0.12)]'
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
            aria-label={t.common.homeAria}
            className="mr-auto flex min-h-11 shrink-0 items-center"
          >
            <Logo onDark={light} />
          </a>

          <nav
            aria-label={t.header.mainMenu}
            className={`hidden items-center gap-[clamp(14px,1.9vw,28px)] transition-colors duration-[420ms] min-[980px]:flex ${
              light ? 'text-white' : 'text-ink'
            }`}
          >
            <button
              type="button"
              aria-expanded={mega}
              aria-controls="mega"
              onClick={() => setMega((v) => !v)}
              className={`group relative inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap border-0 bg-transparent py-2 text-[15px] ${mega ? 'font-semibold text-accent-ink' : 'text-inherit'}`}
            >
              {t.common.practices}
              <Icon
                name="caret"
                className={`size-[9px] transition-transform duration-[260ms] ${mega ? 'rotate-180' : ''}`}
              />
              <span
                className={`absolute inset-x-0 bottom-0.5 h-[2px] origin-left bg-accent transition-transform duration-[260ms] ease-[cubic-bezier(.5,0,.2,1)] ${
                  mega ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="group relative inline-flex min-h-11 items-center whitespace-nowrap py-2 text-[15px] text-inherit">
                {n.label}
                <span className="absolute inset-x-0 bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-[260ms] ease-[cubic-bezier(.5,0,.2,1)] group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 min-[980px]:flex min-[1240px]:gap-[18px]">
            {/* Мова — компактний список «UA ˅», як у макеті клієнта. */}
            <div className="relative hidden min-[1100px]:block" onMouseLeave={() => setLangOpen(false)}>
              <button
                type="button"
                aria-expanded={langOpen}
                aria-label={t.header.language}
                onClick={() => setLangOpen((v) => !v)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-[12px] border-0 px-3.5 text-[14px] font-medium transition-colors ${
                  light ? 'bg-white/[0.08] text-white hover:bg-white/[0.14]' : 'bg-white/70 text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] hover:bg-white'
                }`}
              >
                {LANGS.find((l) => l.id === lang)?.label ?? lang.toUpperCase()}
                <Icon name="caret" className={`size-[9px] transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <ul className="absolute right-0 top-full z-10 m-0 mt-1.5 min-w-full list-none rounded-[12px] bg-white p-1.5 shadow-[0_18px_40px_-16px_rgb(11_7_16/0.3),inset_0_0_0_1px_var(--color-hair)]">
                  {LANGS.map((l) => (
                    <li key={l.id}>
                      <a
                        href={langHref(l.id)}
                        hrefLang={HTML_LANG[l.id]}
                        aria-current={l.id === lang ? 'true' : undefined}
                        className={`block rounded-[8px] px-3 py-2 text-[14px] ${l.id === lang ? 'bg-accent-wash text-accent-ink' : 'text-ink hover:bg-paper'}`}
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Телефон кнопкою-пігулкою, як в armada.law: над тёмним
                першим екраном — прозора з контуром, на папері — заповнена. */}
            <a
              href={contacts.phoneHref}
              onClick={() => trackPhone('header')}
              className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-[18px] text-[14.5px] font-medium transition-[background-color,color,box-shadow] duration-[420ms] ${
                /* Нова редакція: пігулка з малиновим контуром — і над фото, і на папері. */
                light
                  ? 'bg-white/[0.04] text-white shadow-[inset_0_0_0_1.5px_var(--color-accent)] hover:bg-white/[0.1]'
                  : 'bg-white text-ink shadow-[inset_0_0_0_1.5px_var(--color-accent)] hover:bg-accent-wash'
              }`}
            >
              <Icon name="phone" className="size-4 text-accent" />
              {contacts.phone}
              <Icon name="arrow" className="size-[15px] text-accent" />
            </a>
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
            aria-label={drawer ? t.header.closeMenu : t.header.menu}
            onClick={(e) => (drawer ? closeDrawer(e) : setDrawer(true))}
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

        {/* Затемнення сторінки під відкритим меню: увага — на меню,
            клік повз нього закриває його. */}
        <div
          aria-hidden="true"
          onClick={() => setMega(false)}
          className={`fixed inset-x-0 bottom-0 top-[var(--hdr)] hidden bg-ink/35 backdrop-blur-[2px] transition-opacity duration-300 min-[980px]:block ${
            mega ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />
        {/* ── мега-меню «Практики»: вісім напрямів (нова редакція) ── */}
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
          className="absolute inset-x-0 top-full hidden max-h-[calc(100svh-var(--hdr))] origin-top overflow-y-auto overscroll-contain border-b border-hair-soft bg-paper shadow-[0_24px_48px_-28px_rgb(11_7_16/0.20)] [transition:clip-path_380ms_var(--ease-out-quint),visibility_380ms] data-[open=false]:invisible data-[open=false]:[clip-path:inset(0_0_100%_0)] data-[open=true]:visible data-[open=true]:[clip-path:inset(0_0_0%_0)] min-[980px]:block"
        >
          {/* Нова редакція (макет клієнта): вісім напрямів у дві смуги по
              чотири колонки — малиновий квадрат біля назви, послуги рядками
              зі стрілкою →. Праворуч угорі — світлі колони з малиновою
              діагоналлю, як на першому екрані «Практик». */}
          <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-[360px] w-[min(680px,46%)] bg-cover bg-[right_top] opacity-50 [mask-composite:intersect] [mask-image:linear-gradient(90deg,transparent,#000_55%),linear-gradient(180deg,#000_25%,transparent)]" style={{ backgroundImage: "url(/v2/img/light-hall.jpg), linear-gradient(118deg, transparent 70%, rgb(250 33 99 / 0.18) 70.2%, transparent 76%)" }} />
          <div className="relative mx-auto grid max-w-[var(--shell)] grid-cols-4 gap-x-[clamp(28px,3vw,56px)] gap-y-[clamp(28px,3vw,40px)] px-[var(--gut)] pb-[clamp(28px,3vw,40px)] pt-[clamp(28px,3vw,44px)]">
            {V2_PRACTICES.map((c) => (
              <div key={c.title} className="min-w-0">
                <a
                  href={to(c.href)}
                  onClick={() => setMega(false)}
                  className="group/t mb-3 flex items-start gap-3.5 font-serif text-[clamp(20px,1.6vw,25px)] font-bold leading-[1.15] tracking-[-0.01em] text-ink transition-colors hover:text-accent-ink"
                >
                  <span aria-hidden="true" className="mt-[0.32em] size-[13px] shrink-0 bg-accent" />
                  {c.title}
                </a>
                <ul className="m-0 list-none p-0 pl-[27px]">
                  {c.items.map((p) => (
                    <li key={p.title}>
                      <a
                        href={to(p.href ?? c.href)}
                        onClick={() => setMega(false)}
                        className="group/i -mx-2.5 flex items-start justify-between gap-4 rounded-[10px] px-2.5 py-[5px] text-[15px] font-normal leading-[1.38] text-[#3b3440] transition-colors hover:bg-white/80 hover:text-accent-ink"
                      >
                        <span>{p.title}</span>
                        <Icon name="arrow" className="mt-[3px] size-[15px] shrink-0 text-accent transition-transform duration-200 group-hover/i:translate-x-1" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/* Нижня смуга меню: для тих, хто не знає, куди віднести свою ситуацію. */}
          <div className="relative border-t border-ink/[0.08] bg-white/60 backdrop-blur">
            <div className="mx-auto flex max-w-[var(--shell)] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-[var(--gut)] py-4">
              <p className="m-0 flex items-center gap-3 text-[15px] text-slate">
                <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-accent-wash text-accent">
                  <Icon name="message" className="size-[17px]" />
                </span>
                <span>
                  <b className="font-semibold text-ink">{t.v2menu.unsure}</b> {t.v2menu.unsureText}
                </span>
              </p>
              <div className="flex items-center gap-5">
                <a href={to('/practices')} onClick={() => setMega(false)} className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-ink hover:text-accent-ink">
                  {t.v2menu.all}
                  <Icon name="arrow" className="size-[15px] text-accent" />
                </a>
                <a
                  href="#contact"
                  onClick={() => setMega(false)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent-btn px-5 text-[14.5px] font-semibold text-white transition-colors hover:bg-accent-btn-hover"
                >
                  {t.common.getConsultation}
                  <Icon name="arrow" className="size-[15px]" />
                </a>
              </div>
            </div>
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
          {V2_PRACTICES.map((c) => (
            <div key={c.title} className="drawer-item relative" style={next()}>
              <button
                type="button"
                tabIndex={drawer ? 0 : -1}
                aria-expanded={acc === c.title}
                onClick={() => setAcc((v) => (v === c.title ? null : c.title))}
                className="flex w-full items-center justify-between gap-3 border-0 bg-transparent py-[15px] text-left font-serif text-[clamp(20px,5.4vw,26px)] font-semibold text-white"
              >
                {c.title}
                <Icon
                  name="caret"
                  className={`size-3 shrink-0 text-accent-soft transition-transform duration-[320ms] ${
                    acc === c.title ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <span className="drawer-rule absolute inset-x-0 bottom-0 block h-px bg-on-dark-hair" />

              {/* Раскрытие по grid-template-rows: высота анимируется без
                  замеров в JS и без max-height, подобранного на глаз. */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)] ${
                  acc === c.title ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="pb-4 pt-2">
                    {c.items.map((p) => (
                      <a
                        key={p.title}
                        href={to(p.href ?? c.href)}
                        tabIndex={drawer && acc === c.title ? 0 : -1}
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

          {nav.map((n) => (
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
                  className="rounded-full px-3.5 py-2.5 text-[13px] text-white shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]"
                >
                  {m.label}
                </a>
              ))}
            </div>
            <div className="flex gap-0.5 text-[13px]">
              {LANGS.map((l) => (
                <a
                  key={l.id}
                  href={langHref(l.id)}
                  hrefLang={HTML_LANG[l.id]}
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
              {t.common.getConsultation}
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  )
}
