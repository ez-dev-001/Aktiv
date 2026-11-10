import { localeHref } from '@/lib/i18n'
import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { getCategories, getTeam, getTeamPage, type TeamMember } from '@/lib/sanity/content'
import { PageShell } from '@/components/site/PageShell'
import { DownLink, HeroActions, PageHero } from '@/components/site/PageHero'
import { Band, SEC } from '@/components/site/Blocks'
import { ButtonLink } from '@/components/ui/Button'
import { Bold } from '@/components/ui/Bold'
import { Icon } from '@/components/site/Icon'
import { ArrowUR, H2, Kick, V2Icon } from '@/components/v2/ui'
import { v2text } from '@/lib/v2/content'
import { v2img } from '@/lib/v2/practices'
import { PeopleGrid, type Group } from '@/components/team/PeopleGrid'
import { ui } from '@/lib/ui'

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const t = ui(lang).meta
  return {
    ...pageMeta(lang, '/team'),
    title: t.teamTitle,
    description: t.teamDescription,
  }
}

/** Група для фільтра: з kind у Sanity; у статиці kind немає — з тексту ролі. */
function groupOf(m: TeamMember): Group {
  switch (m.kind) {
    case 'managing':
    case 'partner':
      return 'partner'
    case 'military':
      return 'mil'
    case 'executor':
      return 'exec'
    case 'advocate':
      return 'adv'
  }
  const r = m.role.toLowerCase()
  /* англійські підписи ролей — на випадок, коли роль перекладена в студії */
  return /партнер|partner/.test(r) ? 'partner' : /військ|military/.test(r) ? 'mil' : /виконав|enforcement/.test(r) ? 'exec' : 'adv'
}

