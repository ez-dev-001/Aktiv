import type { Metadata } from 'next'
import { LOCALES } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { categories as staticCategories, formatPrice } from '@/lib/content'
import { getCategories, getQuizzes } from '@/lib/sanity/content'
import { Icon } from '@/components/site/Icon'
import { PageHead, PageShell, SectionHead } from '@/components/site/PageShell'
import { ButtonLink } from '@/components/ui/Button'
import { Quiz } from '@/components/quiz/Quiz'
import { pickQuizzes } from '@/lib/quizzes'
import { categoryPhoto } from '@/lib/sanity/image'
import { TrustedBy } from '@/components/home/TrustedBy'

/**
 * Страница категории практик — «одна страница Послуги» первого этапа.
 *
 * Это не список ссылок, как было на старом сайте, а страница услуги:
 * все направления с ценами, калькулятор вилки для тех категорий,
 * где он есть, и явный ответ на вопрос «сколько это стоит».
 */

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => staticCategories.map((c) => ({ lang, category: c.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string }>
}): Promise<Metadata> {
  const { lang, category } = await params
  const { data } = await getCategories(lang)
  const cat = data.find((c) => c.slug === category)
  if (!cat) return { title: 'Практика' }
  return {
    title: cat.title,
    description: cat.excerpt.slice(0, 180),
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; category: string }>
}) {
  const { lang, category } = await params
  const [{ data }, quizzes] = await Promise.all([getCategories(lang), getQuizzes(lang)])
  const cat = data.find((c) => c.slug === category)
  if (!cat) notFound()

  /* Калькулятор — тот, что выбран у категории, или любой, привязанный
     к ней. Нет ни одного — блока «Вартість» нет: пустой квиз хуже,
     чем никакого. */
  const quizSets = pickQuizzes(quizzes.data, { categoryQuiz: cat.quiz, category })
  const hasQuiz = quizSets.length > 0

  const stations = [
    { id: 'head', label: cat.title.split(/\s|,/)[0] ?? 'Практика' },
    { id: 'directions', label: 'Напрями' },
    ...(hasQuiz ? [{ id: 'price', label: 'Вартість' }] : []),
    { id: 'trust', label: 'Довіра' },
    { id: 'contact', label: 'Консультація' },
  ]

  const priced = cat.practices.filter((p) => p.price)
  const photo = categoryPhoto(cat)

  return (
    <PageShell lang={lang} stations={stations} overDark={!!photo}>
      <PageHead
        photo={photo}
        eyebrow={`Практики · ${cat.practices.length} напрямів`}
        title={cat.title}
        lede={cat.excerpt}
        aside={
          <div className={`grid gap-4 border-t-2 pt-[22px] ${photo ? 'border-white/70' : 'border-ink'}`}>
            {cat.priceHint && (
              <div className="grid gap-[3px]">
                <span className={`font-mono text-[9.5px] uppercase tracking-[0.14em] ${photo ? 'text-white/55' : 'text-slate-2'}`}>
                  Вартість від
                </span>
                <span className={`font-serif text-[clamp(22px,3vw,30px)] font-semibold leading-tight ${photo ? 'text-accent-soft' : 'text-accent-ink'}`}>
                  {cat.priceHint.split('·')[0]?.trim()}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href="#contact" arrow>
                Консультація
              </ButtonLink>
              {hasQuiz && (
                <ButtonLink href="#price" variant={photo ? 'ghostDark' : 'ghost'}>
                  Розрахувати
                </ButtonLink>
              )}
            </div>
          </div>
        }
      />

      {/* ── НАПРЯМИ ── */}
      <section id="directions" className="bg-paper-2 py-[clamp(52px,7vw,104px)]">
        <div className="shell inner">
          <SectionHead
            eyebrow="Напрями"
            title={`Що входить у «${cat.title.toLowerCase()}»`}
            lede="Кожен напрям — окрема послуга з власною ціною та відповідальним адвокатом."
          />
          <ul className="grid list-none gap-px border border-hair bg-hair p-0 min-[700px]:grid-cols-2">
            {cat.practices.map((p) => {
              const price = formatPrice(p.price)
              return (
                <li key={p.slug} className="bg-white">
                  <a
                    href={`/practices/${cat.slug}/${p.slug}`}
                    className="group flex h-full min-h-[104px] flex-col gap-2 p-[clamp(18px,2.4vw,26px)] transition-colors hover:bg-paper"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-serif text-[16.5px] font-semibold leading-snug text-ink transition-colors group-hover:text-accent-ink">
                        {p.title}
                      </span>
                      <Icon
                        name="arrow"
                        className="mt-1 size-4 shrink-0 text-slate-2 transition-[transform,color] duration-[240ms] group-hover:translate-x-1 group-hover:text-accent"
                      />
                    </span>
                    {p.excerpt && (
                      <span className="max-w-[46ch] text-[13.5px] leading-snug text-slate">{p.excerpt}</span>
                    )}
                    {price && (
                      <span className="mt-auto font-mono text-[12px] text-accent-ink">{price}</span>
                    )}
                  </a>
                </li>
              )
            })}
          </ul>

          {priced.length === 0 && (
            <p className="mt-5 text-[13.5px] text-slate-2">
              Вартість у цій категорії визначається за результатами консультації: обсяг роботи надто
              різний, щоб називати цифру наосліп.
            </p>
          )}
        </div>
      </section>

      {/* ── ВАРТІСТЬ І КАЛЬКУЛЯТОР ── */}
      {hasQuiz && (
        <section id="price" className="py-[clamp(52px,7vw,104px)]">
          <div className="shell inner">
            <SectionHead
              eyebrow="Вартість"
              title="Чотири питання — і діапазон вартості для вашої ситуації"
              lede="Прайс показує нижню межу. Калькулятор уточнює її під конкретні обставини: борги, активи, строки."
            />
            <div className="max-w-[640px]">
              <Quiz sets={quizSets} />
            </div>
          </div>
        </section>
      )}

      <TrustedBy lang={lang} />

      {/* ── CTA ── */}
      <section id="contact" className="py-[clamp(52px,7vw,96px)]">
        <div className="shell inner">
          <div className="flex flex-wrap items-end justify-between gap-8 border-t-2 border-ink pt-8">
            <div>
              <h2 className="max-w-[22ch] text-[clamp(22px,3.6vw,34px)] leading-[1.14]">
                Опишіть ситуацію — скажемо, чи бачимо шлях
              </h2>
              <p className="mt-4 max-w-[46ch] text-[15px] text-slate">
                Перша консультація без оплати. Якщо перспективи немає — скажемо одразу, а не після
                підписання договору.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href={`${lang === 'ua' ? '' : `/${lang}`}/?practice=cat:${encodeURIComponent(cat.slug)}#contact`} arrow>
                Отримати консультацію
              </ButtonLink>
              <ButtonLink href={lang === 'ua' ? '/#practices' : `/${lang}/#practices`} variant="ghost">
                Усі практики
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
