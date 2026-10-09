import { trustPlaceholders } from '@/lib/content'
import { getTeam, getTrustBlock, type ClientLogo, type TrustBlock } from '@/lib/sanity/content'
import { ArrowLink, Eyebrow } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Icon } from '@/components/site/Icon'
import { ClientTicker } from './ClientTicker'

/**
 * «Нам довіряють».
 *
 * ── Чому не цифри ──
 * Раніше головними тут були чотири числа (2007, 300+, 400+, 150 млн ₴).
 * Такі цифри є в кожної фірми, і відвідувач їх проскакує: їх неможливо
 * перевірити, і вони нічого не кажуть про його справу. Посібники з
 * довіри до сайтів юрфірм (ABA, Knapsack, Geeks for Growth) радять
 * натомість: конкретні докази, справжніх людей, прозорість щодо ціни
 * й процесу, логотипи клієнтів і відгуки. Тому тепер блок — три
 * «докази» з обличчям і підходом, а цифри лишились дрібним рядком
 * унизу, для тих, хто їх шукає.
 *
 * Чого тут немає навмисно: вигаданих відгуків. Блок відгуків варто
 * додати, коли будуть справжні (з іменем або хоча б з Google).
 *
 * Блок стоит на двух опорах, и обе редактируются из Sanity.
 *
 * Первая — бегущая лента клиентов (siteSettings → «Клієнти в стрічці»).
 * Порядок в массиве = порядок в ленте, скорость подстраивается под длину
 * списка сама, логотип не обязателен: без файла в ленте встаёт название.
 *
 * Вторая — факты самой фирмы. Они не уезжают, когда лента заполнена:
 * дата основания и число доведённых до исполнения дел проверяются по
 * реестрам, и это более твёрдый довод, чем чужой логотип.
 *
 * ── Почему у каждой записи галочка разрешения ──
 * У «Армади» здесь стена из 24 логотипов, и у них это работает: практика
 * корпоративная, разрешения собраны. Слепо копировать механику нельзя.
 * Чужая торговая марка без письменного согласия владельца — претензия,
 * а не социальное доказательство, особенно для юридической фирмы.
 * И половина клиентов «Актив» — физлица в делах о ликвидации, ВЛК и
 * семейных спорах, где анонимность входит в услугу. Поэтому фильтр
 * `permission == true` стоит в самом GROQ: запись без галочки не
 * доезжает даже до этого компонента.
 *
 * Пока Sanity не подключён, лента показывает служебные заглушки с явной
 * подписью — чтобы движение можно было увидеть и оценить, не выдавая
 * выдуманные имена за клиентов.
 */

export type { ClientLogo }


/**
 * ── Почему блок ходит за данными сам ──
 * Раньше список клиентов приходил пропсом. Главная его передавала,
 * а «Про компанію» и страницы напрямов вызывали `<TrustedBy />` без
 * аргументов — и там лента жила отдельной жизнью: на главной ехали
 * настоящие клиенты из Sanity, на других страницах пусто или
 * служебные заглушки. Один и тот же блок показывал разное на разных
 * страницах, и это выглядело как три независимых блока с одним
 * заголовком.
 *
 * Пропс это не лечит: его снова забудут на следующей новой странице.
 * Поэтому блок серверный и запрашивает клиентов сам — забыть передать
 * теперь физически нечего. Кеш у запроса общий (тег siteSettings),
 * так что три блока на трёх страницах — это один запрос, а не три.
 *
 * Пропс clients оставлен только как явная подмена: он понадобится,
 * если однажды на странице напряма захочется показать не всю ленту, а
 * клиентов этого напряма.
 */
