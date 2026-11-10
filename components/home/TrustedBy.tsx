import { trustPlaceholders } from '@/lib/content'
import { getTrustBlock, type ClientLogo, type TrustBlock } from '@/lib/sanity/content'
import { Reveal } from '@/components/ui/Reveal'
import { ui } from '@/lib/ui'

/**
 * «Нам довіряють».
 *
 * ── Формат ──
 * Як «Нам довіряють» в armada.law (затверджено за макетом): ліворуч
 * заголовок і кілька рядків, праворуч сітка логотипів. Цифри й бенто
 * з доказами прибрано: цифри відвідувачі проскакують, а докази
 * (виконавець, безкоштовна консультація) уже є в «Команді», першому
 * екрані й формі.
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
  const t = block ?? (await getTrustBlock(lang)).data
  const T = ui(lang).trust
  const hasClients = t.clients.length > 0
  /* Локально без клієнтів показуємо службові заглушки, щоб було що
     налаштовувати. У проді порожній список — блоку немає: вигадані
     імена на сайті юрфірми неприпустимі. */
  const preview = !hasClients && process.env.NODE_ENV !== 'production'
  const row: ClientLogo[] = hasClients ? t.clients : preview ? trustPlaceholders : []
  if (!row.length) return null

  return (
    <section id="trust" className="bg-paper py-[clamp(48px,7vw,96px)]">
      <div className="shell inner grid items-start gap-[clamp(28px,4vw,64px)] min-[900px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <Reveal className="text-[clamp(32px,4.4vw,56px)] font-normal leading-[1.05] tracking-[-0.02em]">{t.eyebrow || T.title}</Reveal>
          <p className="m-0 mt-[18px] max-w-[46ch] text-[15.5px] leading-[1.65] text-slate">
            {t.text}
          </p>
          {preview && (
            <p className="m-0 mt-4 max-w-[46ch] text-[13px] leading-relaxed text-slate-2">
              {T.preview}
            </p>
          )}
        </div>

        {/* Сітка логотипів: лише справжні, без порожніх клітинок. */}
        <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 min-[560px]:grid-cols-4">
          {row.map((c) => (
            <li key={c.name} className="min-w-0">
              <Logo c={c} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Logo({ c }: { c: ClientLogo }) {
  const inner = c.logoUrl ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={c.logoUrl}
      alt={c.name}
      loading="lazy"
      decoding="async"
      className="max-h-10 w-auto max-w-[78%] object-contain opacity-70 grayscale transition-[opacity,filter] duration-300 group-hover:opacity-100 group-hover:grayscale-0"
    />
  ) : (
    <span className="px-3 text-center font-serif text-[17px] font-semibold leading-tight text-slate-2 transition-colors duration-300 group-hover:text-ink">
      {c.name}
    </span>
  )
  const cls =
    'group flex min-h-[86px] items-center justify-center rounded-[14px] bg-white shadow-[inset_0_0_0_1px_var(--color-hair)] transition-shadow duration-300 hover:shadow-[inset_0_0_0_1px_var(--color-hair),0_16px_32px_-24px_rgb(11_7_16/0.35)]'
  return c.url ? (
    <a href={c.url} target="_blank" rel="noopener noreferrer" title={c.note ? `${c.name} — ${c.note}` : c.name} className={cls}>
      {inner}
    </a>
  ) : (
    <span title={c.note ?? undefined} className={cls}>
      {inner}
    </span>
  )
}
