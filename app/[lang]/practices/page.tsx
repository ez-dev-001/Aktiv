import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { LOCALES, localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'
import { getCategories } from '@/lib/sanity/content'
import { PageShell } from '@/components/site/PageShell'
import { HeroActions, PageHero } from '@/components/site/PageHero'
import { NumRows, SEC, SecHead } from '@/components/site/Blocks'
import { ArrowLink, ButtonLink } from '@/components/ui/Button'
import { splitDash } from '@/components/practice/Parts'

/**
 * Усі послуги — індекс напрямів. Сюди веде «Усі N послуг» з головної.
 * Кожен напрям — окрема секція з пронумерованими послугами (як на
 * сторінці напряму), фони чергуються.
 */

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const t = ui(lang).practicesIndex
  return { ...pageMeta(lang, '/practices'), title: t.metaTitle, description: t.metaDescription }
}

export default async function PracticesIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const { data } = await getCategories(lang)
  const T = ui(lang)
  const t = T.practicesIndex
  const prefix = lang === 'ua' ? '' : `/${lang}`
  const cats = data.filter((c) => c.practices.length > 0)

  return (
    <PageShell lang={lang} overDark>
      <PageHero
        crumbs={[{ label: T.common.home, href: localeHref(lang, '/') }, { label: T.common.practices }]}
        lang={lang}
        title={t.title}
        accent={t.accent}
        lede={t.lede}
      >
        <HeroActions>
          <ButtonLink href="#contact" arrow>
            {T.common.getConsultation}
          </ButtonLink>
        </HeroActions>
      </PageHero>

      {cats.map((cat, i) => (
        <section
          key={cat.slug}
          id={cat.slug}
          aria-labelledby={`${cat.slug}-h`}
          className={`scroll-mt-[var(--hdr)] ${i % 2 === 0 ? 'bg-paper-2' : ''} ${SEC}`}
        >
          <div className="shell inner">
            <SecHead
              eyebrow={`${String(i + 1).padStart(2, '0')} · ${T.common.services(cat.practices.length)}`}
              title={<span id={`${cat.slug}-h`}>{cat.title}</span>}
              lede={
                <>
                  {cat.excerpt}{' '}
                  <ArrowLink href={`${prefix}/practices/${cat.slug}`} className="mt-3 text-[15px] font-semibold">
                    {t.toCategory}
                  </ArrowLink>
                </>
              }
              row
            />
            <NumRows
              items={cat.practices.map((p) => ({
                title: splitDash(p.title)[0],
                text: p.excerpt,
                href: `${prefix}/practices/${cat.slug}/${p.slug}`,
              }))}
            />
          </div>
        </section>
      ))}
    </PageShell>
  )
}
