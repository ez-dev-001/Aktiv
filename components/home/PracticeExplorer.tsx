'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { PhotoName, PhotoSource } from '@/lib/photos'
import { Icon } from '@/components/site/Icon'
import { Photo } from '@/components/site/Photo'
import { CHOOSE_DIRECTION_EVENT, CHOOSE_PRACTICE_EVENT } from './DirectionPicker'

/** Консультація з напряму без перезавантаження сторінки: напрям уже
 *  вибраний у формі, сторінка плавно їде до неї. Адреса оновлюється
 *  тим самим ?practice=…, що й у посилання зі сторінок практик, — тому
 *  без JS посилання працює як раніше. */
function consult(e: React.MouseEvent<HTMLAnchorElement>, value: string) {
  const form = document.getElementById('contact')
  if (!form) return
  e.preventDefault()
  window.dispatchEvent(new CustomEvent(CHOOSE_PRACTICE_EVENT, { detail: value }))
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  form.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(null, '', `?practice=${encodeURIComponent(value)}#contact`)
}

/**
 * Практики на головній — провідник замість сітки карток.
 *
 * ── Чому так ──
 * Чотири однакові картки по п'ять посилань читаються як каталог: око
 * ковзає по них, нічого не вибираючи. Тут одна дія: обрати напрям
 * зліва. Праворуч відкривається він увесь — кадр, кілька слів про
 * напрям і ВСІ його послуги, а не перші п'ять. Людина бачить повний
 * перелік того, що її стосується, і не бачить решти, що не стосується.
 *
 * ── Доступність ──
 * Патерн вкладок WAI-ARIA: tablist / tab / tabpanel, стрілки й
 * Home/End між вкладками, вибір фокусом. Панель — звичайний HTML з
 * посиланнями, тому пошуковики бачать і посилання першого напряму.
 * Решта напрямів у DOM не рендериться, але кожна послуга й так є в
 * меню шапки й на сторінці напряму.
 *
 * На телефоні вкладки стають рядком «пігулок» з горизонтальною
 * прокруткою над панеллю.
 *
 * ── Зв'язок з першим екраном ──
 * Капсула «Обрати напрям» (DirectionPicker) шле подію з slug напряму:
 * тут він відкривається й коротко підсвічується. Те саме — якщо
 * сторінку відкрили за посиланням …/#napryam-<slug>.
 *
 * ── Пошук ──
 * Над вкладками — поле «Знайти послугу». Людина пише своїми словами
 * («ТЦК», «борг», «закрити ТОВ»), і замість панелі напряму бачить
 * послуги з усіх чотирьох напрямів. Народні слова, яких немає в назвах,
 * розгортаються через HINTS.
 */

/** Слова людей → корені з назв послуг. */
const HINTS: Record<string, string> = {
  тцк: 'мобіліз тцк влк',
  мобіліз: 'тцк мобіліз відстроч',
  повістк: 'тцк мобіліз',
  армі: 'військ',
  борг: 'стягн заборгован банкрут',
  кредит: 'кредит банкрут',
  закри: 'ліквідац',
  тов: 'ліквідац реєстрац реорганіз',
  фоп: 'реєстрац',
  земл: 'земел',
  квартир: 'нерухом',
  будин: 'нерухом будівн',
  розлуч: 'сімей',
  аліме: 'сімей',
  звільн: 'трудов',
  зарплат: 'трудов',
  податк: 'податков',
  кримінал: 'кримінальн',
  пенсі: 'пенсі',
  виплат: 'виплат винагород',
  булінг: 'булінг',
  марк: 'інтелектуальн',
}

