import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { categories as staticCategories, formatPrice } from '@/lib/content'
import { getPractice, getQuizzes } from '@/lib/sanity/content'
import { Icon } from '@/components/site/Icon'
import { PageShell, SectionHead } from '@/components/site/PageShell'
import { Prose } from '@/components/site/Prose'
import { ArrowLink, ButtonLink, Eyebrow } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { Quiz } from '@/components/quiz/Quiz'

/**
 * Страница одного направления.
 *
 * На старом сайте это был шаблон блог-поста: заголовок, простыня текста,
 * карточка автора «Сергій Шайко» под всеми 37 практиками и «Схожі статті».
 * Ни цены, ни состава работ, ни сроков, ни FAQ.
 *
 * Здесь страница услуги: цена на первом экране, что входит, этапы со
 * сроками, вопросы-ответы и профильный адвокат. Каждый блок рисуется
 * только если для него есть данные — пока Sanity не наполнен, страница
 * выглядит скромно, но не сломанно.
 */

const LANGS = ['ua', 'en', 'ru'] as const

export function generateStaticParams() {
  return LANGS.flatMap((lang) =>
    staticCategories.flatMap((c) => c.practices.map((p) => ({ lang, category: c.slug, slug: p.slug }))),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  const p = await getPractice(slug, lang)
  if (!p) return { title: 'Практика' }
  return { title: p.title, description: p.excerpt?.slice(0, 180) }
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ lang: string; category: string; slug: string }>
}) {
  const { lang, category, slug } = await params
  const [p, quizzes] = await Promise.all([getPractice(slug, lang), getQuizzes(lang)])
  if (!p) notFound()

  const price = formatPrice(p.price)
  const prefix = lang === 'ua' ? '' : `/${lang}`
  const hasQuiz = category === 'likvidatsiya-bankrutstvo' || category === 'sudova-praktyka'

  const stations = [
    { id: 'head', label: 'Послуга' },
    ...(p.packages?.length ? [{ id: 'packages', label: 'Тарифи' }] : []),
    ...(p.includes?.length ? [{ id: 'includes', label: 'Що входить' }] : []),
    ...(p.stages?.length ? [{ id: 'stages', label: 'Етапи' }] : []),
    ...(hasQuiz ? [{ id: 'price', label: 'Вартість' }] : []),
    ...(p.faq?.length ? [{ id: 'faq', label: 'Питання' }] : []),
    { id: 'contact', label: 'Консультація' },
  ]

  return (
    <PageShell lang={lang} stations={stations}>
      {/* ── ШАПКА ── */}
      <section id="head" className="py-[clamp(40px,6vw,88px)]">
        <div className="shell inner">
          <nav aria-label="Хлібні крихти" className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-2">
            <a href={`${prefix}/#practices`} className="hover:text-accent-ink">
              Практики
            </a>
            <span aria-hidden="true">/</span>
            <a href={`${prefix}/practices/${p.category?.slug ?? category}`} className="hover:text-accent-ink">
              {p.category?.title ?? category}
            </a>
          </nav>

          <div className="grid items-start gap-[clamp(28px,4vw,56px)] min-[900px]:grid-cols-[1.25fr_0.75fr]">
            <div>
              <Reveal as="h1" className="max-w-[20ch] text-[clamp(27px,5vw,50px)] leading-[1.07]">
                {p.title}
              </Reveal>
              {p.excerpt && <p className="lede mt-5 max-w-[52ch] text-slate">{p.excerpt}</p>}
            </div>

            <div className="grid gap-4 border-t-2 border-ink pt-[22px]">
              <div className="grid gap-[3px]">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-2">Вартість</span>
                <span className="font-serif text-[clamp(20px,2.8vw,27px)] font-semibold leading-tight text-accent-ink">
                  {price ?? 'за результатами консультації'}
                </span>
                {p.price?.note && (
                  <span className="mt-0.5 text-[12.5px] text-slate-2">{p.price.note}</span>
                )}
              </div>

              {p.lawyers && p.lawyers.length > 0 && (
                <div className="grid gap-[3px] border-t border-hair pt-4">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-2">
                    Веде справу
                  </span>
                  {p.lawyers.map((l) => (
                    <span key={l.name} className="font-serif text-[16.5px] font-semibold leading-tight text-ink">
                      {l.name}
                      <span className="mt-0.5 block font-sans text-[12.5px] font-light text-slate">{l.role}</span>
                    </span>
                  ))}
                </div>
              )}

              <ButtonLink href="#contact" arrow className="justify-self-start">
                Консультація
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* ── ТЕКСТ ──
          Из Sanity приходит PortableText, из статики — обычные абзацы,
          перенесённые со старого сайта дословно. Второе существует
          ровно для того, чтобы страница услуги не стояла пустой,
          пока Sanity не наполнен. */}
      {p.body ? (
        <section className="pb-[clamp(40px,6vw,80px)]">
          <div className="shell inner">
            <Prose value={p.body} />
          </div>
        </section>
      ) : p.bodyText && p.bodyText.length > 0 ? (
        <section className="pb-[clamp(40px,6vw,80px)]">
          <div className="shell inner">
            {p.bodyText.map((t) => (
              <p key={t.slice(0, 40)} className="mb-5 max-w-[68ch] text-[16.5px] leading-[1.68] text-slate">
                {t}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── ТАРИФИ ──
          Услуга с двумя пакетами: на старом сайте они лежали двумя
          колонками с ценой и двумя списками — «кому підходить» и
          «що входить». Здесь то же самое, но цена вынесена в шапку
          карточки, а не тонет в середине столбца. */}
      {p.packages && p.packages.length > 0 && (
        <section id="packages" className="bg-paper-2 py-[clamp(48px,7vw,96px)]">
          <div className="shell inner">
            <SectionHead
              eyebrow="Тарифи"
              title="Два способи пройти процедуру"
              lede="Вибір залежить не від бюджету, а від історії підприємства: чим складніша, тим далі має відійти власник."
            />
            <div className="grid gap-[clamp(12px,1.6vw,18px)] min-[820px]:grid-cols-2">
              {p.packages.map((pk) => (
                <article
                  key={pk.name}
                  className="flex flex-col gap-5 rounded-[18px] bg-white p-[clamp(22px,3vw,32px)] shadow-[0_1px_2px_rgb(20_11_51/0.045),0_14px_34px_-20px_rgb(20_11_51/0.13)]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-hair pb-4">
                    <h3 className="text-[clamp(19px,2.6vw,24px)] leading-tight">{pk.name}</h3>
                    <span className="font-serif text-[clamp(20px,2.8vw,26px)] font-semibold tabular-nums text-accent-ink">
                      {formatPrice({ mode: 'fixed', amount: pk.price })}
                    </span>
                  </div>

                  <div>
                    <p className="m-0 mb-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-2">
                      Кому підходить
                    </p>
                    <ul className="m-0 grid list-none gap-2 p-0">
                      {pk.audience.map((a) => (
                        <li key={a} className="grid grid-cols-[16px_1fr] gap-2.5 text-[14.5px] leading-snug text-slate">
                          <span className="mt-[0.6em] size-[5px] rounded-full bg-slate-2" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto">
                    <p className="m-0 mb-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-2">
                      Що входить
                    </p>
                    <ul className="m-0 grid list-none gap-2 p-0">
                      {pk.includes.map((a) => (
                        <li key={a} className="grid grid-cols-[16px_1fr] gap-2.5 text-[14.5px] leading-snug text-ink">
                          <Icon name="arrow" className="mt-[3px] size-4 shrink-0 text-accent" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {pk.note && <p className="m-0 text-[13px] leading-snug text-slate-2">{pk.note}</p>}

                  <ButtonLink href="#contact" arrow className="self-start">
                    Обрати цей варіант
                  </ButtonLink>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ЩО ВХОДИТЬ ── */}
      {p.includes && p.includes.length > 0 && (
        <section id="includes" className="bg-paper-2 py-[clamp(48px,7vw,96px)]">
          <div className="shell inner">
            <SectionHead eyebrow="Що входить" title="Склад роботи" />
            <ul className="grid list-none gap-px border border-hair bg-hair p-0 min-[700px]:grid-cols-2">
              {p.includes.map((item) => (
                <li key={item} className="flex items-start gap-3 bg-white p-[clamp(16px,2.2vw,24px)]">
                  <Icon name="arrow" className="mt-[3px] size-4 shrink-0 text-accent" />
                  <span className="text-[15px] leading-snug text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── ЕТАПИ ── */}
      {p.stages && p.stages.length > 0 && (
        <section id="stages" className="py-[clamp(48px,7vw,96px)]">
          <div className="shell inner">
            <SectionHead
              eyebrow="Етапи роботи"
              title="Що відбувається і в якому порядку"
              lede="Строки орієнтовні: вони залежать від завантаженості реєстраторів і суду."
            />
            <div className="grid min-[900px]:grid-cols-4 min-[900px]:border-t min-[900px]:border-hair">
              {p.stages.map((s, i) => (
                <div
                  key={s.title}
                  className="relative border-t border-hair pb-[26px] pr-[22px] pt-[26px] min-[900px]:border-t-0 min-[900px]:pt-[30px]"
                >
                  <span className="absolute -top-[5px] left-0 size-[9px] rounded-full bg-accent min-[900px]:-top-[4.5px]" />
                  <span className="mb-2.5 block font-mono text-[9.5px] uppercase tracking-[0.14em] text-slate-2">
                    Етап {String(i + 1).padStart(2, '0')}
                    {s.duration ? ` · ${s.duration}` : ''}
                  </span>
                  <h3 className="mb-2 text-[17.5px] leading-snug">{s.title}</h3>
                  {s.text && <p className="m-0 max-w-[32ch] text-[14.5px] leading-snug text-slate">{s.text}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── КАЛЬКУЛЯТОР ── */}
      {hasQuiz && (
        <section id="price" className="bg-paper-2 py-[clamp(48px,7vw,96px)]">
          <div className="shell inner">
            <SectionHead
              eyebrow="Вартість"
              title="Порахувати вилку по вашій ситуації"
              lede="Ціна вище — нижня межа. Калькулятор уточнює її під конкретні обставини."
            />
            <div className="max-w-[640px]">
              <Quiz sets={quizzes.data.filter((q) => q.key === category).length
                ? quizzes.data.filter((q) => q.key === category)
                : quizzes.data} />
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {p.faq && p.faq.length > 0 && (
        <section id="faq" className="py-[clamp(48px,7vw,96px)]">
          <div className="shell inner">
            <SectionHead eyebrow="Питання та відповіді" title="Що питають найчастіше" />
            <div className="border-t border-hair">
              {p.faq.map((f) => (
                <details key={f.q} className="group border-b border-hair-soft py-1">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                    <span className="max-w-[54ch] font-serif text-[17px] font-semibold leading-snug text-ink">
                      {f.q}
                    </span>
                    <Icon
                      name="caret"
                      className="mt-1.5 size-3.5 shrink-0 text-accent transition-transform duration-[260ms] group-open:rotate-180"
                    />
                  </summary>
                  <p className="m-0 max-w-[62ch] pb-5 text-[15px] leading-relaxed text-slate">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── СВЯЗАННЫЕ СТАТЬИ ── */}
      {p.related && p.related.length > 0 && (
        <section className="bg-paper-2 py-[clamp(44px,6vw,84px)]">
          <div className="shell inner">
            <Eyebrow>Про це в блозі</Eyebrow>
            <div className="grid gap-px border border-hair bg-hair min-[820px]:grid-cols-3">
              {p.related.map((a) => (
                <a key={a.slug} href={`${prefix}/blog/${a.slug}`} className="flex flex-col gap-3 bg-white p-6 hover:bg-paper">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.11em] text-slate-2">
                    {a.category}
                  </span>
                  <span className="font-serif text-[17px] font-semibold leading-snug text-ink">{a.title}</span>
                  <span className="mt-auto inline-flex items-center gap-2 text-[14px] font-medium text-accent-ink">
                    Читати <Icon name="arrow" className="size-[14px]" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section id="contact" className="py-[clamp(48px,7vw,96px)]">
        <div className="shell inner">
          <div className="flex flex-wrap items-end justify-between gap-8 border-t-2 border-ink pt-8">
            <div>
              <h2 className="max-w-[24ch] text-[clamp(22px,3.6vw,34px)] leading-[1.14]">
                Опишіть ситуацію — скажемо, чи бачимо шлях
              </h2>
              <p className="mt-4 max-w-[46ch] text-[15px] text-slate">
                Перша консультація без оплати. Немає перспективи — скажемо одразу, а не після
                підписання договору.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <ButtonLink href={`${prefix}/#contact`} arrow>
                Отримати консультацію
              </ButtonLink>
              <ArrowLink href={`${prefix}/practices/${p.category?.slug ?? category}`}>
                Усі напрями категорії
              </ArrowLink>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
