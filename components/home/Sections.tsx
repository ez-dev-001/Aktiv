import { categories as staticCategories, contacts as staticContacts, figures as staticFigures, journal, team as staticTeam, type Category } from '@/lib/content'
import { staticAbout, staticHome, teamPhoto, type Contacts, type Figure, type HomeContent, type Post, type TeamMember } from '@/lib/sanity/content'
import type { HomePerson } from '@/lib/content'
import { Icon } from '@/components/site/Icon'
import { ArrowLink, ButtonLink, Eyebrow } from '@/components/ui/Button'
import { Counter } from '@/components/ui/Counter'
import { Reveal } from '@/components/ui/Reveal'
import { Logo } from '@/components/site/Logo'
import { PracticeNote } from '@/components/site/PracticeNote'
import { Photo } from '@/components/site/Photo'
import { CookieSettingsLink } from '@/components/site/CookieConsent'
import { HeroMark } from './HeroMark'
import { preload } from 'react-dom'
import { PHOTOS, photoUrl } from '@/lib/photos'
import { PracticeTabs } from './PracticeTabs'
import { POST_GRID, PostCard, needsMedia } from '@/components/site/PostCard'

/* ═══════════════════════ ПЕРШИЙ ЕКРАН ═══════════════════════
   Формат — як у armada.law (затверджено клієнтом за макетом):
   прозора шапка з телефоном, ліворуч великий заголовок-H1 про те, що
   робить фірма, абзац і дві дії — головна кнопка до форми й тихе
   посилання «Ознайомитись» до блоку «Команда». Праворуч один великий
   образ, що йде за край екрана: у них кристал із містом, у нас — знак
   «АКТИВ» (кільце з кадром і стріла, HeroMark).

   Нічого більше: ні надзаголовка, ні капсули напрямів, ні смуги
   обіцянок. Напрями — у меню «Практики» і в блоці практик нижче.

   Висота в svh, а не vh: на телефоні динамічна панель браузера
   інакше зрізає кнопки. */
