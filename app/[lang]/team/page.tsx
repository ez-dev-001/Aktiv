import type { Metadata } from 'next'
import { getTeam, getTeamPage, teamPhoto } from '@/lib/sanity/content'
import { PageHead, PageShell, SectionHead } from '@/components/site/PageShell'
import { ButtonLink } from '@/components/ui/Button'
import { Bold } from '@/components/ui/Bold'
import { Icon } from '@/components/site/Icon'

export const metadata: Metadata = {
  title: 'Команда',
  description:
    'Фахівці ЮК «АКТИВ»: партнери, адвокати, військовий юрист і приватний виконавець у штаті. Справу веде конкретна людина, а не відділ.',
}

/**
 * Станции линии дела.
 *
 * Порядок — как блоки идут на странице: выделенный сотрудник стоит выше
 * «Фахівців». Линия строит путь по документу и переживёт ошибку в этом
 * массиве, но подписи станций читаются сверху вниз именно отсюда.
 *
 * Подпись станции выделенного сотрудника — его должность из карточки,
 * а не слово «Виконавець» из кода. Блок теперь может быть о ком угодно,
 * и станция «Виконавець» рядом с управляющим партнёром врала бы.
 * Нет выделенного — нет и станции: блока на странице тогда тоже нет.
 */
function stations(featuredRole?: string) {
  return [
    { id: 'head', label: 'Команда' },
    ...(featuredRole ? [{ id: 'executor', label: featuredRole }] : []),
    { id: 'people', label: 'Фахівці' },
    { id: 'contact', label: 'Консультація' },
  ]
}

const initials = (n: string) =>
  n
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

export default async function TeamPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  /* Sanity, если в нём есть люди; иначе статика — форма данных одна. */
  const { data: team } = await getTeam(lang)
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

  return (
    <PageShell lang={lang} stations={stations(executor?.role)} overDark>
      <PageHead
        photo="table"
        eyebrow={t.headEyebrow}
        title={
          <>
            {t.headTitle}{' '}
            <span className="font-normal italic text-accent-soft">{t.headTitleAccent}</span>
          </>
        }
        lede={<Bold text={t.headLede} onDark />}
      />

      {/* ── ПРИВАТНИЙ ВИКОНАВЕЦЬ ── */}
      {executor && (
        <section id="executor" className="on-dark bg-ink py-[clamp(44px,6vw,80px)] text-on-dark">
          <div className="shell inner">
            <div className="grid items-center gap-[clamp(24px,4vw,56px)] min-[760px]:grid-cols-[auto_1fr]">
              {teamPhoto(executor.photoUrl, 600) ? (
                <div className="size-[clamp(96px,14vw,150px)] shrink-0 overflow-hidden rounded-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={teamPhoto(executor.photoUrl, 600)}
                    alt={executor.name}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="grid size-[clamp(96px,14vw,150px)] shrink-0 place-items-center rounded-sm bg-white/[0.06] font-serif text-[clamp(32px,5vw,46px)] font-semibold text-white shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]">
                  {initials(executor.name)}
                </div>
              )}
              <div>
                <p className="eyebrow">{t.executorKicker}</p>
                <h2 className="max-w-[24ch] text-[clamp(22px,3.6vw,34px)] leading-[1.14] !text-white">
                  {t.executorTitle}
                </h2>
                <p className="mt-4 max-w-[52ch] text-[15.5px] leading-relaxed text-on-dark">
                  <Bold text={t.executorText} onDark />
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── УСІ ФАХІВЦІ ── */}
      <section id="people" className="py-[clamp(52px,7vw,104px)]">
        <div className="shell inner">
          <SectionHead eyebrow={t.peopleEyebrow} title={t.peopleTitle} lede={t.peopleLede} />
          <div className="grid gap-[clamp(8px,1.1vw,14px)] grid-cols-2 min-[560px]:grid-cols-3 min-[900px]:grid-cols-4">
            {rest.map((m) => (
              <article
                key={m.name}
                className="flex flex-col gap-3.5 rounded-[12px] bg-white p-[clamp(12px,1.4vw,18px)] shadow-[inset_0_0_0_1px_var(--color-hair)]"
              >
                {teamPhoto(m.photoUrl, 480) ? (
                  <div className="aspect-square overflow-hidden rounded-[8px] bg-paper-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={teamPhoto(m.photoUrl, 480)}
                      alt={m.name}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="grid aspect-square place-items-center rounded-[8px] bg-paper-2 font-serif text-[clamp(24px,3vw,32px)] font-semibold tracking-[0.02em] text-ink">
                    {initials(m.name)}
                  </div>
                )}
                <div>
                  <h3 className="font-serif text-[16.5px] font-semibold leading-tight text-ink">{m.name}</h3>
                  <p className="m-0 mt-1 text-[12.5px] leading-snug text-slate">{m.role}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Плашка появляется, только пока фото реально нет. Раньше она
              стояла всегда и осталась бы висеть даже после фотосессии. */}
          {t.noPhotoNote && rest.some((m) => !m.photoUrl) && (
            <p className="mt-6 flex items-start gap-2.5 text-[13.5px] leading-relaxed text-slate-2">
              <Icon name="message" className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>
                <Bold text={t.noPhotoNote} />
              </span>
            </p>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="bg-paper-2 py-[clamp(48px,7vw,96px)]">
        <div className="shell inner">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <div>
              <h2 className="max-w-[22ch] text-[clamp(22px,3.6vw,34px)] leading-[1.14]">
                {t.ctaTitle}
              </h2>
              <p className="mt-4 max-w-[46ch] text-[15px] text-slate">{t.ctaText}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href={lang === 'ua' ? '/#contact' : `/${lang}/#contact`} arrow>
                {t.ctaPrimary}
              </ButtonLink>
              <ButtonLink href={lang === 'ua' ? '/about' : `/${lang}/about`} variant="ghost">
                {t.ctaSecondary}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
