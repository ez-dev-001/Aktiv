import { categories as staticCategories, contacts as staticContacts, figures as staticFigures, formatPrice, journal, team as staticTeam, type Category, type PriceSpec } from '@/lib/content'
import { staticAbout, staticHome, teamPhoto, type Contacts, type Figure, type HomeContent, type Post, type TeamMember } from '@/lib/sanity/content'
import { Icon } from '@/components/site/Icon'
import { ArrowLink, ButtonLink, Eyebrow } from '@/components/ui/Button'
import { Counter } from '@/components/ui/Counter'
import { Reveal } from '@/components/ui/Reveal'
import { Logo } from '@/components/site/Logo'
import { Photo, PhotoBand } from '@/components/site/Photo'
import { Bold } from '@/components/ui/Bold'
import { CookieSettingsLink } from '@/components/site/CookieConsent'
import { PracticeCards } from './PracticeCards'
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
export function Hero({ home = staticHome }: { home?: HomeContent }) {
  return (
    /* Отрицательный отступ на высоту шапки: шапка липкая и стоит
       в потоке, поэтому без него фотография начиналась бы ПОД ней,
       а прозрачная шапка показывала бы бумагу вместо кадра.
       Подъём компенсирован верхним padding'ом контента. */
    <section
      id="hero"
      className="on-dark relative isolate mt-[calc(-1*(var(--hdr)+env(safe-area-inset-top,0px)))] overflow-hidden bg-ink text-on-dark"
    >
      <Photo name="hero" fill priority tone="deep" sizes="100vw" imgClassName="object-[50%_32%]" />

      <div className="shell inner relative z-[2] flex min-h-[clamp(520px,86svh,880px)] flex-col justify-end pb-[clamp(38px,6vw,76px)] pt-[clamp(88px,16vw,168px)]">
        <Eyebrow>{home.heroEyebrow}</Eyebrow>

        <Reveal as="h1" className="max-w-[16ch] text-[clamp(35px,7.6vw,76px)] leading-[1.02] !text-white">
          {home.heroTitle}{' '}
          <span className="font-normal italic text-accent-soft">{home.heroTitleAccent}</span>
        </Reveal>

        <p className="lede mt-6 max-w-[50ch] text-white/75">
          <Bold text={home.heroLede} onDark />
        </p>

        <div className="mt-[clamp(26px,3.6vw,38px)] flex flex-wrap gap-2.5">
          <ButtonLink href="#contact" arrow>
            {home.heroCtaPrimary}
          </ButtonLink>
          <ButtonLink href="#prices" variant="ghostDark">
            {home.heroCtaSecondary}
          </ButtonLink>
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

/* ═══════════════════════ ТРИ ОБЕЩАНИЯ ═══════════════════════
   Съехали из правой колонки героя. Там они конкурировали с заголовком
   за первый взгляд; здесь — первое, что читается после первого экрана,
   и каждое из трёх проверяется на первой же встрече. */
export function Promise({ items = staticHome.promises }: { items?: HomeContent['promises'] }) {
  return (
    <div className="border-b border-hair bg-paper py-[clamp(34px,5vw,60px)]">
      <div className="shell inner">
        <dl className="grid gap-[clamp(22px,3vw,44px)] min-[760px]:grid-cols-3">
          {items.map((x) => (
            <div key={x.kicker} className="grid gap-[5px] border-t-2 border-ink pt-[18px]">
              <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-2">{x.kicker}</dt>
              <dd className="m-0 font-serif text-[clamp(18px,2.2vw,21px)] font-semibold leading-tight text-ink">
                {x.answer}
                <span className="mt-1.5 block max-w-[34ch] font-sans text-[13.5px] font-light leading-snug tracking-normal text-slate">
                  {x.note}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

/* ═══════════════════════ КРЕДО ═══════════════════════ */
export function Credo({ home = staticHome }: { home?: HomeContent }) {
  return (
    <section id="credo" className="on-dark bg-ink py-[clamp(64px,9vw,128px)] text-on-dark">
      <div className="shell inner">
        {/* Заголовок и фотография в одной строке: тёмный блок без кадра
            рядом с фотографическим героем выглядел как чужая страница. */}
        <div className="mb-[clamp(34px,5vw,56px)] grid items-end gap-[clamp(28px,4vw,56px)] min-[1000px]:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-[58ch]">
            <Eyebrow>{home.credoEyebrow}</Eyebrow>
            <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1] !text-white">
              {home.credoTitle}
            </Reveal>
            <p className="lede mt-6 max-w-[52ch] text-on-dark">{home.credoLede}</p>
          </div>
          <Photo
            name="meeting"
            ratio={1.34}
            tone="wash"
            sizes="(min-width: 1000px) 40vw, 92vw"
            className="rounded-[4px] shadow-[0_30px_60px_-34px_rgb(0_0_0/0.75)]"
          />
        </div>

        <div className="grid">
          {home.credo.map((t, i) => (
            <div
              key={t.title}
              /* До 860px это две колонки и две строки: номер слева, заголовок
                 и текст справа друг под другом. Без явного col-start третий
                 ребёнок уезжал во вторую строку ПЕРВОЙ колонки — то есть
                 абзац вёрстся шириной 52px и рвался. */
              className={`grid items-start gap-x-3 gap-y-2.5 border-t border-on-dark-hair py-[clamp(26px,3.6vw,40px)] grid-cols-[38px_minmax(0,1fr)] sm:grid-cols-[52px_minmax(0,1fr)] sm:gap-x-[clamp(14px,2.5vw,34px)] min-[860px]:grid-cols-[52px_minmax(0,1.05fr)_minmax(0,1fr)] min-[860px]:gap-y-0 ${
                i === home.credo.length - 1 ? 'border-b' : ''
              }`}
            >
              <span className="pt-[0.5em] font-mono text-[11px] tracking-[0.1em] text-accent-soft">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="col-start-2 max-w-[20ch] text-[clamp(20px,2.9vw,31px)] leading-[1.16] !text-white">
                {t.title}
              </h3>
              <p className="col-start-2 m-0 max-w-[46ch] text-[15.5px] leading-relaxed text-on-dark min-[860px]:col-start-3 min-[860px]:row-start-1">
                <Bold text={t.text} onDark />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════ ШЛЯХ СПРАВИ ═══════════════════════ */
export function CasePath({ home = staticHome }: { home?: HomeContent }) {
  return (
    <section id="path" className="py-[clamp(64px,9vw,128px)]">
      <div className="shell inner">
        <div className="mb-[clamp(34px,5vw,56px)] max-w-[58ch]">
          <Eyebrow>{home.pathEyebrow}</Eyebrow>
          <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1]">{home.pathTitle}</Reveal>
        </div>
        {/* Колонок столько, сколько станций: при трёх записях жёсткие
            grid-cols-4 оставляли справа пустую четверть. */}
        <div
          className="grid min-[820px]:border-t min-[820px]:border-hair min-[820px]:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]"
          style={{ ['--cols' as string]: home.path.length }}
        >
          {home.path.map((s, i) => (
            <div key={s.title} className="relative border-t border-hair pb-[26px] pr-[22px] pt-[26px] min-[820px]:border-t-0 min-[820px]:pt-[30px]">
              <span className="absolute -top-[5px] left-0 size-[9px] rounded-full bg-accent min-[820px]:-top-[4.5px]" />
              <span className="mb-2.5 block font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-2">
                Станція {String(i + 1).padStart(2, '0')}
              </span>
              <h4 className="mb-2 text-[17.5px] leading-snug">{s.title}</h4>
              <p className="m-0 max-w-[30ch] text-[14.5px] leading-snug text-slate">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════ ПОЛОСА-ЦИТАТА ═══════════════════════
   Единственное место на сайте, где фотография работает одна, без
   соседнего блока текста. Стоит между «шляхом справи» и практиками —
   там, где страница переключается с обещаний на список услуг, и
   читателю нужен вдох.

   Фраза внутри — не лозунг, а четвёртое правило кредо в одну строку.
   Картинка без утверждения была бы просто стоком. */
export function Manifesto({ home = staticHome }: { home?: HomeContent }) {
  return (
    <PhotoBand name="documents" tone="deep" minHeight="clamp(300px,46vw,520px)">
      <div className="shell inner on-dark flex w-full flex-col justify-center py-[clamp(40px,6vw,72px)]">
        <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.17em] text-accent-soft">
          {home.manifestoKicker}
        </p>
        <Reveal
          as="p"
          className="m-0 mt-5 max-w-[18ch] font-serif text-[clamp(26px,5.2vw,52px)] font-normal leading-[1.08] tracking-[-0.022em] !text-white"
        >
          {home.manifestoQuote}
        </Reveal>
        <p className="mt-6 max-w-[46ch] text-[15.5px] leading-relaxed text-white/72">
          {home.manifestoNote}
        </p>
      </div>
    </PhotoBand>
  )
}

/* ═══════════════════════ ПРАКТИКИ ═══════════════════════ */
export function Practices({ categories = staticCategories }: { categories?: Category[] }) {
  return (
    <section id="practices" className="bg-paper py-[clamp(64px,9vw,128px)]">
      <div className="shell inner">
        <div className="mb-[clamp(34px,5vw,56px)] max-w-[58ch]">
          <Eyebrow>Практики · {categories.reduce((n, c) => n + c.practices.length, 0)} напрямів</Eyebrow>
          <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1]">
            Чотири напрями, в яких ми працюємо щодня
          </Reveal>
          <p className="lede mt-6 max-w-[52ch] text-slate">
            Не «повний спектр юридичних послуг». Чотири блоки, у кожному — практика, яку ведуть
            конкретні адвокати з команди.
          </p>
        </div>
        <PracticeCards categories={categories} />
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
            </article>
          ))}
        </div>
        {/* TODO(client): фото 10 адвокатов в retina. Пока монограммы — выглядит дороже фотостока. */}
      </div>
    </section>
  )
}

/* ═══════════════════════ ПРАЙС ═══════════════════════ */
export function PriceTable({ rows }: { rows: { service: string; price: PriceSpec }[] }) {
  return (
    <div className="border-t border-hair">
      {rows.map((r) => {
        const p = formatPrice(r.price)
        return (
          <div key={r.service} className="grid grid-cols-1 items-baseline gap-x-5 gap-y-1.5 border-b border-hair-soft py-4 min-[420px]:grid-cols-[1fr_auto]">
            <span className="text-[15.5px] font-normal leading-snug text-ink">{r.service}</span>
            <span className="font-mono text-[13.5px] tabular-nums text-accent-ink min-[420px]:whitespace-nowrap">{p}</span>
            {r.price.note && (
              <span className="col-span-full font-mono text-[10px] uppercase tracking-[0.1em] text-slate-2">
                {r.price.note}
              </span>
            )}
          </div>
        )
      })}
    </div>
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
        <div className="mb-[clamp(34px,5vw,56px)] max-w-[58ch]">
          <Eyebrow>Блог</Eyebrow>
          <Reveal className="text-[clamp(26px,4.6vw,44px)] leading-[1.1]">
            Розбираємо рішення судів, поки вони ще мають значення
          </Reveal>
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
              <Logo />
            </a>
            <p className="mt-4 max-w-[38ch] text-sm leading-relaxed">
              Юридична компанія «АКТИВ» — судова практика, ліквідація та банкрутство, нерухомість,
              корпоративне й податкове право. Київ, з 2007 року.
            </p>
          </div>
          <div>
            <h5 className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white">Практики</h5>
            <ul className="grid list-none gap-2.5 p-0">
              {staticCategories.map((c) => (
                <li key={c.slug}>
                  <a href={`/practices/${c.slug}`} className="inline-flex min-h-11 items-center hover:text-accent-soft">
                    {c.title}
                  </a>
                </li>
              ))}
              <li>
                <a href="#prices" className="inline-flex min-h-11 items-center hover:text-accent-soft">
                  Вартість послуг
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.12em] text-white">Компанія</h5>
            <ul className="grid list-none gap-2.5 p-0">
              {[
                { h: '/about', l: 'Про компанію' },
                { h: '/#credo', l: 'Кредо' },
                { h: '/team', l: 'Команда' },
                { h: '/blog', l: 'Блог' },
                { h: '/#contact', l: 'Контакти' },
              ].map((x) => (
                <li key={x.h}>
                  <a href={x.h} className="inline-flex min-h-11 items-center hover:text-accent-soft">
                    {x.l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-[clamp(34px,4vw,52px)] flex flex-wrap gap-x-[26px] gap-y-2.5 border-t border-on-dark-hair pt-[22px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-dark-2">
          <span>© {new Date().getFullYear()} ЮК «АКТИВ»</span>
          <span>{contacts.address}</span>
          <span>{contacts.phone}</span>
          {/* Отозвать согласие должно быть так же легко, как его дать:
              баннер открывается снова отсюда, сразу на настройках. */}
          <CookieSettingsLink className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-on-dark-2 underline decoration-on-dark-hair underline-offset-4 hover:text-white" />
          <ArrowLink href="#top" className="min-h-11 !text-on-dark-2">
            Вгору
          </ArrowLink>
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
