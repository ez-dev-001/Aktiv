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
import { DirectionPicker, type Direction } from './DirectionPicker'
import { preload } from 'react-dom'
import { PHOTOS, photoUrl } from '@/lib/photos'
import { PracticeExplorer } from './PracticeExplorer'
import { categoryPhoto } from '@/lib/sanity/image'
import { POST_GRID, PostCard, needsMedia } from '@/components/site/PostCard'

/* ═══════════════════════ ГЕРОЙ ═══════════════════════
   Первый экран — фотография во всю ширину и тёмная заливка поверх неё.

   Раньше здесь была чистая типографика на бумаге. Она честно работала,
   но у первого экрана не было ни одной точки, за которую цепляется
   глаз: заголовок, лид, две кнопки и таблица фактов — всё одного веса.
   Фотография задаёт масштаб и глубину, а текст, лёжа на её самой
   тёмной части, читается лучше, чем лежал на бумаге.

   Высота в svh, а не vh: на телефоне динамическая панель браузера
   иначе срезает кнопки, и это ловится только на живом устройстве. */
export function Hero({
  home = staticHome,
  directions = [],
  phone,
}: {
  home?: HomeContent
  /** напрями практики — капсула «Обрати напрям», що веде до блоку практик */
  directions?: Direction[]
  phone?: { label: string; href: string }
}) {
  /* Кадр усередині знака — найважливіша картинка першого екрана.
     Прелоад з високим пріоритетом: браузер почне його тягнути одразу з
     HTML, і коли ірис почне відкриватися (0.5 с), кадр уже буде. */
  preload(photoUrl(PHOTOS.tower, 900), { as: 'image', fetchPriority: 'high' })
  /* ── Первый экран: акцент на визуале ──
     Главное изображение — знак «АКТИВ» крупным планом (HeroMark):
     разомкнутое кольцо с кадром внутри и стрела насквозь. Фото на весь
     фон и поиск отсюда убраны по просьбе клиента: на первом экране один
     образ и одна мысль, без интерфейса и без лишнего текста. */
  return (
    /* Отрицательный отступ на высоту шапки: шапка липкая и стоит
       в потоке, поэтому без него фон начинался бы ПОД ней, а прозрачная
       шапка показывала бы бумагу. Подъём компенсирован верхним padding'ом. */
    <section
      id="hero"
      className="on-dark relative isolate mt-[calc(-1*(var(--hdr)+env(safe-area-inset-top,0px)))] overflow-hidden bg-ink text-on-dark"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-[1] bg-[radial-gradient(55%_65%_at_8%_0%,rgb(60_34_120/0.35),transparent_70%)]"
      />

      <div className="shell inner relative z-[2] flex min-h-[clamp(600px,92svh,940px)] flex-col pb-[clamp(28px,4vw,44px)] pt-[clamp(88px,12vw,140px)]">
        <div className="grid flex-1 items-center gap-[clamp(8px,3vw,48px)] min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="order-2 min-w-0 min-[1000px]:order-1">
          {/* ── SEO ──
              Великий слоган — дисплейний текст (<p>), а не заголовок:
              «Рішення без виконання — не результат» не каже Google, про
              що сторінка. H1 — у абзаці під слоганом. */}
          <p className="eyebrow">{home.heroEyebrow}</p>

          <p className="m-0 max-w-[15ch] font-serif text-[clamp(38px,5.8vw,74px)] font-normal leading-[1.0] tracking-[-0.024em] text-white [text-wrap:balance]">
            {home.heroTitle}{' '}
            <span className="italic text-accent-soft">{home.heroTitleAccent}</span>
          </p>

          {/* ── H1 як підзаголовок ──
              Один абзац під слоганом: спершу H1 (що робимо — словами,
              які шукають), далі тим самим кеглем, але тихіше — напрями.
              Це прийом «стендфьорсту» з журналів: заголовок і лід
              читаються як одне речення, а на першому екрані лишається
              ієрархія з трьох рівнів — слоган, підзаголовок, кнопки.
              Раніше H1 і довгий абзац стояли окремою смугою внизу й
              сперечалися зі слоганом. Тексти — Sanity → Головна. */}
          {(home.heroHeading || home.heroLede) && (
            <div className="mt-[clamp(18px,2.4vw,26px)] max-w-[44ch] text-[clamp(16px,1.45vw,19px)] leading-[1.55] [text-wrap:pretty]">
              {home.heroHeading && (
                <h1 className="m-0 inline font-sans text-[length:inherit] font-medium leading-[inherit] tracking-normal text-white">
                  {home.heroHeading.replace(/[.\s]+$/, '')}.
                </h1>
              )}{' '}
              {home.heroLede && <p className="m-0 inline text-white/60">{home.heroLede}</p>}
            </div>
          )}

          {/* Дві дії поруч: головна (форма) і другорядна (дзвінок).
              Телефон — не рядок тексту, а кнопка-контур з іконкою: так
              видно, що його можна натиснути. На вузькому телефоні обидві
              на всю ширину — великі цілі під великий палець. */}
          <div className="mt-[clamp(24px,3.2vw,36px)] flex flex-wrap items-center gap-3">
            <ButtonLink href="#contact" arrow className="max-[479px]:w-full max-[479px]:justify-center">
              {home.heroCtaPrimary}
            </ButtonLink>
            {phone && (
              <a
                href={phone.href}
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full px-5 font-sans text-[15px] font-medium tabular-nums text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22)] transition-[background-color,box-shadow] duration-200 hover:bg-white/[0.06] hover:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.45)] max-[479px]:w-full"
              >
                <Icon name="phone" className="size-[17px] shrink-0 text-accent-soft" />
                {phone.label}
              </a>
            )}
          </div>

          {/* «Обрати напрям»: чотири напрями однією капсулою. Натиск
              плавно везе до блоку практик і відкриває вибраний напрям.
              Заміняє колишній рядок із назвами напрямів — тексту стільки ж,
              але тепер він працює. Підпис — Sanity → «Друга кнопка». */}
          {directions.length > 0 && (
            <div className="mt-[clamp(22px,3vw,32px)] max-w-[560px]">
              <DirectionPicker label={home.heroCtaSecondary} items={directions} />
            </div>
          )}
        </div>

        {/* Знак чуть выходит за правый край сетки. Фон секции под ним —
            ровно #140b33, как края видео: подсветка вынесена влево вверх,
            а свечение за знаком уже есть в самом ролике. */}
        <div className="order-1 mx-auto w-[84%] min-w-0 min-[600px]:w-[70%] min-[1000px]:order-2 min-[1000px]:-mr-[14%] min-[1000px]:ml-0 min-[1000px]:w-auto">
          <HeroMark />
        </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════ КОМАНДА · ЦИТАТА ═══════════════════════
   Блок сразу под первым экраном, как у armada.law: слово керуючого
   партнера, сколько людей в команде и кнопка «Уся команда». Полная
   сетка карточек живёт на /team, здесь она дублировала бы страницу.

   Цитаты в Sanity может ещё не быть. Придумывать её за партнера
   нельзя, поэтому до заполнения на тестовом сайте видна честная
   заглушка с пометкой, а на боевом блок цитаты не показывается,
   и остаются заголовок с текстом. */
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
  /* Без цитати блок не показує заглушку «Тут буде…» ніде, навіть на
     тестовому сайті: її бачив клієнт, і вона читалась як недоробка.
     Замість неї — заголовок блоку, а цитата з'явиться сама, щойно її
     впишуть у Sanity → Головна → «Команда». */
  const quote = home.teamQuote.trim()
  const hasQuote = !!quote
  const faces = members.filter((m) => m.photoUrl && m.name !== author?.name).slice(0, 5)
  const href = lang === 'ua' ? '/team' : `/${lang}/team`
  /* Портретный кроп 4:5 от верха кадра: teamPhoto режет в квадрат по
     центру, и на высокой карточке голова уходила бы за край. */
  const portrait = author?.photoUrl ? `${author.photoUrl}?w=760&h=950&fit=crop&crop=top&auto=format&q=80` : undefined
  /* Квадратний кроп для кружка на телефоні й планшеті. */
  const avatar = author?.photoUrl ? `${author.photoUrl}?w=320&h=320&fit=crop&crop=top&auto=format&q=80` : undefined

  const quoteBlock = hasQuote ? (
    <figure className="m-0">
      <span aria-hidden="true" className="block font-serif text-[64px] leading-[0.6] text-accent min-[920px]:text-[88px]">“</span>
      <blockquote className="m-0 mt-3 max-w-[32ch] font-serif text-[clamp(22px,2.8vw,32px)] font-normal leading-[1.3] text-ink">
        {quote}
      </blockquote>
    </figure>
  ) : (
    <Reveal className="max-w-[20ch] text-[clamp(28px,4.2vw,46px)] leading-[1.1]">{home.teamTitle}</Reveal>
  )

  const teamFacts = (
    <div className="mt-[clamp(28px,3.6vw,44px)] grid gap-6 border-t border-hair pt-[clamp(22px,3vw,32px)] min-[640px]:grid-cols-[auto_1fr] min-[640px]:items-start min-[640px]:gap-10">
      <p className="m-0 font-serif text-[clamp(44px,5.4vw,60px)] font-semibold leading-none text-ink">
        {members.length}
        <span className="mt-2 block font-sans text-[13.5px] font-normal text-slate">фахівців у команді</span>
      </p>
      <div className="min-[640px]:self-center">
        {/* Мінімалізм: замість абзацу про команду — число, обличчя й кнопка. */}
        <div className="flex flex-wrap items-center gap-5">
          <ButtonLink href={href} arrow>
            Уся команда
          </ButtonLink>
          {faces.length > 0 && (
            <div className="flex -space-x-3" aria-hidden="true">
              {faces.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.slug ?? m.name}
                  src={teamPhoto(m.photoUrl, 120)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-11 rounded-full object-cover ring-[3px] ring-paper"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <section id="team" aria-label="Команда" className="border-t border-hair bg-paper py-[clamp(64px,9vw,128px)]">
      {portrait && author ? (
        /* Акцент на людині: великий портрет керуючого партнера поруч зі
           словом від нього. Саме тут, а не на першому екрані: у блоці
           «Команда» обличчя пояснює, хто веде справи, а на першому екрані
           воно лише конкурувало б із заголовком. */
        <div className="shell inner grid items-center gap-[clamp(32px,5vw,80px)] min-[920px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          {/* Велика картка — лише на десктопі. На телефоні й планшеті її
              заміняє кружок поруч з іменем (нижче), щоб портрет не займав
              увесь екран і не відсував цитату. */}
          <figure className="relative isolate m-0 hidden w-full max-w-[460px] min-[920px]:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-paper-2 shadow-[0_40px_80px_-44px_rgb(20_11_51/0.55)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portrait} alt={author.name} loading="lazy" decoding="async" className="size-full object-cover object-top" />
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,transparent,rgb(20_11_51/0.82))]" />
              <figcaption className="absolute inset-x-0 bottom-0 p-[clamp(18px,2.4vw,26px)]">
                <span className="block font-serif text-[clamp(20px,2.3vw,25px)] font-semibold leading-tight text-white">{author.name}</span>
                {author.role && <span className="mt-1 block text-[13.5px] text-accent-soft">{author.role}</span>}
              </figcaption>
            </div>
            {/* Малиновий кут за портретом: та сама рамка, що в знаку, без зайвого декору. */}
            <span aria-hidden="true" className="absolute -bottom-3 -left-3 -z-[1] h-2/5 w-2/5 rounded-bl-[24px] border-b-[3px] border-l-[3px] border-accent" />
          </figure>
          <div className="min-w-0">
            <Eyebrow>Команда</Eyebrow>
            {/* Телефон і планшет: портрет у кружку, обведений розімкненим
                кільцем — тим самим, що в знаку «АКТИВ». */}
            <div className="mb-[clamp(22px,4vw,32px)] flex items-center gap-[clamp(16px,3.4vw,24px)] min-[920px]:hidden">
              <div className="relative size-[104px] shrink-0 min-[600px]:size-[128px]">
                <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                  <path
                    d="M94.2 66.1 A 47 47 0 1 1 94.2 33.9"
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
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
            {quoteBlock}
            {teamFacts}
          </div>
        </div>
      ) : (
        /* Без портрета: дві колонки, щоб блок не тримався за лівий край.
           Ліворуч — велике число й кнопка, праворуч — слово партнера. */
        <div className="shell inner grid gap-[clamp(36px,6vw,96px)] min-[920px]:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] min-[920px]:items-center">
          <div className="min-w-0">
            <Eyebrow>Команда</Eyebrow>
            <p className="m-0 font-serif text-[clamp(72px,10vw,132px)] font-semibold leading-[0.9] tracking-[-0.04em] text-ink">
              {members.length}
            </p>
            <p className="m-0 mt-3 text-[15px] text-slate">фахівців у команді</p>
            <div className="mt-[clamp(24px,3vw,36px)] flex flex-wrap items-center gap-5">
              <ButtonLink href={href} arrow>
                Уся команда
              </ButtonLink>
              {faces.length > 0 && (
                <div className="flex -space-x-3" aria-hidden="true">
                  {faces.map((m) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={m.slug ?? m.name}
                      src={teamPhoto(m.photoUrl, 120)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="size-11 rounded-full object-cover ring-[3px] ring-paper"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0 border-hair min-[920px]:border-l min-[920px]:pl-[clamp(36px,5vw,80px)]">
            {quoteBlock}
            {hasQuote && author && (
              <p className="m-0 mt-6 text-[15px] text-ink">
                {author.name}
                {author.role && <span className="text-slate"> · {author.role}</span>}
              </p>
            )}
          </div>
        </div>
      )}
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

/* ═══════════════════════ КРЕДО ═══════════════════════ */
export function Credo({ home = staticHome, mission }: { home?: HomeContent; mission: { statement: string; text: string } }) {
  /* ── Місія ──
     Раньше блок назывался «Наше кредо» и начинался с пяти правил.
     Клиент попросил місію: теперь первым идёт сама місія фирмы — тем же
     текстом, что на странице «Про компанію» (один источник, Sanity →
     «Про компанію»), а пять правил стоят ниже как ответ на «и как вы это
     делаете». Надзаголовок зашит в код: в студии в этом поле осталось
     старое «Наше кредо», и блок не должен зависеть от того, исправили его
     или нет. */
  return (
    <section id="credo" className="on-dark bg-ink py-[clamp(64px,9vw,128px)] text-on-dark">
      <div className="shell inner">
        {/* Мінімалізм: без фото — лише формулювання місії й посилання. */}
        <div className="mb-[clamp(36px,5vw,64px)] flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div className="max-w-[60ch]">
            <Eyebrow>Місія</Eyebrow>
            <Reveal className="max-w-[26ch] text-[clamp(26px,4.4vw,44px)] leading-[1.12] !text-white">
              {mission.statement}
            </Reveal>
          </div>
          <ArrowLink href="/about" className="text-accent-soft">
            Про компанію
          </ArrowLink>
        </div>

        {/* Мінімалізм: п'ять правил — лише формулюваннями, без пояснень.
            Розгорнуто вони живуть на сторінці «Про компанію». */}
        <p className="m-0 mb-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-soft">Як ми це робимо</p>
        {/* Колонок рівно стільки, скільки правил: при трьох-чотирьох
            правилах у сітці на п'ять лишались порожні клітинки кольору
            лінії. Непарна остання плитка на планшеті — на всю ширину. */}
        <ol
          className={`m-0 grid list-none gap-px overflow-hidden rounded-[14px] bg-on-dark-hair p-0 min-[700px]:grid-cols-2 [&>li:last-child:nth-child(odd)]:min-[700px]:col-span-2 ${
            home.credo.length === 3
              ? 'min-[960px]:grid-cols-3 [&>li:last-child:nth-child(odd)]:min-[960px]:col-span-1'
              : home.credo.length === 4
                ? 'min-[1100px]:grid-cols-4'
                : 'min-[1100px]:grid-cols-5 [&>li:last-child:nth-child(odd)]:min-[1100px]:col-span-1'
          }`}
        >
          {home.credo.map((t, i) => (
            <li key={t.title} className="flex flex-col gap-5 bg-ink p-[clamp(20px,2.4vw,30px)] transition-colors duration-300 hover:bg-ink-2">
              <span className="font-serif text-[clamp(28px,2.6vw,34px)] font-semibold leading-none tabular-nums text-accent">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-serif text-[clamp(17px,1.7vw,20px)] font-semibold leading-[1.22] text-white">{t.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ═══════════════════════ ПРАКТИКИ ═══════════════════════ */
export function Practices({ categories = staticCategories }: { categories?: Category[] }) {
  const groups = categories.map((c) => ({
    slug: c.slug,
    title: c.title,
    icon: c.icon,
    excerpt: c.excerpt,
    ...(categoryPhoto(c) ? { photo: categoryPhoto(c) } : {}),
    practices: c.practices.map((p) => ({ slug: p.slug, title: p.title })),
  }))
  const total = categories.reduce((n, c) => n + c.practices.length, 0)

  return (
    <section id="practices" className="scroll-mt-[var(--hdr)] bg-paper py-[clamp(64px,9vw,128px)]">
      <div className="shell inner">
        <div className="mb-[clamp(30px,4.4vw,48px)]">
          <div>
            <Eyebrow>Практики · {total} послуг</Eyebrow>
            <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1]">З чим ми допомагаємо</Reveal>
          </div>
        </div>
        <PracticeExplorer groups={groups} />
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
    <section id="journal" className="py-[clamp(64px,9vw,128px)]">
      <div className="shell inner">
        <div className="mb-[clamp(34px,5vw,56px)] flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div className="max-w-[58ch]">
            <Eyebrow>Блог</Eyebrow>
            <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1]">
              Розбираємо рішення судів, поки вони ще мають значення
            </Reveal>
          </div>
          <ArrowLink href={`${prefix}/blog`} className="text-accent-ink">
            Усі статті
          </ArrowLink>
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
      </div>
    </section>
  )
}

/* ═══════════════════════ ФУТЕР ═══════════════════════ */
export function Footer({ contacts = staticContacts }: { contacts?: Contacts }) {
  return (
    <footer className="bg-ink-3 pb-[34px] pt-[clamp(48px,6vw,72px)] text-[14.5px] text-on-dark">
      <div className="shell inner">
        <div className="grid gap-[34px] min-[760px]:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            {/* Тоже на главную, а не на якорь — см. комментарий в шапке. */}
            <a href="/" aria-label="АКТИВ, на головну" className="inline-flex min-h-11 items-center">
              <Logo onDark />
            </a>
            <p className="mt-4 max-w-[38ch] text-sm leading-relaxed">
              Юридична компанія «АКТИВ» — судова практика, ліквідація та банкрутство, нерухомість,
              корпоративне й податкове право. Київ, з 2007 року.
            </p>
          </div>
          <div>
            <h2 className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white">Практики</h2>
            <ul className="grid list-none gap-1 p-0">
              {staticCategories.map((c) => (
                <li key={c.slug}>
                  <a href={`/practices/${c.slug}`} className="inline-flex min-h-11 items-center transition-colors hover:text-accent-soft min-[760px]:min-h-8">
                    {c.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white">Компанія</h2>
            <ul className="grid list-none gap-1 p-0">
              {[
                { h: '/about', l: 'Про компанію' },
                { h: '/#credo', l: 'Місія' },
                { h: '/team', l: 'Команда' },
                { h: '/career', l: 'Карʼєра' },
                { h: '/blog', l: 'Блог' },
                { h: '/#contact', l: 'Контакти' },
              ].map((x) => (
                <li key={x.h}>
                  <a href={x.h} className="inline-flex min-h-11 items-center transition-colors hover:text-accent-soft min-[760px]:min-h-8">
                    {x.l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Нижній рядок: усе на одній базовій лінії. Раніше посилання
            мали різну висоту (44 px у кнопки cookie, 0 у тексту), і
            рядок «стрибав»; «Вгору» було іншим шрифтом і кеглем. */}
        <div className="mt-[clamp(34px,4vw,52px)] flex flex-wrap items-center gap-x-[26px] gap-y-1 border-t border-on-dark-hair pt-[14px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-dark-2 [&>*]:inline-flex [&>*]:min-h-11 [&>*]:items-center">
          <span>© {new Date().getFullYear()} ЮК «АКТИВ»</span>
          <span>{contacts.address}</span>
          <span>{contacts.phone}</span>
          {/* Отозвать согласие должно быть так же легко, как его дать:
              баннер открывается снова отсюда, сразу на настройках. */}
          <a href="/privacy" className="text-on-dark-2 underline decoration-on-dark-hair underline-offset-4 hover:text-white">
            Політика конфіденційності
          </a>
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
