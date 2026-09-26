import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { addNoteAction, setOwnerAction, setStatusAction } from '@/app/admin/actions'
import { CARD, LABEL, STATUS_TONE, StatusPill } from '@/components/admin/ui'
import { SLA_MINUTES, relTime, waited } from '@/lib/leads/format'
import { sourceLabel, telegramConfigured, telegramText } from '@/lib/leads/notify'
import { TEAM, leadStore } from '@/lib/leads/store'
import { STATUSES, STATUS_LABEL } from '@/lib/leads/types'
import { formatPhone } from '@/lib/leads/validate'

/**
 * Карточка обращения.
 *
 * Слева — всё о человеке в том порядке, в каком его читают перед
 * звонком: как связаться, что написал (или резюме). Справа — статус,
 * ответственный, откуда пришёл. Внизу — заметки и история.
 */

export const metadata: Metadata = { title: 'Звернення' }

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(n / 1024))} КБ`)

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await leadStore().get(id)
  if (!l) notFound()

  const now = Date.now()
  const digits = l.phone.replace(/\D/g, '')
  const late = l.type === 'client' && l.status === 'new' && now - new Date(l.createdAt).getTime() > SLA_MINUTES * 60_000
  const backHref = l.type === 'candidate' ? '/admin?type=candidate' : '/admin'

  const reach = [
    { label: 'Подзвонити', href: `tel:${l.phone}`, primary: true },
    { label: 'Viber', href: `viber://chat?number=%2B${digits}` },
    { label: 'Telegram', href: `https://t.me/+${digits}` },
    { label: 'WhatsApp', href: `https://wa.me/${digits}` },
    ...(l.email ? [{ label: 'Пошта', href: `mailto:${l.email}` }] : []),
  ]

  const feed = [
    ...l.history.map((h) => ({ ...h, kind: 'event' as const })),
    ...l.notes.map((n) => ({ ...n, kind: 'note' as const })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  return (
    <div className="grid gap-[clamp(16px,2vw,24px)]">
      <a href={backHref} className="justify-self-start text-[13px] text-slate hover:text-ink">
        ← {l.type === 'candidate' ? 'Усі резюме' : 'Усі заявки'}
      </a>

      <div className="grid items-start gap-[clamp(16px,2vw,24px)] min-[1000px]:grid-cols-[minmax(0,1fr)_340px]">
        {/* ═══════════ ЛЕВАЯ КОЛОНКА ═══════════ */}
        <div className="grid gap-[clamp(16px,2vw,24px)]">
          <section className={`${CARD} p-[clamp(18px,2.4vw,28px)]`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusPill status={l.status} />
              <span className={`text-[13px] ${late ? 'font-medium text-accent-ink' : 'text-slate-2'}`}>
                {late ? `чекає дзвінка ${waited(l.createdAt, now)}` : relTime(l.createdAt, now)}
              </span>
              {l.demo && <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[11px] text-slate-2">демо-запис</span>}
            </div>
            <h1 className="m-0 mt-3 text-[clamp(26px,3.4vw,36px)] leading-tight">{l.name}</h1>
            <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="whitespace-nowrap font-mono text-[15px] tabular-nums text-ink">{formatPhone(l.phone)}</span>
              {l.email && <span className="break-all text-[14px] text-slate">{l.email}</span>}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {reach.map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  className={`inline-flex min-h-10 items-center rounded-full px-4 text-[13.5px] transition-colors ${
                    r.primary ? 'bg-accent text-white hover:bg-accent-ink' : 'bg-paper text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] hover:bg-paper-2'
                  }`}
                >
                  {r.label}
                </a>
              ))}
            </div>
          </section>

          <section className={`${CARD} grid gap-5 p-[clamp(18px,2.4vw,28px)]`}>
            {l.type === 'candidate' ? (
              <>
                <div className="grid gap-1">
                  <span className={LABEL}>Позиція</span>
                  <p className="m-0 text-[16px] text-ink">{l.position ?? '—'}</p>
                </div>
                <div className="grid gap-1.5">
                  <span className={LABEL}>Резюме</span>
                  {l.cvFile ? (
                    l.cvFile.size > 0 ? (
                      <a
                        href={`/admin/leads/${l.id}/cv`}
                        className="inline-flex items-center gap-3 justify-self-start rounded-[10px] bg-paper px-4 py-3 text-[14.5px] text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] hover:bg-paper-2"
                      >
                        <span aria-hidden="true">📎</span>
                        {l.cvFile.name}
                        <span className="font-mono text-[12px] text-slate-2">{kb(l.cvFile.size)} · завантажити</span>
                      </a>
                    ) : (
                      <p className="m-0 text-[14.5px] text-ink">
                        📎 {l.cvFile.name} <span className="text-[13px] text-slate-2">— у демо-записі самого файлу немає</span>
                      </p>
                    )
                  ) : l.cvLink ? (
                    <a href={l.cvLink} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-[14.5px] text-accent-ink underline underline-offset-2">
                      {l.cvLink}
                    </a>
                  ) : (
                    <p className="m-0 text-[14px] text-slate-2">Не додано.</p>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <span className={LABEL}>Про себе</span>
                  {l.message ? (
                    <blockquote className="m-0 whitespace-pre-line border-l-2 border-accent pl-4 text-[15px] leading-relaxed text-ink">{l.message}</blockquote>
                  ) : (
                    <p className="m-0 text-[14px] text-slate-2">Не заповнено.</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-10 gap-y-4">
                  <div className="grid gap-1">
                    <span className={LABEL}>Напрям</span>
                    <p className="m-0 text-[16px] text-ink">{l.practiceTitle ?? 'Ще не знаю'}</p>
                    {l.categoryTitle && !(l.practiceTitle ?? '').startsWith(l.categoryTitle) && (
                      <p className="m-0 text-[13px] text-slate-2">{l.categoryTitle}</p>
                    )}
                  </div>
                  {l.packageName && (
                    <div className="grid gap-1">
                      <span className={LABEL}>Варіант послуги</span>
                      <p className="m-0 text-[16px] text-ink">{l.packageName}</p>
                    </div>
                  )}
                </div>
                <div className="grid gap-1.5">
                  <span className={LABEL}>Суть справи</span>
                  {l.message ? (
                    <blockquote className="m-0 whitespace-pre-line border-l-2 border-accent pl-4 text-[15px] leading-relaxed text-ink">{l.message}</blockquote>
                  ) : (
                    <p className="m-0 text-[14px] text-slate-2">Не заповнено — уточнити під час дзвінка.</p>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ── Заметки и история ── */}
          <section className={`${CARD} p-[clamp(18px,2.4vw,28px)]`}>
            <h2 className="m-0 text-[19px]">Нотатки та історія</h2>
            <form action={addNoteAction} className="mt-4 grid gap-2.5">
              <input type="hidden" name="id" value={l.id} />
              <textarea
                name="text"
                rows={3}
                required
                placeholder={l.type === 'candidate' ? 'Коли співбесіда, враження, рішення…' : 'Про що домовились, коли передзвонити…'}
                className="w-full resize-y rounded-[10px] border-0 bg-paper px-3.5 py-3 text-[14.5px] leading-relaxed text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] placeholder:text-slate-2 focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] focus:outline-none"
              />
              <button className="justify-self-start rounded-full border-0 bg-ink px-4 py-2 text-[13.5px] text-white">Додати нотатку</button>
            </form>

            <ol className="m-0 mt-6 grid list-none gap-0 p-0">
              {feed.map((f, i) => (
                <li key={`${f.at}-${i}`} className="relative grid grid-cols-[18px_1fr] gap-3 pb-5 last:pb-0">
                  {i < feed.length - 1 && <span className="absolute bottom-0 left-[8.5px] top-[18px] w-px bg-hair" aria-hidden="true" />}
                  <span
                    className={`mt-[5px] size-[9px] justify-self-center rounded-full ${f.kind === 'note' ? 'bg-accent' : 'bg-white shadow-[inset_0_0_0_1.5px_var(--color-slate-2)]'}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="m-0 text-[12px] text-slate-2">
                      {relTime(f.at, now)} · {f.author}
                    </p>
                    <p className={`m-0 mt-0.5 whitespace-pre-line leading-snug ${f.kind === 'note' ? 'text-[14.5px] text-ink' : 'text-[13.5px] text-slate'}`}>
                      {f.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* ═══════════ ПРАВАЯ КОЛОНКА ═══════════ */}
        <aside className="grid gap-[clamp(16px,2vw,24px)] min-[1000px]:sticky min-[1000px]:top-[76px]">
          <section className={`${CARD} p-[18px]`}>
            <span className={LABEL}>Статус</span>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {STATUSES.map((s) => {
                const on = s === l.status
                return (
                  <form key={s} action={setStatusAction}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="status" value={s} />
                    <button
                      disabled={on}
                      className={`flex w-full items-center gap-2 rounded-[10px] border-0 px-3 py-2.5 text-left text-[14px] transition-colors ${
                        on ? 'bg-ink text-white' : 'bg-paper text-ink hover:bg-paper-2'
                      }`}
                    >
                      <span className={`size-2 shrink-0 rounded-full ${on && s === 'done' ? 'bg-white' : STATUS_TONE[s].dot}`} />
                      {STATUS_LABEL[s]}
                    </button>
                  </form>
                )
              })}
            </div>
          </section>

          <section className={`${CARD} p-[18px]`}>
            <span className={LABEL}>Відповідальний</span>
            <form action={setOwnerAction} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={l.id} />
              <select
                name="owner"
                defaultValue={l.owner ?? ''}
                className="h-10 min-w-0 flex-1 rounded-[10px] border-0 bg-paper px-3 text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--color-hair)]"
              >
                <option value="">— не призначено —</option>
                {TEAM.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button className="h-10 rounded-[10px] border-0 bg-paper-2 px-3.5 text-[13px] text-ink hover:bg-hair-soft">Зберегти</button>
            </form>
          </section>

          <section className={`${CARD} p-[18px]`}>
            <span className={LABEL}>Джерело</span>
            <dl className="m-0 mt-3 grid gap-2.5 text-[13px]">
              <Meta k="Канал" v={sourceLabel(l)} />
              {l.source.utm?.term && <Meta k="Запит" v={l.source.utm.term} />}
              {l.source.landing && <Meta k="Сторінка входу" v={l.source.landing} mono />}
              {l.source.page && <Meta k="Форма на" v={l.source.page} mono />}
            </dl>
          </section>

          <details className={`${CARD} group p-[18px]`}>
            <summary className="flex cursor-pointer list-none items-center justify-between text-[13.5px] text-ink">
              Так прийде в Telegram
              <span className="text-slate-2 transition-transform group-open:rotate-180">⌄</span>
            </summary>
            <pre className="m-0 mt-3 whitespace-pre-wrap rounded-[10px] bg-[#e7f0f7] p-3.5 font-sans text-[13px] leading-relaxed text-[#1b2733]">
              {telegramText(l).replace(/<\/?b>/g, '')}
            </pre>
            <p className="m-0 mt-2.5 text-[12px] leading-snug text-slate-2">
              {telegramConfigured()
                ? 'Бот підключений: таке повідомлення приходить у чат одразу після звернення.'
                : 'Надсилається, коли задані TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID. Зараз не задані.'}
            </p>
          </details>
        </aside>
      </div>
    </div>
  )
}

function Meta({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3">
      <dt className="text-slate-2">{k}</dt>
      <dd className={`m-0 break-words text-ink ${mono ? 'font-mono text-[12px]' : ''}`}>{v}</dd>
    </div>
  )
}
