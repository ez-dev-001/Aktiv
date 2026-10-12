import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { getCategories, getTeam, getTeamPage, type TeamMember } from '@/lib/sanity/content'
import { PageShell } from '@/components/site/PageShell'
import { DownLink, HeroActions, PageHero } from '@/components/site/PageHero'
import { Band, SEC, SecHead } from '@/components/site/Blocks'
import { ButtonLink } from '@/components/ui/Button'
import { Bold } from '@/components/ui/Bold'
import { Icon } from '@/components/site/Icon'
import { ExecutorSpot } from '@/components/team/ExecutorSpot'
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
  const executor = team.find((m) => m.highlight)
  const rest = team.filter((m) => m !== executor)
  const home = lang === 'ua' ? '/' : `/${lang}`
  const career = lang === 'ua' ? '/career' : `/${lang}/career`
  const T = ui(lang)

  return (
    <PageShell lang={lang} overDark>
      <PageHero
        crumbs={[{ label: T.common.home, href: home }, { label: T.common.team }]}
        lang={lang}
        title={t.headTitle}
        accent={t.headTitleAccent}
        lede={<Bold text={t.headLede} onDark />}
      >
        <HeroActions>
          <ButtonLink
            href="#contact"
            arrow
            className="min-h-[54px] shadow-[0_14px_34px_-14px_rgb(224_16_85/0.7)] max-[640px]:w-full"
          >
            {t.ctaPrimary}
          </ButtonLink>
          <DownLink href="#people">{T.team.specialists}</DownLink>
        </HeroActions>
      </PageHero>

      {/* ── ВИДІЛЕНИЙ СПІВРОБІТНИК ── одразу під шапкою, перед сіткою */}
      {executor && (
        <ExecutorSpot
          member={executor}
          kicker={t.executorKicker}
          title={t.executorTitle}
          text={t.executorText}
          categories={cats}
          lang={lang}
        />
      )}

      {/* ── УСІ ФАХІВЦІ ── */}
      {rest.length > 0 && (
        <section id="people" className={`scroll-mt-[var(--hdr)] ${SEC}`}>
          <div className="shell inner">
            <SecHead
              eyebrow={`${t.peopleEyebrow} · ${team.length}`}
              title={t.peopleTitle}
              lede={t.peopleLede}
              row
            />
            <PeopleGrid
              people={rest.map((m) => ({
                name: m.name,
                role: m.role,
                group: groupOf(m),
                /* портретний кроп 4:5 від верху кадру — голова не йде за край */
                photo: m.photoUrl ? `${m.photoUrl}?w=480&h=600&fit=crop&crop=top&auto=format&q=75` : undefined,
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
