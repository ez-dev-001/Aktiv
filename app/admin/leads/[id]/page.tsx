import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { addNoteAction, convertAction, setKindAction, setOwnerAction, setStatusAction } from '@/app/admin/actions'
import { CARD, KindTag, LABEL, STATUS_TONE, StatusPill } from '@/components/admin/ui'
import { relTime, waited, SLA_MINUTES } from '@/lib/leads/format'
import { sourceLabel, telegramText } from '@/lib/leads/notify'
import { TEAM, leadStore } from '@/lib/leads/store'
import { FORMAT_LABEL, KIND_LABEL, PIPELINE, STATUS_HINT, STATUS_LABEL } from '@/lib/leads/types'
import { formatPhone } from '@/lib/leads/validate'

/**
 * Карточка заявки.
 *
 * Слева — всё о человеке и деле в том порядке, в каком юрист это
 * читает перед звонком: как связаться, что написал, что посчитал
 * калькулятор. Справа — управление: стадия, ответственный, откуда
 * пришёл. Внизу — заметки и история: кто что сделал и когда.
 */

export const metadata: Metadata = { title: 'Заявка' }

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const l = await leadStore().get(id)
  if (!l) notFound()

  const now = Date.now()
  const digits = l.phone.replace(/\D/g, '')
  const late = l.status === 'new' && now - new Date(l.createdAt).getTime() > SLA_MINUTES * 60_000

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
      <a href={l.kind === 'order' ? '/admin?kind=order' : '/admin'} className="justify-self-start text-[13px] text-slate hover:text-ink">
        ← {l.kind === 'order' ? 'Усі заявки на послуги' : 'Усі консультації'}
      </a>

      <div className="grid items-start gap-[clamp(16px,2vw,24px)] min-[1000px]:grid-cols-[minmax(0,1fr)_360px]">
        {/* ═══════════ ЛЕВАЯ КОЛОНКА ═══════════ */}
        <div className="grid gap-[clamp(16px,2vw,24px)]">
          <section className={`${CARD} p-[clamp(18px,2.4vw,28px)]`}>
            <div className="flex flex-wrap items-center gap-2.5">
              <KindTag kind={l.kind} />
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

          {/* ── Связь консультации и заявки ── */}
          {(l.convertedTo || l.convertedFrom) && (
            <a
              href={`/admin/leads/${l.convertedTo ?? l.convertedFrom}`}
              className={`${CARD} group flex items-center justify-between gap-4 px-[clamp(18px,2.4vw,28px)] py-4 transition-colors hover:bg-paper`}
            >
              <span className="grid gap-0.5">
                <span className={LABEL}>{l.convertedTo ? 'Консультація стала заявкою' : 'Заявка виросла з консультації'}</span>
                <span className="text-[14.5px] text-ink">
                  {l.convertedTo ? 'Відкрити заявку на послугу' : 'Відкрити консультацію'}
                </span>
              </span>
              <span className="text-[18px] text-accent-ink transition-transform group-hover:translate-x-1">→</span>
            </a>
          )}

          <section className={`${CARD} grid gap-5 p-[clamp(18px,2.4vw,28px)]`}>
            {(l.format || l.packageName) && (
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {l.format && (
                  <div className="grid gap-1">
                    <span className={LABEL}>Формат консультації</span>
                    <p className="m-0 text-[16px] text-ink">{FORMAT_LABEL[l.format]}</p>
                  </div>
                )}
                {l.packageName && (
                  <div className="grid gap-1">
                    <span className={LABEL}>Обраний пакет</span>
                    <p className="m-0 text-[16px] text-ink">{l.packageName}</p>
                  </div>
                )}
              </div>
            )}
            <div className="grid gap-1">
              <span className={LABEL}>{l.kind === 'consultation' ? 'Тема' : 'Напрям'}</span>
              <p className="m-0 text-[16px] text-ink">{l.practiceTitle}</p>
              {l.categoryTitle && !l.practiceTitle.startsWith(l.categoryTitle) && <p className="m-0 text-[13px] text-slate-2">{l.categoryTitle}</p>}
            </div>
            <div className="grid gap-1.5">
              <span className={LABEL}>Суть справи</span>
              {l.message ? (
                <blockquote className="m-0 whitespace-pre-line border-l-2 border-accent pl-4 text-[15px] leading-relaxed text-ink">{l.message}</blockquote>
              ) : (
                <p className="m-0 text-[14px] text-slate-2">Не заповнено — уточнити під час дзвінка.</p>
              )}
            </div>

            {l.quote && (
              <div className="grid gap-3 rounded-[12px] bg-paper p-[clamp(14px,2vw,20px)]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className={LABEL}>Калькулятор · {l.quote.practice}</span>
                  {!l.quote.complete && <span className="text-[12px] text-accent-ink">не всі відповіді</span>}
                </div>
                <p className="m-0 font-serif text-[clamp(22px,2.8vw,28px)] font-semibold leading-none text-accent-ink">{l.quote.label}</p>
                {l.quote.breakdown && (
                  <dl className="m-0 grid gap-2 border-t border-hair pt-3">
                    {l.quote.breakdown.map((b) => (
                      <div key={b.q} className="grid gap-x-4 gap-y-0.5 min-[640px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <dt className="text-[13px] text-slate">{b.q}</dt>
                        <dd className="m-0 text-[13.5px] text-ink">{b.a}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className="m-0 text-[12px] leading-snug text-slate-2">
                  Сума перерахована сервером із відповідей — браузер її не передає. Середина діапазону йде в «Потенціал воронки».
                </p>
              </div>
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
                placeholder="Про що домовились, що попросили надіслати, коли передзвонити…"
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
            <span className={LABEL}>Стадія</span>
            <div className="mt-3 grid gap-1.5">
              {/* «Стала заявкою» руками не ставится — только кнопкой
                  перевода ниже, иначе консультация числилась бы
                  успешной без заявки, в которую она выросла. */}
              {PIPELINE[l.kind].filter((s) => s !== 'converted' || s === l.status).map((s) => {
                const on = s === l.status
                return (
                  <form key={s} action={setStatusAction}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="status" value={s} />
                    <button
                      disabled={on}
                      className={`flex w-full items-center gap-2.5 rounded-[10px] border-0 px-3 py-2.5 text-left text-[14px] transition-colors ${
                        on ? 'bg-ink text-white' : 'bg-transparent text-ink hover:bg-paper'
                      }`}
                    >
                      <span className={`size-2 rounded-full ${on && (s === 'contract' || s === 'converted') ? 'bg-white' : STATUS_TONE[s].dot}`} />
                      {STATUS_LABEL[s]}
                      {on && <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-white/60">зараз</span>}
                    </button>
                  </form>
                )
              })}
            </div>
            <p className="m-0 mt-3 border-t border-hair-soft pt-3 text-[12.5px] leading-snug text-slate">{STATUS_HINT[l.kind][l.status]}</p>

            {l.kind === 'consultation' && !l.convertedTo && (
              <form action={convertAction} className="mt-3">
                <input type="hidden" name="id" value={l.id} />
                <button className="flex w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-accent px-3 py-3 text-[14px] font-medium text-white transition-colors hover:bg-accent-ink">
                  Перевести в заявку на послугу →
                </button>
                <p className="m-0 mt-2 text-[12px] leading-snug text-slate-2">
                  Створить заявку з тими ж контактами й темою на стадії «Консультація». Ця консультація стане «Стала заявкою».
                </p>
              </form>
            )}
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

          {!l.convertedTo && !l.convertedFrom && (
            <section className={`${CARD} p-[18px]`}>
              <span className={LABEL}>Тип звернення</span>
              <p className="m-0 mt-2 text-[14px] text-ink">{KIND_LABEL[l.kind]}</p>
              <form action={setKindAction} className="mt-2.5">
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="kind" value={l.kind === 'order' ? 'consultation' : 'order'} />
                <button className="rounded-full border-0 bg-paper px-3.5 py-2 text-[12.5px] text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] hover:bg-paper-2">
                  Насправді це {l.kind === 'order' ? 'консультація' : 'заявка на послугу'}
                </button>
              </form>
              <p className="m-0 mt-2 text-[12px] leading-snug text-slate-2">
                Для звернень, що потрапили не в ту воронку. Спільні стадії зберігаються.
              </p>
            </section>
          )}

          <section className={`${CARD} p-[18px]`}>
            <span className={LABEL}>Джерело</span>
            <dl className="m-0 mt-3 grid gap-2.5 text-[13px]">
              <Meta k="Канал" v={sourceLabel(l)} />
              {l.source.utm?.term && <Meta k="Запит" v={l.source.utm.term} />}
              {l.source.landing && <Meta k="Сторінка входу" v={l.source.landing} mono />}
              {l.source.page && <Meta k="Форма на" v={l.source.page} mono />}
              <Meta k="Форма" v={l.source.formLocation === 'quiz_result' ? 'після калькулятора' : 'контактна'} />
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
              {process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
                ? 'Бот підключений: таке повідомлення приходить у чат одразу після заявки.'
                : 'Надсилається, коли задані TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID. Зараз не задані.'}
            </p>
          </details>

          <p className="m-0 px-1 font-mono text-[10.5px] leading-relaxed text-slate-2">
            id {l.id}
            <br />
            event_id {l.eventId}
          </p>
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
