import { trustPlaceholders } from '@/lib/content'
import { getTrustBlock, type ClientLogo, type TrustBlock } from '@/lib/sanity/content'
import { Photo } from '@/components/site/Photo'
import { Eyebrow } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Bold } from '@/components/ui/Bold'
import { ClientTicker } from './ClientTicker'

/**
 * «Нам довіряють».
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
  const hasClients = t.clients.length > 0
  /* ── Когда показывать заглушки ──
     Раньше условие было `!isSanityConfigured`, и это оказалось ошибкой.
     Как только Sanity подключили, а список клиентов в «Налаштування
     сайту» остался пустым, лента пропала с экрана совсем: заглушки
     выключились, а реальных записей ещё нет. Выглядело это как поломка,
     хотя формально всё работало.

     Правильная развилка — не «настроен ли Sanity», а «продакшн или
     разработка». Локально лента всегда едет, чтобы было что смотреть и
     настраивать. В проде пустой список даёт честный пропуск блока:
     выдуманные имена на живом сайте юрфирмы недопустимы. */
  const preview = !hasClients && process.env.NODE_ENV !== 'production'
  const row: ClientLogo[] = hasClients ? t.clients : preview ? trustPlaceholders : []

  return (
    <section id="trust" className="border-y border-hair bg-white py-[clamp(56px,8vw,104px)]">
      <div className="shell inner">
        <div className="mb-[clamp(30px,4.5vw,50px)] max-w-[58ch]">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <Reveal className="text-[clamp(24px,4.2vw,40px)] leading-[1.1]">{t.heading}</Reveal>
          {/* Абзац рисуется, только если он заполнен. Раньше он был
              привязан к числу клиентов в ленте, и убрать его из студии
              было нельзя — теперь решает само поле. */}
          {t.intro && (
            <p className="lede mt-5 max-w-[54ch] text-slate">
              <Bold text={t.intro} />
            </p>
          )}
        </div>
      </div>

      {/* ── ЛЕНТА ──
          Во всю ширину экрана, вне .shell. Полоса работает как
          перебивка между двумя текстовыми блоками: заголовком сверху
          и сеткой фактов снизу. Растушёвка по краям (.marquee) гасит
          обрубленный край, чтобы движение уходило за экран, а не
          упиралось в него. */}
      {row.length > 0 && (
        <div className="ticker-band mb-[clamp(30px,4.5vw,52px)] border-y border-hair-soft bg-paper">
          <ClientTicker clients={row} />
        </div>
      )}

      <div className="shell inner">
        {preview && (
          <p className="mb-[clamp(26px,4vw,44px)] max-w-[62ch] text-[13px] leading-relaxed text-slate-2">
            Це демонстрація стрічки, а не клієнти. Реальні компанії додаються в Sanity →
            «Налаштування сайту» → «Нам довіряють»: назва, логотип (не обовʼязковий) і галочка
            дозволу. Порядок записів там = порядок у стрічці, швидкість підлаштовується сама.
          </p>
        )}

        {/* Фотография держит вертикаль рядом с сеткой фактов: шесть
            плиток подряд без кадра читаются как таблица, а не как
            доказательство. На узком экране кадр уходит наверх и
            становится полосой — портретный снимок на 360px съел бы
            весь первый экран блока.

            Без цифр кадр остаётся один, и тогда он меняет пропорцию:
            узкий вертикальный снимок посреди пустой строки читался бы
            как недогруженная плитка. Во всю ширину и ниже по высоте —
            это полоса, законченный элемент. */}
        <div
          className={`grid gap-[clamp(18px,2.6vw,30px)] min-[980px]:items-stretch ${
            t.facts.length ? 'min-[980px]:grid-cols-[0.42fr_1fr]' : ''
          }`}
        >
          <div
            className={`relative overflow-hidden rounded-[4px] ${
              t.facts.length
                ? 'min-h-[clamp(190px,30vw,260px)]'
                : 'min-h-[clamp(160px,22vw,300px)]'
            }`}
          >
            <Photo
              name="tower"
              fill
              sizes={t.facts.length ? '(min-width: 980px) 30vw, 92vw' : '92vw'}
            />
          </div>
          {t.facts.length > 0 && (
          <dl className="m-0 grid grid-cols-2 gap-px border border-hair bg-hair min-[760px]:grid-cols-3 min-[980px]:grid-cols-2 min-[1180px]:grid-cols-3">
            {t.facts.map((f) => (
              <div key={f.label} className="flex flex-col gap-1.5 bg-white p-[clamp(18px,2.4vw,28px)]">
                {/* leading-none и 24px не оставляли «150 млн ₴» места
                    в узкой ячейке на 320px: гривна упиралась в рамку. */}
                <dt className="font-serif text-[clamp(21px,3.4vw,34px)] font-semibold leading-[1.06] tracking-[-0.025em] tabular-nums text-accent-ink">
                  {f.value}
                </dt>
                <dd className="m-0">
                  <span className="block text-[14.5px] leading-snug text-ink">{f.label}</span>
                  {/* Уточнение не обязательно. Пустой span оставлял
                      под подписью полоску воздуха, и плитка без
                      уточнения оказывалась выше соседних. */}
                  {f.note && (
                    <span className="mt-1.5 block text-[13px] leading-snug text-slate-2">
                      {f.note}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          )}
        </div>
      </div>
    </section>
  )
}
