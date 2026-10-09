import type { Metadata } from 'next'
import { LOCALES } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import { categories as staticCategories } from '@/lib/content'
import { getCategories } from '@/lib/sanity/content'
import { Icon } from '@/components/site/Icon'
import { PageHead, PageShell, SectionHead } from '@/components/site/PageShell'
import { ButtonLink } from '@/components/ui/Button'
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
    title: cat.seoTitle || cat.title,
    description: (cat.seoDescription || cat.excerpt).slice(0, 180),
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; category: string }>
}) {
  const { lang, category } = await params
  const { data } = await getCategories(lang)
  const cat = data.find((c) => c.slug === category)
  if (!cat) notFound()

  const stations = [
    { id: 'head', label: cat.title.split(/\s|,/)[0] ?? 'Практика' },
    { id: 'directions', label: 'Напрями' },
    { id: 'trust', label: 'Довіра' },
    { id: 'contact', label: 'Консультація' },
  ]

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
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href="#contact" arrow>
                Консультація
              </ButtonLink>
              <ButtonLink href="#directions" variant={photo ? 'ghostDark' : 'ghost'}>
                Усі напрями
              </ButtonLink>
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
            lede="Кожен напрям — окрема послуга з відповідальним адвокатом."
          />
          <ul className="grid list-none gap-px border border-hair bg-hair p-0 min-[700px]:grid-cols-2">
            {cat.practices.map((p) => {
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
                  </a>
                </li>
              )
            })}
          </ul>

        </div>
      </section>

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
