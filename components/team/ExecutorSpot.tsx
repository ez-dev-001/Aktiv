import type { ReactNode } from 'react'
import type { TeamMember } from '@/lib/sanity/content'
import type { Category } from '@/lib/content'
import { Chip, Kicker, RingAvatar } from '@/components/site/Blocks'
import { Bold } from '@/components/ui/Bold'
import { SpotMore } from './SpotMore'
import { ui } from '@/lib/ui'

/**
 * Виділений співробітник — темна заокруглена картка одразу під шапкою.
 *
 * Людина — перший з галочкою «Виділений співробітник» у Sanity (вибір
 * робить сторінка, як і getTeamPage для {name}/{role}). Тексти блоку —
 * зі «Сторінки «Команда»», фото/напрями/контакти — з картки людини.
 */
export function ExecutorSpot({
  member,
  kicker,
  title,
  text,
  categories,
  lang,
}: {
  member: TeamMember
  kicker: string
  title: string
  text: string
  categories: Category[]
  lang: string
}) {
  const t = ui(lang)
  const areas = splitAreas(member.practice)
  /* Напрям → сторінка категорії, якщо назва збігається з категорією.
     Підпис може бути й власною фразою з «Практика — підпис» — тоді
     плашка без посилання. */
  const linked = areas.map((label) => {
    const c = categories.find((x) => x.title.trim().toLowerCase() === label.toLowerCase())
    return { label, slug: c?.slug }
  })
  const base = lang === 'ua' ? '' : `/${lang}`
  /* Один напрям — форма одразу його обирає. */
  const one = linked.length === 1 ? linked[0]?.slug : undefined
  const ctaHref = one ? `?practice=cat:${one}#contact` : '#contact'

  const bio = member.bio?.trim()
  const phone = member.phone?.trim()
  const email = member.email?.trim()
  const hasMore = Boolean(bio || linked.length || phone || email)

  /* «Ім'я — роль …»: хвіст після тире курсивом, як у макеті. */
  const dash = title.indexOf(' — ')
  const head = dash > 0 ? title.slice(0, dash) : title
  const tail = dash > 0 ? title.slice(dash + 3) : ''

  return (
    <section id="executor" aria-labelledby="executor-title" className="pt-[clamp(56px,8vw,112px)]">
      <div className="shell inner">
        <div className="on-dark relative isolate grid items-center gap-[clamp(24px,4vw,56px)] overflow-hidden rounded-[28px] bg-ink p-[clamp(28px,4.6vw,64px)] text-white shadow-[0_40px_80px_-50px_rgb(11_7_16/0.7)] min-[860px]:grid-cols-[auto_minmax(0,1fr)]">
          {/* декоративний знак у куті: кільце + стріла */}
          <svg
            viewBox="-26.5 -19.5 300 220"
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[70px] -right-[90px] -z-[1] w-[380px] opacity-[0.12]"
          >
            <path d="M155.2 115.1 A 72 72 0 1 1 155.2 65.9" fill="none" stroke="#fa2163" strokeWidth="13" />
            <path d="M15 84.5 H187 L180.5 66 L237 88.5 L180.5 111 L187 92.5 H15 Z" fill="#fa2163" />
          </svg>

          <RingAvatar
            src={member.photoUrl ? `${member.photoUrl}?w=480&h=480&fit=crop&crop=top&auto=format&q=80` : undefined}
            name={member.name}
            className="size-[clamp(150px,20vw,230px)]"
          />

          <div className="min-w-0">
            <Kicker dark>{kicker}</Kicker>
            <h2
              id="executor-title"
              className="m-0 mt-3.5 font-serif text-[clamp(32px,4.6vw,56px)] font-normal leading-[1.05] tracking-[-0.02em] text-white [text-wrap:balance]"
            >
              {head}
              {tail && (
                <>
                  {' — '}
                  <em className="text-accent-soft">{tail}</em>
                </>
              )}
            </h2>
            <p className="m-0 mt-[18px] max-w-[56ch] text-[15.5px] leading-[1.65] text-on-dark">
              <Bold text={text} onDark />
            </p>

            {linked.length > 0 && (
              <ul aria-label={t.team.areas} className="m-0 mt-[22px] flex list-none flex-wrap gap-2 p-0">
                {linked.map((a) => (
                  <li key={a.label}>
                    <Chip dot dark>
                      {a.label}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}

            <SpotMore ctaHref={ctaHref} ctaLabel={t.common.discussCase} moreLabel={t.team.aboutLawyer}>
              {hasMore ? (
                <dl className="m-0 grid gap-5 min-[700px]:grid-cols-2">
                  <Row label={t.team.position}>
                    <span className="text-white">{member.role}</span>
                  </Row>
                  {linked.length > 0 && (
                    <Row label={t.team.areas}>
                      <span className="flex flex-col gap-1.5">
                        {linked.map((a) =>
                          a.slug ? (
                            <a
                              key={a.label}
                              href={`${base}/practices/${a.slug}`}
                              className="text-white underline decoration-accent decoration-1 underline-offset-4 hover:text-accent-soft"
                            >
                              {a.label}
                            </a>
                          ) : (
                            <span key={a.label} className="text-white">
                              {a.label}
                            </span>
                          ),
                        )}
                      </span>
                    </Row>
                  )}
                  {phone && (
                    <Row label={t.team.directPhone}>
                      <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="text-white hover:text-accent-soft">
                        {phone}
                      </a>
                    </Row>
                  )}
                  {email && (
                    <Row label={t.common.email}>
                      <a href={`mailto:${email}`} className="break-all text-white hover:text-accent-soft">
                        {email}
                      </a>
                    </Row>
                  )}
                  {bio && (
                    <div className="min-[700px]:col-span-2">
                      <dt className=" text-[13px] text-on-dark-2">{t.team.aboutSpecialist}</dt>
                      <dd className="m-0 mt-2 max-w-[64ch] whitespace-pre-line text-[15px] leading-[1.65] text-on-dark">{bio}</dd>
                    </div>
                  )}
                </dl>
              ) : null}
            </SpotMore>
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className=" text-[13px] text-on-dark-2">{label}</dt>
      <dd className="m-0 mt-2 text-[15px] leading-[1.5]">{children}</dd>
    </div>
  )
}

/** «А · Б та ін.» / «A · B etc.» → ['А', 'Б']: підпис practice збирає getTeam. */
function splitAreas(line?: string): string[] {
  if (!line) return []
  return line
    .replace(/\s+(та ін|etc)\.?$/, '')
    .split(' · ')
    .map((s) => s.trim())
    .filter(Boolean)
}
