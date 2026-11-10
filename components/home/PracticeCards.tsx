import type { Category, Practice } from '@/lib/content'
import { categoryPhoto } from '@/lib/sanity/image'
import { Icon } from '@/components/site/Icon'
import { Photo } from '@/components/site/Photo'

/**
 * Карточки практик.
 *
 * ── Что здесь изменилось и почему ──
 * Раньше карточка показывала только название категории и прятала все
 * направления под кнопкой «Усі напрями». Получалось, что шапка знает
 * про 36 услуг, а главная — про четыре абстрактных заголовка, и
 * посетитель, который ищет «банкрутство фізичних осіб», на первом
 * экране этих слов не видел вовсе.
 *
 * На старом сайте, при всей его сырости, это было сделано вернее:
 * главная показывала два десятка направлений НАЗВАНИЯМИ, в три
 * колонки. Человек искал глазами свою услугу и находил её.
 *
 * Здесь взято это свойство и оставлена наша форма: карточка называет
 * пять ключевых направлений и уводит на страницу категории за
 * полным списком.
 *
 * ── Почему пять и какие именно ──
 * Не вручную отобранные — по правилу, иначе список протухнет при
 * первом же добавлении практики:
 *   1. отмеченные «Показувати на головній» (featured в Sanity);
 *   2. затем остальные в порядке order.
 *
 * ── Почему больше нет раскрытия ──
 * Оно дублировало страницу категории и требовало клиентского
 * компонента ради одного useState. Теперь это серверный компонент:
 * навигация не ждёт гидратации, JS на неё не тратится вовсе.
 */

/** сколько направлений показываем на карточке */
const SHOWN = 5

/**
 * Порядок направлений на карточке.
 *
 * Стабильная сортировка: равные по признаку сохраняют исходный
 * порядок из Sanity (order asc), поэтому редактор может влиять
 * на выдачу, не трогая код.
 */
function pickTop(practices: Practice[]): Practice[] {
  return [...practices]
    .map((p, i) => ({ p, i }))
    .sort((a, b) => Number(Boolean(b.p.featured)) - Number(Boolean(a.p.featured)) || a.i - b.i)
    .map((x) => x.p)
    .slice(0, SHOWN)
}

export function PracticeCards({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-[clamp(12px,1.6vw,18px)] min-[660px]:grid-cols-2">
      {categories.map((c) => {
        const photo = categoryPhoto(c)
        const top = pickTop(c.practices)
        const rest = c.practices.length - top.length
        const cardBadge = (
          <div className="flex size-full items-end justify-between gap-3 p-[clamp(18px,2.2vw,26px)]">
            <Icon name={c.icon} className="size-[34px] shrink-0 text-white" />
            <span className="whitespace-nowrap text-[13px] text-white/70">
              {c.practices.length} напрямів
            </span>
          </div>
        )

        return (
          <div
            key={c.slug}
            className="group/card relative flex flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgb(11_7_16/0.045),0_14px_34px_-20px_rgb(11_7_16/0.13)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgb(11_7_16/0.05),0_22px_46px_-22px_rgb(11_7_16/0.20)]"
          >
            {/* Кадр наверху карточки, знак практики лежит на нём.
                Масштаб 1.04 на наведении — единственное движение здесь:
                карточка навигационная, ей нельзя мигать и выезжать. */}
            {photo ? (
              <Photo
                name={photo}
                ratio={2.1}
                tone="ink"
                sizes="(min-width: 660px) 46vw, 92vw"
                imgClassName="transition-transform duration-[900ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover/card:scale-[1.04]"
              >
                {cardBadge}
              </Photo>
            ) : (
              /* Направление без фото: та же высота и тот же знак на
                 тёмной плашке. Иначе новая категория стояла бы рядом
                 с остальными без верхней половины и без иконки. */
              <div className="relative bg-ink bg-[radial-gradient(120%_90%_at_85%_0%,rgb(255_255_255/0.08),transparent_60%)]" style={{ aspectRatio: '2.1' }}>
                <div className="absolute inset-0">{cardBadge}</div>
              </div>
            )}

            <div className="flex flex-1 flex-col p-[clamp(20px,2.6vw,30px)]">
              <h3 className="max-w-[17ch] text-[clamp(19px,2.6vw,25px)] leading-tight">
                <a href={`/practices/${c.slug}`} className="inline-block py-2.5 hover:text-accent-ink">
                  {c.title}
                </a>
              </h3>

              <p className="m-0 mt-3 text-[14.5px] leading-relaxed text-slate">{c.excerpt}</p>

              {/* ── направления ──
                  Каждая строка — ссылка на конкретную услугу. */}
              <ul className="m-0 mt-5 list-none border-t border-hair-soft p-0">
                {top.map((p) => {
                  return (
                    <li key={p.slug} className="border-b border-hair-soft">
                      <a
                        href={`/practices/${c.slug}/${p.slug}`}
                        className="group/row grid min-h-11 grid-cols-[1fr_auto] items-center gap-x-4 py-2.5 transition-colors"
                      >
                        <span className="text-[14.5px] font-normal leading-snug text-ink transition-colors group-hover/row:text-accent-ink">
                          {p.title}
                        </span>
                        <Icon
                          name="arrow"
                          className="size-[14px] text-slate-2 transition-[color,transform] duration-[240ms] group-hover/row:translate-x-1 group-hover/row:text-accent-ink"
                        />
                      </a>
                    </li>
                  )
                })}
              </ul>

              <a
                href={`/practices/${c.slug}`}
                className="group/all mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-4 font-sans text-[13.5px] font-medium text-accent-ink"
              >
                {rest > 0 ? `Усі ${c.practices.length} напрямів` : 'Детальніше про напрям'}
                <Icon
                  name="arrow"
                  className="size-[14px] transition-transform duration-[240ms] group-hover/all:translate-x-1"
                />
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