export async function TrustedBy({
  lang = 'ua',
  block,
}: {
  lang?: string
  block?: TrustBlock
}) {
  const [trust, team] = await Promise.all([block ? null : getTrustBlock(lang), getTeam(lang)])
  const t = block ?? trust!.data
  const hasClients = t.clients.length > 0
  /* ── Когда показывать заглушки ──
     Локально лента всегда едет, чтобы было что смотреть и настраивать.
     В проде пустой список даёт честный пропуск: выдуманные имена на
     живом сайте юрфирмы недопустимы. */
  const preview = !hasClients && process.env.NODE_ENV !== 'production'
  const row: ClientLogo[] = hasClients ? t.clients : preview ? trustPlaceholders : []

  /* Приватний виконавець — головний доказ: його обличчя й ім'я з Sanity
     (Команда → роль «Приватний виконавець»). Немає такої людини —
     картка лишається, просто без портрета. */
  const executor = team.data.find((m) => /виконав/i.test(m.role))
  const face = executor?.photoUrl ? `${executor.photoUrl}?w=240&h=240&fit=crop&crop=top&auto=format&q=80` : undefined

  /* Старий заголовок «Цифри, які можна перевірити» в Sanity говорить
     про цифри, яких тут більше немає. Поки в студії стоїть саме він —
     показуємо новий; будь-який інший текст зі студії — як є. */
  const heading = !t.heading || /^цифри/i.test(t.heading) ? DEFAULT_HEADING : t.heading
  const facts = t.facts.map((f) => (/^(19|20)\d{2}$/.test(f.value.trim()) ? `з ${f.value.trim()} року` : `${f.value} ${f.label}`))

  return (
    <section id="trust" className="relative isolate overflow-hidden bg-paper-2 py-[clamp(64px,9vw,120px)]">
      <div className="shell inner">
        <div className="mb-[clamp(28px,4vw,48px)] max-w-[58ch]">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <Reveal className="text-[clamp(28px,4.4vw,48px)] leading-[1.06]">{heading}</Reveal>
        </div>

        {/* ── Три докази, бенто ──
            Ліворуч велика темна картка: приватний виконавець з обличчям
            і підписом — те, чого немає в інших фірм. Праворуч дві світлі:
            безкоштовна чесна консультація і ціна без передоплати —
            прозорість щодо грошей, яку радять ставити на видне місце. */}
        <div className="grid gap-[clamp(10px,1.2vw,16px)] min-[900px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] min-[900px]:grid-rows-2">
          <article className="trust-card relative isolate flex min-h-[clamp(340px,36vw,460px)] flex-col justify-between gap-10 overflow-hidden rounded-[24px] bg-ink p-[clamp(24px,3.2vw,44px)] text-white shadow-[0_40px_80px_-48px_rgb(20_11_51/0.7)] min-[900px]:row-span-2">
            <TrustMark />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-soft">Виконання рішень</span>
            <div>
              <h3 className="m-0 max-w-[16ch] font-serif text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.015em] !text-white">
                Приватний виконавець — <span className="font-normal italic text-accent-soft">у нашій команді</span>
              </h3>
              <p className="m-0 mt-4 max-w-[44ch] text-[clamp(15px,1.3vw,16.5px)] leading-[1.6] text-white/70">
                Виграну справу не передаємо в чергу державної виконавчої служби. Стягнення веде наш
                виконавець — і рішення суду стає грошима чи майном, а не папером.
              </p>
              {executor && (
                <div className="mt-7 flex items-center gap-4">
                  {face && (
                    <span className="relative size-14 shrink-0">
                      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                        <path d="M94.2 66.1 A 47 47 0 1 1 94.2 33.9" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" />
                      </svg>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={face} alt={executor.name} loading="lazy" decoding="async" className="absolute inset-[11%] size-[78%] rounded-full bg-white/10 object-cover object-top" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block font-serif text-[17px] font-semibold leading-tight text-white">{executor.name}</span>
                    <span className="mt-0.5 block text-[13.5px] text-white/60">{executor.role}</span>
                  </span>
                </div>
              )}
            </div>
          </article>

          {PROOFS.map((x) => (
            <article
              key={x.title}
              className="trust-card group relative flex flex-col gap-4 overflow-hidden rounded-[20px] bg-white p-[clamp(22px,2.6vw,32px)] shadow-[inset_0_0_0_1px_var(--color-hair)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_1px_var(--color-hair),0_24px_48px_-32px_rgb(20_11_51/0.35)]"
            >
              <span className="grid size-11 place-items-center rounded-full bg-accent/[0.09] text-accent-ink transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                <Icon name={x.icon} className="size-[20px]" />
              </span>
              <div>
                <h3 className="m-0 font-serif text-[clamp(21px,2vw,26px)] font-semibold leading-[1.15] text-ink">{x.title}</h3>
                <p className="m-0 mt-2 max-w-[40ch] text-[15px] leading-[1.6] text-slate">{x.text}</p>
              </div>
            </article>
          ))}
        </div>

        {/* ── Нижній рядок ──
            Клієнти ліворуч, цифри праворуч — дрібно, як довідка. Цифри
            нікуди не зникли, просто більше не кричать. */}
        {(row.length > 0 || facts.length > 0) && (
          <div className="mt-[clamp(24px,3vw,36px)] flex flex-wrap items-center justify-between gap-x-10 gap-y-4 border-t border-hair pt-[clamp(18px,2.4vw,26px)]">
            {row.length > 0 && row.length < 4 ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-2">Серед клієнтів</span>
                <ClientTicker clients={row} />
              </div>
            ) : (
              <span />
            )}
            {facts.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0 font-mono text-[11px] uppercase tracking-[0.08em] text-slate-2 min-[700px]:flex-row min-[700px]:flex-wrap min-[700px]:gap-x-3">
                {facts.map((f, i) => (
                  <li key={f} className="whitespace-nowrap">
                    {/* крапка-розділювач лише в рядок; на телефоні — стовпчик без крапок */}
                    {i > 0 && <span aria-hidden="true" className="mr-3 hidden text-accent/60 min-[700px]:inline">·</span>}
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {preview && (
          <p className="mt-4 max-w-[62ch] text-[13px] leading-relaxed text-slate-2">
            Це демонстрація стрічки, а не клієнти. Реальні компанії додаються в Sanity →
            «Налаштування сайту» → «Нам довіряють».
          </p>
        )}

        <div className="mt-[clamp(20px,2.6vw,28px)]">
          <ArrowLink href="#contact">Розповісти про свою справу</ArrowLink>
        </div>
      </div>

      {/* ── ЛЕНТА ── з четвертого клієнта, на всю ширину */}
      {row.length >= 4 && (
        <div className="ticker-band mt-[clamp(28px,4vw,48px)] border-y border-hair bg-paper">
          <ClientTicker clients={row} />
        </div>
      )}
    </section>
  )
}

const DEFAULT_HEADING = 'Чому нам доручають справи'

/** Дві світлі картки. Тексти — з того, що фірма вже обіцяє на сайті,
 *  нічого нового від себе. */
const PROOFS = [
  {
    icon: 'message',
    title: 'Перша консультація\u00a0— безкоштовно',
    text: 'Оцінюємо перспективу справи. Якщо шляху немає — скажемо одразу, а не після оплати.',
  },
  {
    icon: 'contract',
    title: 'Без передоплати',
    text: 'Ціну називаємо до договору. Ви платите за рух у справі, а не за обіцянку руху.',
  },
] as const

/** Знак «АКТИВ» у кутку темної картки: кільце R=72, розімкнене
 *  праворуч, і стріла крізь нього. Лише контур і слабке світіння —
 *  фактура, а не друга емблема поруч із цифрою. */
function TrustMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="-26.5 -19.5 300 220"
      className="pointer-events-none absolute -right-[12%] -top-[10%] -z-[1] w-[52%] max-w-[340px] opacity-60 min-[900px]:-right-[8%] min-[900px]:-top-[6%] min-[900px]:w-[44%]"
    >
      <defs>
        <radialGradient id="tm-glow">
          <stop offset="0" stopColor="#fa2163" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fa2163" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="87.5" cy="90.5" r="104" fill="url(#tm-glow)" />
      <circle cx="87.5" cy="90.5" r="88" fill="none" stroke="#fff" strokeOpacity="0.08" strokeWidth="0.6" />
      <path d="M155.2 115.1 A 72 72 0 1 1 155.2 65.9" fill="none" stroke="#fa2163" strokeOpacity="0.55" strokeWidth="11" />
      <path d="M15 84.5 H187 L180.5 66 L237 88.5 L180.5 111 L187 92.5 H15 Z" fill="#fa2163" fillOpacity="0.7" />
    </svg>
  )
}