export function Hero({ home = staticHome }: { home?: HomeContent }) {
  /* Кадр усередині знака — найважливіша картинка першого екрана:
     браузер тягне її одразу з HTML, і коли ірис відкривається, кадр уже є. */
  preload(photoUrl(PHOTOS.tower, 900), { as: 'image', fetchPriority: 'high' })
  /* У студії могло лишитися старе «Обрати напрям» — підпис капсули,
     якої більше немає. Тут це посилання до «Команди». */
  const more = /напрям/i.test(home.heroCtaSecondary) ? 'Ознайомитись' : home.heroCtaSecondary

  return (
    /* Відʼємний відступ на висоту шапки: шапка липка й стоїть у потоці,
       без нього фон починався б під нею. */
    <section
      id="hero"
      className="on-dark relative isolate mt-[calc(-1*(var(--hdr)+env(safe-area-inset-top,0px)))] overflow-hidden bg-ink text-on-dark"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-[1] bg-[radial-gradient(55%_70%_at_4%_0%,rgb(60_34_120/0.45),transparent_70%),radial-gradient(40%_60%_at_78%_55%,rgb(250_33_99/0.14),transparent_70%)]"
      />

      {/* ── Сітка першого екрана ──
          Комп'ютер (від 1000px): ліворуч текст, праворуч великий знак,
          що йде за край — формат armada.law.
          Телефон і планшет (варіант «A» з макетів): знак — маленький
          анімований значок у рядку «Київ · з 2007 року», під ним
          великий заголовок і повний абзац. Кнопки на телефоні не тут,
          а в липкій панелі внизу екрана (MobileDock), тому тут лише
          «Ознайомитись», притиснуте до низу першого екрана.
          Знак один і той самий (HeroMark), змінюється лише його місце
          в сітці: два знаки на сторінці дублювали б id градієнтів SVG. */}
      <div className="shell inner relative z-[2] grid min-h-[clamp(600px,100svh,860px)] grid-cols-[auto_minmax(0,1fr)] min-[600px]:min-h-[640px] grid-rows-[auto_1fr] content-start items-center gap-x-3 pb-[104px] pt-[calc(var(--hdr)+28px)] min-[1000px]:min-h-[clamp(620px,92svh,860px)] min-[1000px]:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] min-[1000px]:grid-rows-1 min-[1000px]:content-center min-[1000px]:gap-y-2 min-[1000px]:pb-[clamp(40px,5vw,64px)] min-[1000px]:pt-[clamp(104px,12vw,140px)]">
        <div className="col-start-1 row-start-1 -my-3 -ml-1 mr-1 w-[124px] min-w-0 min-[600px]:w-[150px] min-[1000px]:col-start-2 min-[1000px]:m-0 min-[1000px]:-mr-[24%] min-[1000px]:w-[min(760px,128%)] min-[1000px]:justify-self-end">
          <HeroMark />
        </div>
        <p className="col-start-2 row-start-1 m-0 font-mono text-[10px] uppercase leading-[1.5] tracking-[0.14em] text-accent-soft min-[1000px]:hidden">
          Київ · з 2007 року
        </p>

        <div className="relative z-[2] col-span-2 row-start-2 flex min-w-0 max-w-[640px] flex-col self-stretch pt-[22px] min-[1000px]:col-span-1 min-[1000px]:col-start-1 min-[1000px]:row-start-1 min-[1000px]:self-center min-[1000px]:pt-0">
          <h1 className="m-0 font-serif text-[clamp(38px,5.6vw,78px)] font-normal leading-[1.03] tracking-[-0.022em] text-white [text-wrap:balance]">
            {home.heroHeading}{' '}
            {home.heroHeadingAccent && <em className="text-accent-soft">{home.heroHeadingAccent}</em>}
          </h1>
          {home.heroLede && (
            <p className="m-0 mt-[clamp(16px,2.6vw,30px)] max-w-[54ch] text-[clamp(15px,1.3vw,17.5px)] leading-[1.6] text-white/[0.72]">
              {home.heroLede}
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-x-[30px] gap-y-2 pt-6 min-[1000px]:mt-[clamp(28px,3.4vw,40px)] min-[1000px]:pt-0">
            {/* на телефоні й планшеті головна кнопка живе в MobileDock */}
            <ButtonLink href="#contact" arrow className="min-h-[54px] shadow-[0_14px_34px_-14px_rgb(224_16_85/0.7)] max-[999px]:hidden">
              {home.heroCtaPrimary}
            </ButtonLink>
            <a href="#team" className="group inline-flex min-h-12 items-center gap-2.5 text-[16px] font-medium text-white">
              {more}
              <span className="grid size-[34px] place-items-center rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)] transition-transform duration-200 group-hover:translate-y-[3px]">
                <Icon name="arrow" className="size-4 rotate-90" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════ КОМАНДА ═══════════════════════
   Одразу під першим екраном, як в Армади: ліворуч великий портрет
   керуючого партнера, праворуч «Команда», кілька рядків, «Уся команда»
   і слово партнера.

   Цитату за партнера не вигадуємо: поки її немає в Sanity (Головна →
   «Команда»), блок цитати просто не показується. */
export function TeamIntro({
  lang,
  home = staticHome,
  members = FALLBACK_TEAM,
  author,
}: {
  lang: string
  home?: HomeContent
  members?: TeamMember[]
  author?: HomePerson
}) {
  const quote = home.teamQuote.trim()
  const href = lang === 'ua' ? '/team' : `/${lang}/team`
  /* Портретний кроп 4:5 від верху кадру: голова не йде за край. */
  const portrait = author?.photoUrl ? `${author.photoUrl}?w=760&h=950&fit=crop&crop=top&auto=format&q=80` : undefined
  /* Квадратний кроп для кружка на телефоні й планшеті. */
  const avatar = author?.photoUrl ? `${author.photoUrl}?w=320&h=320&fit=crop&crop=top&auto=format&q=80` : undefined
  const faces = members.filter((m) => m.photoUrl && m.name !== author?.name).slice(0, 5)

  return (
    <section id="team" aria-label="Команда" className="scroll-mt-[var(--hdr)] bg-paper py-[clamp(56px,8vw,112px)]">
      <div className={`shell inner grid items-center gap-[clamp(28px,5vw,80px)] ${portrait ? 'min-[860px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]' : 'min-[860px]:grid-cols-1'}`}>
        {/* Великий портрет — лише на десктопі. На телефоні й планшеті
            його заміняє кружок поруч з іменем (нижче), щоб фото не
            займало весь екран і не відсувало текст. */}
        {portrait && author && (
          <figure className="relative isolate m-0 hidden w-full max-w-[420px] min-[860px]:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-paper-2 shadow-[0_40px_80px_-48px_rgb(20_11_51/0.55)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait} alt={author.name} loading="lazy" decoding="async" className="size-full object-cover object-top" />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,transparent,rgb(20_11_51/0.82))]" />
              <figcaption className="absolute inset-x-0 bottom-0 p-[clamp(18px,2.4vw,26px)]">
                <span className="block font-serif text-[clamp(20px,2.3vw,24px)] font-semibold leading-tight text-white">{author.name}</span>
                {author.role && <span className="mt-1 block text-[13.5px] text-accent-soft">{author.role}</span>}
              </figcaption>
            </div>
            {/* малиновий кут за портретом — та сама рамка, що в знаку */}
            <span aria-hidden="true" className="absolute -bottom-3 -left-3 -z-[1] h-2/5 w-2/5 rounded-bl-[26px] border-b-[3px] border-l-[3px] border-accent" />
          </figure>
        )}

        <div className="min-w-0">
          {/* Телефон і планшет: портрет у кружку, обведений розімкненим
              кільцем — тим самим, що в знаку «АКТИВ». */}
          {avatar && author && (
            <div className="mb-[clamp(22px,4vw,32px)] flex items-center gap-[clamp(16px,3.4vw,24px)] min-[860px]:hidden">
              <div className="relative size-[104px] shrink-0 min-[600px]:size-[128px]">
                <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                  <path d="M94.2 66.1 A 47 47 0 1 1 94.2 33.9" fill="none" stroke="var(--color-accent)" strokeWidth="3.2" strokeLinecap="round" />
                </svg>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt={author.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-[9%] size-[82%] rounded-full bg-paper-2 object-cover object-top shadow-[0_16px_32px_-18px_rgb(20_11_51/0.55)]"
                />
              </div>
              <div className="min-w-0">
                <span className="block font-serif text-[clamp(20px,4.6vw,24px)] font-semibold leading-tight text-ink">{author.name}</span>
                {author.role && <span className="mt-1 block text-[14px] leading-snug text-accent-ink">{author.role}</span>}
              </div>
            </div>
          )}
          <Reveal className="text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.05] tracking-[-0.02em]">Команда</Reveal>
          <p className="m-0 mt-[18px] max-w-[56ch] text-[15.5px] leading-[1.65] text-slate">
            {home.teamText.replaceAll('{n}', String(members.length))}
          </p>
          <div className="mt-[22px] flex flex-wrap items-center gap-5">
            <ArrowLink href={href} className="text-[15px] font-semibold">
              Уся команда
            </ArrowLink>
            {faces.length > 0 && (
              <span className="flex -space-x-2.5" aria-hidden="true">
                {faces.map((m) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={m.slug ?? m.name}
                    src={teamPhoto(m.photoUrl, 120)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-10 rounded-full object-cover ring-[3px] ring-paper"
                  />
                ))}
              </span>
            )}
          </div>

          {quote && (
            <figure className="relative m-0 mt-[30px] max-w-[52ch] pl-14">
              <span aria-hidden="true" className="absolute -top-3.5 left-0 font-serif text-[84px] leading-none text-accent">“</span>
              <blockquote className="m-0 font-serif text-[clamp(19px,2vw,23px)] italic leading-[1.45] text-ink">{quote}</blockquote>
              {author && (
                <figcaption className="mt-3 text-right font-serif text-[14px] italic text-slate">
                  — {author.name}
                  {author.role ? `, ${author.role.toLowerCase()}` : ''}
                </figcaption>
              )}
            </figure>
          )}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════ ЦИФРЫ ═══════════════════════
   Идут сразу под героем и на том же тёмном: если вернуть здесь бумагу,
   между фотографией и цифрами получится шов, и первый экран
   разваливается на две несвязанные картинки. */
export function Figures({ figures = staticFigures }: { figures?: Figure[] }) {
  return (
    <div className="on-dark border-b border-on-dark-hair bg-ink-2 py-[clamp(30px,4vw,48px)]">
      <div className="shell inner">
        <div className="grid gap-[clamp(20px,3vw,40px)] max-[680px]:gap-[26px] min-[681px]:grid-cols-3">
          {figures.map((f) => (
            <div key={f.label}>
              <span className="block font-serif text-[clamp(38px,6.4vw,62px)] font-semibold leading-[0.95] tracking-[-0.03em] tabular-nums text-accent-soft">
                <Counter to={f.value} />
                {f.suffix}
                {f.unit && <span className="ml-[0.12em] text-[0.44em] font-normal tracking-normal text-white">{f.unit}</span>}
              </span>
              <span className="mt-3 block max-w-[24ch] text-sm leading-snug text-on-dark">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════ ГОЛОВНА ФРАЗА ═══════════════════════
   Як «Орієнтованість на результат…» в Армади: одна велика фраза по
   центру на тлі контурного водяного знака. У нас це слоган фірми —
   Sanity → Головна → «Слоган». id="credo" лишився від колишнього
   блоку «Місія»: на нього ведуть посилання з «Про компанію». */
export function Claim({ home = staticHome }: { home?: HomeContent }) {
  return (
    <section id="credo" aria-label="Наш принцип" className="relative isolate overflow-hidden bg-paper py-[clamp(72px,10vw,140px)] text-center">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-[1] -translate-y-1/2 select-none whitespace-nowrap font-serif text-[clamp(90px,19vw,250px)] font-bold leading-[0.86] tracking-[-0.02em] text-transparent [-webkit-text-stroke:1.2px_#ece6e8]"
      >
        АКТИВ
      </span>
      <div className="shell inner">
        <p className="m-0 mx-auto max-w-[20ch] font-serif text-[clamp(30px,4.6vw,58px)] font-normal leading-[1.12] tracking-[-0.015em] text-ink [text-wrap:balance]">
          {/* тире тримається за попереднє слово, а не відкриває рядок */}
          {home.heroTitle.replace(/\s+—\s*$/, '\u00a0—')}{' '}
          <em className="text-accent-ink">{home.heroTitleAccent}</em>
        </p>
      </div>
    </section>
  )
}

/* ═══════════════════════ ПРАКТИКИ ═══════════════════════
   Сплит, як «Наша експертиза» в Армади: ліворуч тёмна половина з
   текстом, праворуч світла з плашками послуг (PracticeTabs). Половини
   йдуть від краю до краю, текст вирівняний по сітці сторінки. */
export function Practices({
  categories = staticCategories,
  lang = 'ua',
  text = staticHome.practicesText,
}: {
  categories?: Category[]
  lang?: string
  text?: string
}) {
  const groups = categories.map((c) => ({
    slug: c.slug,
    title: c.title,
    practices: c.practices.map((p) => ({ slug: p.slug, title: p.title })),
  }))
  const total = categories.reduce((n, c) => n + c.practices.length, 0)
  const href = lang === 'ua' ? '/practices' : `/${lang}/practices`

  return (
    <section id="practices" aria-label="Наша практика" className="grid scroll-mt-[var(--hdr)] [container-type:inline-size] min-[900px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="on-dark bg-ink px-[var(--gut)] py-[clamp(48px,7vw,96px)] text-on-dark min-[900px]:pl-[max(var(--gut),calc((100cqw-var(--shell))/2+var(--gut)))]">
        <div className="max-w-[440px]">
          <Reveal className="text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] !text-white">
            Наша <em className="text-accent-soft">практика</em>
          </Reveal>
          <p className="m-0 mt-[18px] text-[15.5px] leading-[1.65] text-on-dark">
            {text}
          </p>
          <ArrowLink href={href} className="mt-[22px] text-[15px] font-semibold !text-accent-soft">
            Усі {total} послуг
          </ArrowLink>
        </div>
      </div>
      <div className="bg-paper-2 px-[var(--gut)] py-[clamp(36px,6vw,96px)] min-[900px]:pr-[max(var(--gut),calc((100cqw-var(--shell))/2+var(--gut)))]">
        <PracticeTabs groups={groups} />
      </div>
    </section>
  )
}

/* ═══════════════════════ КОМАНДА ═══════════════════════ */
const initials = (n: string) =>
  n
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

/** Статика в форме Sanity — чтобы у компонента был один тип данных. */
const FALLBACK_TEAM: TeamMember[] = staticTeam.map((m) => ({
  name: m.name,
  role: m.role,
  highlight: m.key,
  ...(m.practice ? { practice: m.practice } : {}),
}))

/**
 * Лицо на карточке: фото из Sanity, если оно загружено, иначе монограмма.
 *
 * Монограмма — не заглушка «пока не сделали», а осознанный дефолт:
 * она выглядит дороже плохого снимка и не врёт. Как только в студии
 * появится фото, карточка переключится сама.
 */
function TeamFace({ member }: { member: TeamMember }) {
  const src = teamPhoto(member.photoUrl, 480)
  const dark = member.highlight

  if (src) {
    return (
      <div className="aspect-square overflow-hidden rounded-[8px] bg-paper-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={member.name}
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`grid aspect-square place-items-center rounded-[8px] font-serif text-[clamp(24px,3vw,32px)] font-semibold tracking-[0.02em] ${
        dark
          ? 'bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]'
          : 'bg-paper-2 text-ink'
      }`}
    >
      {initials(member.name)}
    </div>
  )
}

export function Team({ members = FALLBACK_TEAM }: { members?: TeamMember[] }) {
  return (
    <section id="team" className="bg-paper py-[clamp(64px,9vw,128px)]">
      <div className="shell inner">
        <div className="mb-[clamp(34px,5vw,56px)] grid items-end gap-[clamp(28px,4vw,56px)] min-[1000px]:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-[58ch]">
            <Eyebrow>Команда · {members.length} фахівців</Eyebrow>
            <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1]">
              Справу веде адвокат, а не «відділ по роботі з клієнтами»
            </Reveal>
            <p className="lede mt-6 max-w-[52ch] text-slate">
              Клієнт знає ім&apos;я людини, яка відповідає за його справу, і має її прямий контакт.
              Приватний виконавець у команді — <strong>причина, чому четверте правило кредо взагалі можливе</strong>.
            </p>
          </div>
          <Photo
            name="corridor"
            ratio={1.34}
            sizes="(min-width: 1000px) 40vw, 92vw"
            className="rounded-[4px]"
          />
        </div>
        {/* Отдельные карточки, а не сетка gap-px по общей подложке.
            Сетка-«таблица» оставляет дыру на месте недостающих ячеек
            последнего ряда: десять человек не делятся на шесть колонок,
            и в правом нижнем углу зияло серое поле. Карточки на бумаге
            этого дефекта не имеют при любом числе людей. */}
        <div className="grid gap-[clamp(8px,1.1vw,14px)] grid-cols-2 min-[560px]:grid-cols-3 min-[820px]:grid-cols-4 min-[1060px]:grid-cols-5">
          {members.map((m) => (
            <article
              key={m.slug ?? m.name}
              className={`flex flex-col gap-3.5 rounded-[12px] p-[clamp(12px,1.4vw,18px)] ${
                m.highlight
                  ? 'bg-ink text-white shadow-[0_12px_30px_-18px_rgb(20_11_51/0.5)]'
                  : 'bg-white shadow-[inset_0_0_0_1px_var(--color-hair)]'
              }`}
            >
              <TeamFace member={m} />
              <div>
                <h3 className={`font-serif text-[15.5px] font-semibold leading-tight ${m.highlight ? '!text-white' : ''}`}>
                  {m.name}
                </h3>
                <p className={`m-0 mt-1 text-[12.5px] leading-snug ${m.highlight ? 'text-accent-soft' : 'text-slate'}`}>
                  {m.role}
                </p>
              </div>
              <PracticeNote text={m.practice} dark={m.highlight} />
            </article>
          ))}
        </div>
        {/* TODO(client): фото 10 адвокатов в retina. Пока монограммы — выглядит дороже фотостока. */}
      </div>
    </section>
  )
}

/* ═══════════════════════ БЛОГ ═══════════════════════ */
/**
 * Лента на главной.
 *
 * clickable управляется источником данных: пока статьи не в Sanity,
 * открывать нечего, и карточка ведёт на /blog, а не на /blog/[slug].
 * Иначе получаем 404 — ровно это и нашёл краулер внутренних ссылок.
 */
export function Journal({
  lang,
  posts = journal.map((a) => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, category: a.tag })),
  clickable = false,
}: {
  lang: string
  posts?: Post[]
  clickable?: boolean
}) {
  const prefix = lang === 'ua' ? '' : `/${lang}`
  const withMedia = needsMedia(posts)
  return (
    <section id="journal" className="py-[clamp(56px,8vw,112px)]">
      <div className="shell inner">
        <div className="mb-[clamp(28px,4vw,44px)]">
          <Reveal className="text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.05] tracking-[-0.02em]">Блог</Reveal>
        </div>
      </div>
      <div className="shell inner">
        {/* Та же карточка, что в ленте блога: обложка появится и здесь,
            и там одновременно. Ссылка без полного текста ведёт в ленту —
            в статике есть только анонсы. */}
        <ul className={POST_GRID}>
          {posts.map((a) => (
            <li key={a.slug}>
              <PostCard
                post={a}
                href={clickable ? `${prefix}/blog/${a.slug}` : `${prefix}/blog`}
                withMedia={withMedia}
                hideExcerpt
              />
            </li>
          ))}
        </ul>
        {/* Як «Читати всі новини» в Армади — під картками. */}
        <ArrowLink href={`${prefix}/blog`} className="mt-6 text-[15px] font-semibold">
          Читати всі статті
        </ArrowLink>
      </div>
    </section>
  )
}

/* ═══════════════════════ ФУТЕР ═══════════════════════
   Як в Армади: колонки «Практики» (у дві колонки), «Компанія»,
   «Контакти», «Месенджери», знизу — дрібний рядок із політикою,
   cookie і «Вгору». Практики — по дві перші послуги кожного напряму
   плюс сам напрям: живі посилання, а не перелік назв. */
export function Footer({ contacts = staticContacts, categories = staticCategories }: { contacts?: Contacts; categories?: Category[] }) {
  const links = categories.flatMap((c) => [
    { href: `/practices/${c.slug}`, label: c.title },
    /* дві перші короткі назви — довгі в дві колонки ламаються на 3 рядки */
    ...c.practices
      .filter((p) => p.title.length <= 30)
      .slice(0, 2)
      .map((p) => ({ href: `/practices/${c.slug}/${p.slug}`, label: p.title })),
  ])
  const H = 'm-0 mb-3.5 font-serif text-[17px] font-semibold text-white'
  const A = 'inline-flex min-h-11 items-center leading-snug transition-colors hover:text-white min-[760px]:min-h-0 min-[760px]:py-[5px]'

  return (
    <footer className="bg-ink-3 pb-7 pt-[clamp(44px,6vw,72px)] text-[14px] text-on-dark">
      <div className="shell inner">
        <a href="/" aria-label="АКТИВ, на головну" className="mb-8 inline-flex min-h-11 items-center">
          <Logo onDark />
        </a>
        <div className="grid gap-[30px] min-[760px]:grid-cols-2 min-[1000px]:grid-cols-[1.6fr_1fr_1fr_0.8fr]">
          <div>
            <h2 className={H}>Практики</h2>
            <ul className="m-0 list-none columns-1 gap-6 p-0 min-[480px]:columns-2">
              {links.map((l) => (
                <li key={l.href} className="break-inside-avoid">
                  <a href={l.href} className={A}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={H}>Компанія</h2>
            <ul className="m-0 grid list-none p-0">
              {[
                { h: '/about', l: 'Про компанію' },
                { h: '/team', l: 'Команда' },
                { h: '/career', l: 'Карʼєра' },
                { h: '/blog', l: 'Блог' },
              ].map((x) => (
                <li key={x.h}>
                  <a href={x.h} className={A}>
                    {x.l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className={H}>Контакти</h2>
            <ul className="m-0 grid list-none p-0">
              <li>
                <a href={contacts.phoneHref} className={A}>
                  {contacts.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${contacts.email}`} className={A}>
                  {contacts.email}
                </a>
              </li>
              <li className="py-2 leading-snug">{contacts.address}</li>
            </ul>
          </div>
          {contacts.messengers.length > 0 && (
            <div>
              <h2 className={H}>Месенджери</h2>
              <ul className="m-0 grid list-none p-0">
                {contacts.messengers.map((m) => (
                  <li key={m.href}>
                    <a href={m.href} className={A}>
                      {m.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* Нижній рядок: усе на одній базовій лінії. */}
        <div className="mt-[clamp(34px,4vw,52px)] flex flex-wrap items-center gap-x-[26px] gap-y-1 border-t border-on-dark-hair pt-[14px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-dark-2 [&>*]:inline-flex [&>*]:min-h-11 [&>*]:items-center">
          <span>© {new Date().getFullYear()} ЮК «АКТИВ»</span>
          <a href="/privacy" className="text-on-dark-2 underline decoration-on-dark-hair underline-offset-4 hover:text-white">
            Політика конфіденційності
          </a>
          {/* Відкликати згоду так само легко, як дати: банер відкривається знову звідси. */}
          <CookieSettingsLink className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-dark-2 underline decoration-on-dark-hair underline-offset-4 hover:text-white" />
          <a href="#top" className="group gap-2 text-on-dark-2 transition-colors hover:text-white min-[760px]:ml-auto">
            Вгору
            <Icon name="arrow" className="size-[13px] -rotate-90 transition-transform duration-200 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════ МОСТИК К КРЕДО ═══════════════════════
   Ставится в конце «Принципів роботи» на /about.

   Зачем: ценности и принципы клиента почти дословно совпадают с пятью
   правилами кредо на главной. Если оставить их как два независимых
   списка, посетитель прочитает одно и то же дважды и решит, что это
   вода. Связка превращает повтор в структуру: /about объясняет ПОЧЕМУ,
   главная даёт короткие проверяемые обещания. */
export function TrustBridge({
  kicker = staticAbout.bridgeKicker,
  text = staticAbout.bridgeText,
  link = staticAbout.bridgeLink,
}: {
  kicker?: string
  text?: string
  link?: string
}) {
  return (
    <div className="mt-[clamp(34px,5vw,60px)] grid gap-6 rounded-2xl bg-white/[0.045] p-[clamp(22px,3vw,34px)] shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] min-[820px]:grid-cols-[1fr_auto] min-[820px]:items-center">
      <div>
        <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.12em] text-accent-soft">
          {kicker}
        </p>
        <p className="m-0 mt-3 max-w-[54ch] font-serif text-[clamp(17px,2.2vw,22px)] font-normal leading-[1.32] text-white">
          {text}
        </p>
      </div>
      <ArrowLink href="/#credo" className="!text-accent-soft">
        {link}
      </ArrowLink>
    </div>
  )
}
