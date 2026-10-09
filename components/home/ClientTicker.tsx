import type { ClientLogo } from '@/lib/sanity/content'

/**
 * Бегущая лента клиентов.
 *
 * Серверный компонент: движение целиком в CSS, состояния нет, гидрировать
 * нечего. Лента едет на первом же кадре, не дожидаясь JS.
 *
 * Три вещи, которые делают её рабочей, а не просто едущей:
 *
 * 1. ДВЕ КОПИИ. Дорожка содержит список дважды, сдвиг идёт на −50 %.
 *    Момент возврата совпадает с началом второй копии, поэтому петля
 *    бесшовна при любом числе записей.
 *
 * 2. ПОСТОЯННАЯ СКОРОСТЬ. Длительность считается из числа записей,
 *    а не задана числом: четыре компании иначе проносились бы,
 *    а двадцать ползли.
 *
 * 3. ЗАПОЛНЕНИЕ ЭКРАНА. Короткий список повторяется столько раз,
 *    сколько нужно, чтобы копия перекрыла широкий монитор. Без этого
 *    три логотипа ехали бы с зияющим разрывом в полэкрана.
 *
 * Логотип необязателен. Нет файла — встаёт название, набранное
 * шрифтом сайта: так блок можно заполнить в день сдачи, не дожидаясь,
 * пока клиенты пришлют SVG.
 */

/** сколько пикселей ленты проезжает в секунду */
const SPEED = 58
/** средняя ширина записи с отступом — для оценки длительности */
const ITEM_W = 190
/** ширина, которую копия обязана перекрыть */
const MIN_COPY_W = 2400
/** до скольких записей список считается коротким */
const SHORT_LIST = 4
/** ширина разделителя с полями — входит и в расчёт числа повторов */
const SEP_W = 170

/** Такт ленты: ромб между записями. Повёрнутый квадрат в 4px, в цвете
 *  волосяной линии — он не соперничает с логотипом, но делит поток.
 *  Поля вокруг него намеренно широкие: они разводят повторы, и на экран
 *  их попадает три-четыре, а не десяток подряд. */
function Diamond() {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center px-[clamp(34px,6vw,85px)]">
      <span className="size-[4px] rotate-45 bg-slate-2/45" />
    </span>
  )
}

function Item({ c }: { c: ClientLogo }) {
  const inner = c.logoUrl ? (
    /* grayscale по умолчанию: стена логотипов в цвете перетягивает
       внимание с текста и читается как баннерная сетка */
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={c.logoUrl}
      alt={c.name}
      loading="lazy"
      decoding="async"
      className="max-h-10 w-auto max-w-[150px] object-contain opacity-60 grayscale transition-[opacity,filter] duration-300 group-hover/item:opacity-100 group-hover/item:grayscale-0"
    />
  ) : (
    <span className="whitespace-nowrap font-serif text-[clamp(17px,2.2vw,22px)] font-semibold tracking-[-0.01em] text-slate-2 transition-colors duration-300 group-hover/item:text-ink">
      {c.name}
    </span>
  )

  return (
    <span className="group/item flex h-[clamp(64px,8vw,86px)] shrink-0 items-center justify-center px-[clamp(20px,3vw,40px)]">
      {c.url ? (
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          title={c.note ? `${c.name} — ${c.note}` : c.name}
          className="flex items-center"
        >
          {inner}
        </a>
      ) : (
        <span title={c.note ?? undefined} className="flex items-center">
          {inner}
        </span>
      )}
    </span>
  )
}

export function ClientTicker({ clients }: { clients: ClientLogo[] }) {
  if (clients.length === 0) return null

  /* ── Один–три клієнти: рівний ряд, без руху ──
     Раніше лента їхала завжди, а короткий список повторювався з
     ромбами. На живому сайті з одним клієнтом це виглядало як
     «Моторола ◆ Моторола ◆ Моторола» — повтор читався як збій, а не
     як довіра. Тепер до чотирьох записів — спокійний ряд по центру,
     кожен логотип один раз. Лента вмикається сама з четвертого. */
  if (clients.length < SHORT_LIST) {
    return (
      <ul className="m-0 flex list-none flex-wrap items-center gap-x-[clamp(20px,4vw,48px)] p-0 [&_li>span]:h-14 [&_li>span]:px-0">
        {clients.map((c) => (
          <li key={c.name}>
            <Item c={c} />
          </li>
        ))}
      </ul>
    )
  }

  /* ── Короткий список ──
     Лента едет всегда: движение — приём блока, и выключать его из-за
     того, что клиентов пока мало, значит наказывать за незаполненную
     админку. Но и «повторяй, пока копия не перекроет монитор» в лоб
     нельзя: с одной записью это давало двадцать шесть одинаковых
     логотипов подряд, и лента читалась как зависший баг.

     Поэтому у короткого списка два отличия. Повторов не больше
     четырёх, и между записями встаёт ромб-разделитель. Разделитель —
     ключевая деталь: он задаёт такт, и повтор перестаёт читаться как
     сбой, а читается как орнамент на ленте. Тот же приём, что у
     бегущей строки на фасаде: узор повторяется, и это нормально,
     потому что видно, где он начинается. */
  const short = clients.length < SHORT_LIST
  /* Шаг ленты: запись плюс разделитель, если он есть. Число повторов
     считается именно от шага, а не от одной записи — иначе широкие
     поля вокруг ромба съели бы запас, копия не перекрыла бы монитор,
     и в момент возврата в ленте зиял бы разрыв. */
  const step = ITEM_W + (short ? SEP_W : 0)

  /* Сколько раз повторить список, чтобы половина дорожки перекрыла
     широкий монитор: три логотипа иначе ехали бы с разрывом в полэкрана. */
  const repeats = Math.max(1, Math.ceil(MIN_COPY_W / (clients.length * step)))
  /* Групп ровно вдвое больше — сдвиг на −50 % попадает на точно такую же
     группу, поэтому петля бесшовна при любом числе записей. */
  const groups = repeats * 2
  const duration = Math.round((repeats * clients.length * step) / SPEED)

  return (
    <div
      className="marquee relative overflow-hidden"
      style={{ ['--marquee-duration' as string]: `${duration}s` }}
    >
      {/* Список остаётся списком для скринридера: лента — это оформление,
          а не структура. Все группы, кроме первой, — технические дубли,
          и читать их незачем. При prefers-reduced-motion они же
          выключаются из раскладки, и блок становится обычным рядом
          без единого повтора. */}
      <ul className="marquee-track m-0 list-none p-0">
        {Array.from({ length: groups }, (_, g) => (
          <li
            key={g}
            className="marquee-copy"
            aria-hidden={g > 0 ? 'true' : undefined}
          >
            {clients.map((c, i) => (
              /* Разделитель ПОСЛЕ каждой записи, а не между ними.
                 Между — значит последняя запись группы упирается в
                 первую запись следующей без такта, и шов становится
                 виден ровно в момент возврата дорожки. После каждой —
                 узор однороден по всей длине, и петля остаётся
                 незаметной. */
              <span key={`${c.name}-${i}`} className="flex shrink-0 items-center">
                <Item c={c} />
                {short && <Diamond />}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  )
}