export default async function TeamPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  /* Sanity, если в нём есть люди; иначе статика — форма данных одна.
     Категорії — щоб напрями виділеного юриста вели на сторінки практик. */
  const [{ data: team }, { data: cats }] = await Promise.all([getTeam(lang), getCategories(lang)])
  /* Обрамление страницы грузится ПОСЛЕ команды и получает её на вход:
     в заголовках есть подстановки {n}, {name} и {role}, которые
     раскрываются по живым данным. Ходить за командой второй раз изнутри
     загрузчика значило бы сделать два одинаковых запроса на страницу. */
  const { data: t } = await getTeamPage(lang, team)
  /* Отдельный блок — один, для первого выделенного по порядку. Тот же
     выбор делает getTeamPage, когда подставляет {name} и {role}, поэтому
     заголовок блока и человек в нём совпадают всегда.

     В общем списке — все, КРОМЕ того, кто в блоке. Раньше из списка
     убирались все выделенные: пока выделен был один исполнитель, это
     совпадало, но с галочкой у двоих второй исчез бы со страницы совсем —
     ни в блоке, ни в списке. */
  /* Нова редакція (макет клієнта): окремим блоком — керуючий партнер,
     у сітці «Наша команда» — усі інші, без фільтра. Виділений виконавець
     (highlight) тепер просто в сітці. */
  const T = ui(lang)
  const v = v2text(lang).team
  const partner = team.find((m) => m.kind === 'managing') ?? team.find((m) => T.home.managingRole.test(m.role))
  const rest = team.filter((m) => m !== partner)
  const home = lang === 'ua' ? '/' : `/${lang}`
  const career = lang === 'ua' ? '/career' : `/${lang}/career`
  const about = lang === 'ua' ? '/about' : `/${lang}/about`
  const partnerPhoto = partner?.photoUrl ? `${partner.photoUrl}?w=900&h=1040&fit=crop&crop=top&auto=format&q=80` : v2img('shaiko')

  return (
    <PageShell lang={lang} overDark>
      <PageHero
        img="team-hero"
        crumbs={[{ label: T.common.home, href: home }, { label: T.common.team }]}
        lang={lang}
        title={v.title}
        accent={v.accent}
        lede={v.lede}
      >
        <HeroActions>
          <ButtonLink
            href="#people"
            className="min-h-[54px] max-[640px]:w-full"
          >
            {v.meet}
          </ButtonLink>
          <DownLink href={about}>{v.approach}</DownLink>
        </HeroActions>
      </PageHero>

      {/* ── КЕРУЮЧИЙ ПАРТНЕР ── темний блок: портрет із малиновим кільцем і напрями */}
      {partner && (
        <section id="partner" className="on-dark relative isolate overflow-clip bg-ink py-[clamp(64px,9vw,128px)] text-on-dark">
          <div aria-hidden="true" className="absolute inset-0 -z-[1] bg-[radial-gradient(45%_70%_at_22%_50%,rgb(250_33_99/0.22),transparent_70%),linear-gradient(180deg,#0b0710,#161019)]" />
          <div className="shell inner grid items-center gap-[clamp(36px,6vw,96px)] min-[900px]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="v2-rise relative mx-auto w-full max-w-[460px]">
              {/* малинове кільце за портретом — як у макеті клієнта */}
              <span aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[inset_0_0_0_3px_rgb(250_33_99/0.9),0_0_90px_rgb(250_33_99/0.35),inset_0_0_90px_rgb(250_33_99/0.25)]" />
              {/* фото з Sanity; якщо не завантажилось — під ним лежить локальне */}
              <div
                role="img"
                aria-label={partner.name}
                className="relative aspect-[45/52] overflow-hidden rounded-[28px] bg-ink-2 bg-cover bg-top"
                style={{ backgroundImage: `url(${partnerPhoto}), url(${v2img('shaiko')})` }}
              >
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgb(11_7_16/0.85))]" />
                <span className="absolute bottom-5 left-5 inline-flex items-center gap-2.5 rounded-full bg-ink/70 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(250_33_99/0.6)] backdrop-blur">
                  <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
                  {v.partnerBadge}
                </span>
              </div>
            </div>
            <div className="v2-rise">
              <Kick dark>{v.partnerKick}</Kick>
              <h2 className="m-0 mt-5 font-display text-[clamp(38px,5vw,68px)] font-extrabold leading-[1.02] tracking-[-0.04em] text-white">{partner.name}</h2>
              <p className="m-0 mt-3 text-[17px] font-semibold text-accent">{partner.role}</p>
              <p className="m-0 mt-6 max-w-[52ch] text-[clamp(16px,1.35vw,19px)] leading-[1.65] text-on-dark">{v.partnerText}</p>
              <ul className="m-0 mt-7 flex list-none flex-wrap gap-2.5 p-0">
                {v.partnerAreas.map((x, i) => (
                  <li key={x} className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] px-4 py-2.5 text-[15px] font-medium text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.16)]">
                    <V2Icon name={['home', 'crane', 'tax', 'scale'][i] ?? 'scale'} className="size-[18px] text-accent" />
                    {x}
                  </li>
                ))}
              </ul>
              <ButtonLink href="#contact" arrow className="mt-8 min-h-[54px]">
                {v.partnerCta}
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* ── УСІ ФАХІВЦІ ── */}
      {rest.length > 0 && (
        <section id="people" className={`scroll-mt-[var(--hdr)] ${SEC}`}>
          <div className="shell inner">
            <div className="v2-rise mb-[clamp(30px,4vw,52px)] flex flex-wrap items-end justify-between gap-6">
              <div>
                <H2 a={v.gridTitle} b={v.gridAccent} className="mt-5" />
              </div>
              <p className="m-0 max-w-[40ch] text-[16px] leading-[1.6] text-slate">{v.gridLede}</p>
            </div>
            <PeopleGrid
              filter={false}
              people={rest.map((m) => ({
                name: m.name,
                role: m.role,
                practice: m.practice,
                practices: m.practices?.map((p) => ({ title: p.title, href: localeHref(lang, `/practices/${p.cat}/${p.slug}`) })),
                group: groupOf(m),
                /* портретний кроп 4:5 від верху кадру — голова не йде за край */
                photo: m.photoUrl ? `${m.photoUrl}?w=480&h=600&fit=crop&crop=top&auto=format&q=75` : undefined,
                photoWide: m.photoUrl ? `${m.photoUrl}?w=920&h=750&fit=crop&crop=top&auto=format&q=78` : undefined,
              }))}
            />

            {/* Плашка появляется, только пока фото реально нет. Раньше она
                стояла всегда и осталась бы висеть даже после фотосессии. */}
            {t.noPhotoNote && rest.some((m) => !m.photoUrl) && (
              <p className="m-0 mt-6 flex items-start gap-2.5 text-[13.5px] leading-relaxed text-slate-2">
                <Icon name="message" className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>
                  <Bold text={t.noPhotoNote} />
                </span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── КАРʼЄРА ── */}
      <section className={`${SEC} !pt-0`}>
        <div className="shell inner">
          <Band
            kicker={T.team.careerKicker}
            title={T.team.joinTitle}
            accent={T.team.joinAccent}
            text={T.team.joinText}
            actions={
              <ButtonLink href={career} variant="ghost" arrow>
                {T.common.vacancies}
              </ButtonLink>
            }
          />
        </div>
      </section>
    </PageShell>
  )
}