const norm = (s: string) => s.toLowerCase().replace(/['’ʼ]/g, '').trim()

export interface ExplorerGroup {
  slug: string
  title: string
  icon: string
  excerpt: string
  photo?: PhotoName | PhotoSource
  practices: { slug: string; title: string }[]
}

export function PracticeExplorer({ groups }: { groups: ExplorerGroup[] }) {
  const [active, setActive] = useState(0)
  const [flash, setFlash] = useState(0)
  const [q, setQ] = useState('')
  const base = useId()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  /* Вибір напряму з першого екрана або з посилання #napryam-<slug>. */
  useEffect(() => {
    const open = (slug: string) => {
      const i = groups.findIndex((x) => x.slug === slug)
      if (i < 0) return
      setQ('')
      setActive(i)
      setFlash((n) => n + 1)
    }
    const m = /^#napryam-(.+)$/.exec(window.location.hash)
    if (m?.[1]) open(decodeURIComponent(m[1]))
    const onChoose = (e: Event) => open(String((e as CustomEvent).detail))
    window.addEventListener(CHOOSE_DIRECTION_EVENT, onChoose)
    return () => window.removeEventListener(CHOOSE_DIRECTION_EVENT, onChoose)
  }, [groups])

  const results = useMemo(() => {
    const words = norm(q).split(/\s+/).filter((w) => w.length >= 2)
    if (!words.length) return []
    const expand = words.flatMap((w) => [
      w,
      ...Object.entries(HINTS)
        .filter(([k]) => w.startsWith(k) || k.startsWith(w))
        .flatMap(([, v]) => v.split(' ')),
    ])
    return groups
      .flatMap((grp) => grp.practices.map((p) => ({ ...p, group: grp })))
      .map((it) => {
        const title = norm(it.title)
        const hay = `${title} ${norm(it.group.title)}`
        const direct = words.every((w) => hay.includes(w))
        /* Підказки — лише по назві послуги: по назві напряму вони
           зачіпали б увесь напрям («борг» → усі 6 послуг ліквідації). */
        const hinted = expand.some((w) => title.includes(w))
        return { it, score: direct ? 2 : hinted ? 1 : 0 }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.it)
  }, [q, groups])

  /* На телефоні вкладки — горизонтальна стрічка: підкручуємо її так,
     щоб обраний напрям був на виду. Лише scrollLeft контейнера, без
     scrollIntoView: той зрушив би й саму сторінку посеред плавного
     переїзду з першого екрана. */
  useEffect(() => {
    const el = tabs.current[active]
    const list = el?.parentElement
    if (!el || !list || list.scrollWidth <= list.clientWidth) return
    list.scrollTo({ left: el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' })
  }, [active])

  const g = groups[active]
  if (!g) return null
  const searching = q.trim().length >= 2

  function onKey(e: React.KeyboardEvent, i: number) {
    let next = -1
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % groups.length
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + groups.length) % groups.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = groups.length - 1
    if (next < 0) return
    e.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="grid gap-[clamp(16px,2.4vw,32px)]">
      {/* ── пошук по всіх послугах ── */}
      <label className="relative block">
        <span className="sr-only">Знайти послугу</span>
        <Icon name="search" className="pointer-events-none absolute left-5 top-1/2 size-[18px] -translate-y-1/2 text-slate-2" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Знайти послугу, напр. ТЦК або борг"
          enterKeyHint="search"
          autoComplete="off"
          className="h-14 w-full rounded-full border-0 bg-white pl-12 pr-5 font-sans text-[15.5px] text-ink shadow-[inset_0_0_0_1px_var(--color-hair),0_10px_30px_-22px_rgb(11_7_16/0.35)] transition-shadow placeholder:text-slate-2 focus:shadow-[inset_0_0_0_1.5px_var(--color-accent),0_10px_30px_-22px_rgb(11_7_16/0.35)] focus:outline-none"
        />
      </label>

    <div className="grid gap-[clamp(16px,2.4vw,32px)] min-[960px]:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)]">
      {/* ── вкладки + «не знайшли?» ── */}
      <div className="flex min-w-0 flex-col gap-[clamp(16px,2vw,24px)]">
      <div
        role="tablist"
        aria-label="Напрями практики"
        aria-orientation="vertical"
        className="-mx-[var(--gut)] flex gap-2 overflow-x-auto px-[var(--gut)] pb-1 [scrollbar-width:none] min-[960px]:mx-0 min-[960px]:flex-col min-[960px]:gap-1 min-[960px]:overflow-visible min-[960px]:px-0 max-[959px]:[mask-image:linear-gradient(90deg,#000_calc(100%-48px),transparent)] [&::-webkit-scrollbar]:hidden"
      >
        {groups.map((x, i) => {
          const on = i === active
          return (
            <button
              key={x.slug}
              ref={(el) => {
                tabs.current[i] = el
              }}
              id={`${base}-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`${base}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`group relative flex shrink-0 items-center gap-3 rounded-full border-0 px-4 py-2.5 text-left transition-colors duration-300 min-[960px]:rounded-[14px] min-[960px]:px-5 min-[960px]:py-[clamp(16px,1.8vw,22px)] ${
                searching ? 'opacity-60' : ''
              } ${
                on
                  ? 'bg-ink text-white shadow-[0_18px_40px_-24px_rgb(11_7_16/0.6)]'
                  : 'bg-white text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] hover:bg-paper-2 min-[960px]:bg-transparent min-[960px]:shadow-none'
              }`}
            >
              <span
                className={`hidden text-[13px] min-[960px]:inline ${on ? 'text-accent-soft' : 'text-slate-2'}`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <Icon name={x.icon} className={`size-5 shrink-0 min-[960px]:size-6 ${on ? 'text-accent' : 'text-slate-2'}`} />
              <span className="min-w-0 flex-1 whitespace-nowrap font-serif text-[15px] font-semibold leading-tight min-[960px]:whitespace-normal min-[960px]:text-[clamp(18px,1.8vw,21px)]">
                {x.title}
              </span>
              <span className={`hidden text-[13px] tabular-nums min-[960px]:inline ${on ? 'text-white/55' : 'text-slate-2'}`}>
                {x.practices.length}
              </span>
            </button>
          )
        })}
      </div>

        {/* Вихід для тих, хто не впізнав себе в жодному напрямі: на
            десктопі під вкладками порожньо, і саме там людина зависає. */}
        <div className="hidden rounded-[16px] p-5 shadow-[inset_0_0_0_1px_var(--color-hair)] min-[960px]:block">
          <p className="m-0 font-serif text-[17px] font-semibold leading-snug text-ink">Не знайшли свою ситуацію?</p>
          <p className="m-0 mt-1.5 text-[14px] leading-relaxed text-slate">Опишіть її двома реченнями — юрист скаже, чи беремося і з чого почати.</p>
          <a href="#contact" className="group mt-3 inline-flex min-h-11 items-center gap-2 text-[14.5px] font-medium text-accent-ink">
            Описати ситуацію
            <Icon name="arrow" className="size-[15px] transition-transform duration-[240ms] group-hover:translate-x-1" />
          </a>
        </div>
      </div>

      {/* ── результати пошуку замість панелі ── */}
      {searching ? (
        <div className="explorer-panel min-w-0 rounded-[20px] bg-white p-[clamp(20px,2.8vw,32px)] shadow-[0_1px_2px_rgb(11_7_16/0.045),0_18px_44px_-24px_rgb(11_7_16/0.18)]" aria-live="polite">
          <p className="m-0 mb-3 text-[13px] text-slate-2">
            {results.length ? `Знайдено: ${results.length}` : 'Нічого не знайшли'}
          </p>
          {results.length ? (
            <ul className="m-0 grid list-none p-0">
              {results.map((r) => (
                <li key={`${r.group.slug}/${r.slug}`} className="border-b border-hair-soft">
                  <a href={`/practices/${r.group.slug}/${r.slug}`} className="group/row grid min-h-12 grid-cols-[1fr_auto] items-center gap-x-4 py-3">
                    <span className="min-w-0">
                      <span className="block text-[15px] leading-snug text-ink transition-colors group-hover/row:text-accent-ink">{r.title}</span>
                      <span className="mt-0.5 block text-[13px] text-slate-2">{r.group.title}</span>
                    </span>
                    <Icon name="arrow" className="size-[14px] text-slate-2 transition-[color,transform] duration-[240ms] group-hover/row:translate-x-1 group-hover/row:text-accent-ink" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-[15px] leading-relaxed text-slate">
              Такої послуги в списку немає, але це не означає «ні».{' '}
              <a href="#contact" className="text-accent-ink underline decoration-accent/40 underline-offset-[3px]">
                Опишіть ситуацію
              </a>{' '}
              — юрист підкаже, чи беремося.
            </p>
          )}
        </div>
      ) : (
      /* ── панель обраного напряму ── */
      <div
        key={`${g.slug}-${flash}`}
        id={`${base}-panel`}
        role="tabpanel"
        aria-labelledby={`${base}-tab-${active}`}
        className={`explorer-panel min-w-0 overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgb(11_7_16/0.045),0_18px_44px_-24px_rgb(11_7_16/0.18)] ${
          flash ? 'explorer-flash' : ''
        }`}
      >
        {g.photo ? (
          <Photo name={g.photo} ratio={2.6} tone="ink" sizes="(min-width: 960px) 56vw, 92vw">
            <div className="flex size-full flex-col justify-end p-[clamp(20px,2.8vw,32px)]">
              <h3 className="m-0 max-w-[22ch] text-[clamp(22px,2.8vw,32px)] leading-tight !text-white">{g.title}</h3>
            </div>
          </Photo>
        ) : (
          <div className="bg-ink p-[clamp(20px,2.8vw,32px)] pt-[clamp(48px,6vw,72px)]">
            <h3 className="m-0 max-w-[22ch] text-[clamp(22px,2.8vw,32px)] leading-tight !text-white">{g.title}</h3>
          </div>
        )}

        <div className="p-[clamp(20px,2.8vw,32px)]">
          <ul className="m-0 grid list-none gap-x-8 p-0 min-[640px]:grid-cols-2">
            {g.practices.map((p) => (
              <li key={p.slug} className="border-b border-hair-soft">
                <a
                  href={`/practices/${g.slug}/${p.slug}`}
                  className="group/row grid min-h-11 grid-cols-[1fr_auto] items-center gap-x-4 py-2.5"
                >
                  <span className="text-[14.5px] leading-snug text-ink transition-colors group-hover/row:text-accent-ink">{p.title}</span>
                  <Icon
                    name="arrow"
                    className="size-[14px] text-slate-2 transition-[color,transform] duration-[240ms] group-hover/row:translate-x-1 group-hover/row:text-accent-ink"
                  />
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <a
              href={`/practices/${g.slug}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14.5px] text-white transition-colors hover:bg-ink-2"
            >
              Про напрям
              <Icon name="arrow" className="size-[15px]" />
            </a>
            <a
              href={`/?practice=cat:${g.slug}#contact`}
              onClick={(e) => consult(e, `cat:${g.slug}`)}
              className="inline-flex min-h-11 items-center rounded-full px-5 text-[14.5px] text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--color-ink)]"
            >
              Консультація з цього напряму
            </a>
          </div>
        </div>
      </div>
      )}
    </div>
    </div>
  )
}
