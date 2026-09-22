import { CARD, LABEL, STATUS_TONE, StatusPill } from '@/components/admin/ui'
import { SLA_MINUTES, money, relTime, waited } from '@/lib/leads/format'
import { sourceLabel } from '@/lib/leads/notify'
import { TEAM, leadStore } from '@/lib/leads/store'
import { FORMAT_LABEL, KINDS, KIND_PLURAL, OPEN_STATUSES, PIPELINE, STATUS_LABEL, type Lead, type LeadKind, type LeadStatus } from '@/lib/leads/types'
import { formatPhone } from '@/lib/leads/validate'

/**
 * Список обращений — главный экран CRM.
 *
 * Две воронки: бесплатные консультации и заявки на услуги. Переключатель
 * сверху, у каждой свои стадии и свои цифры — см. lib/leads/types.ts,
 * почему их нельзя смешивать.
 *
 * Сверху то, что требует действия сейчас: сколько новых и сколько из
 * них ждут звонка дольше 30 минут. Ниже воронка вкладками и таблица.
 *
 * Фильтры — обычные ссылки и GET-форма: адрес вида
 * /admin?status=new&owner=… можно сохранить в закладки или переслать
 * коллеге, и он откроет ровно тот же список.
 */

type Search = { kind?: string; status?: string; q?: string; owner?: string }

function href(base: Search, patch: Search) {
  const p = new URLSearchParams()
  const next = { ...base, ...patch }
  for (const [k, v] of Object.entries(next)) if (v) p.set(k, v)
  const s = p.toString()
  return s ? `/admin?${s}` : '/admin'
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const everything = await leadStore().list()
  const now = Date.now()

  const kind: LeadKind = sp.kind === 'order' ? 'order' : 'consultation'
  const all = everything.filter((l) => l.kind === kind)
  const pipe = PIPELINE[kind]
  const status = pipe.includes(sp.status as LeadStatus) ? (sp.status as LeadStatus) : undefined
  const q = (sp.q ?? '').trim().toLowerCase()
  const qDigits = q.replace(/\D/g, '')
  const owner = sp.owner && (TEAM.includes(sp.owner) || sp.owner === 'none') ? sp.owner : undefined

  const scoped = all.filter((l) => {
    if (owner === 'none' ? l.owner : owner && l.owner !== owner) return false
    if (!q) return true
    return (
      l.name.toLowerCase().includes(q) ||
      l.practiceTitle.toLowerCase().includes(q) ||
      (qDigits.length >= 3 && l.phone.includes(qDigits)) ||
      (l.email ?? '').toLowerCase().includes(q)
    )
  })
  const rows = status ? scoped.filter((l) => l.status === status) : scoped
  const count = (s: LeadStatus) => scoped.filter((l) => l.status === s).length

  /* ── Цифры сверху ── */
  const fresh = all.filter((l) => l.status === 'new')
  const overdue = fresh.filter((l) => now - new Date(l.createdAt).getTime() > SLA_MINUTES * 60_000)
  const week = all.filter((l) => now - new Date(l.createdAt).getTime() < 7 * 86_400_000)
  const winStatus: LeadStatus = kind === 'order' ? 'contract' : 'converted'
  const decided = all.filter((l) => l.status === winStatus || l.status === 'lost')
  const won = all.filter((l) => l.status === winStatus)
  const pipeline = all.filter((l) => OPEN_STATUSES.includes(l.status)).reduce((s, l) => s + (l.quote?.expectedValue ?? 0), 0)
  const unpriced = all.filter((l) => OPEN_STATUSES.includes(l.status) && !l.quote?.expectedValue).length
  const scheduled = all.filter((l) => l.status === 'scheduled')
  const held = all.filter((l) => l.status === 'held')

  /* Новые в каждой воронке — для счётчиков на переключателе. */
  const freshOf = (k: LeadKind) => everything.filter((l) => l.kind === k && l.status === 'new').length

  const base: Search = { kind: kind === 'order' ? 'order' : undefined, status, q: sp.q, owner }

  return (
    <div className="grid gap-[clamp(18px,2.4vw,28px)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* ── Переключатель воронок ──
            Две крупные вкладки, а не фильтр в ряду прочих: это не
            срез одного списка, а два разных рабочих места. */}
        <nav aria-label="Воронки" className="flex flex-wrap gap-x-7 gap-y-2">
          {KINDS.map((k) => {
            const on = k === kind
            const n = freshOf(k)
            return (
              <a
                key={k}
                href={k === 'order' ? '/admin?kind=order' : '/admin'}
                aria-current={on ? 'page' : undefined}
                className={`group relative flex items-baseline gap-2.5 pb-1.5 ${on ? 'text-ink' : 'text-slate-2 hover:text-ink'}`}
              >
                <span className="font-serif text-[clamp(24px,3.2vw,34px)] font-semibold leading-tight">{KIND_PLURAL[k]}</span>
                {n > 0 && (
                  <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums ${on ? 'bg-accent text-white' : 'bg-accent-wash text-accent-ink'}`}>
                    {n} нов.
                  </span>
                )}
                <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-transparent group-hover:bg-hair'}`} />
              </a>
            )
          })}
        </nav>
        <form action="/admin" className="flex w-full max-w-[420px] items-center gap-2">
          {kind === 'order' && <input type="hidden" name="kind" value="order" />}
          {status && <input type="hidden" name="status" value={status} />}
          {owner && <input type="hidden" name="owner" value={owner} />}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Імʼя, телефон, пошта або напрям"
            className="h-10 w-full rounded-[10px] border-0 bg-white px-3.5 text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] placeholder:text-slate-2 focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] focus:outline-none"
          />
          <button className="h-10 shrink-0 rounded-[10px] border-0 bg-ink px-4 text-[13.5px] text-white">Знайти</button>
        </form>
      </div>

      {/* ── Показатели ── */}
      <div className="grid grid-cols-2 gap-2.5 min-[560px]:gap-3 min-[1060px]:grid-cols-4">
        <Kpi
          label="Нові, без дзвінка"
          value={String(fresh.length)}
          note={
            overdue.length
              ? `${overdue.length} чекають довше ${SLA_MINUTES} хв — найдовше ${waited(overdue[overdue.length - 1]!.createdAt, now)}`
              : 'усі в межах 30 хвилин'
          }
          alert={overdue.length > 0}
          href={href({ kind: base.kind }, { status: 'new' })}
        />
        {kind === 'order' ? (
          <>
            <Kpi label="За 7 днів" value={String(week.length)} note={`із них ${week.filter((l) => l.quote).length} з розрахунком калькулятора`} />
            <Kpi
              label="Конверсія в договір"
              value={decided.length ? `${Math.round((won.length / decided.length) * 100)} %` : '—'}
              note={`${won.length} договорів із ${decided.length} закритих`}
            />
            <Kpi
              label="Потенціал воронки"
              value={money(pipeline)}
              note={`за серединою діапазону калькулятора${unpriced ? ` · ще ${unpriced} без суми` : ''}`}
            />
          </>
        ) : (
          <>
            <Kpi
              label="Призначені"
              value={String(scheduled.length)}
              note={held.length ? `ще ${held.length} проведені, чекають рішення` : 'дату й формат — у нотатках'}
              href={href(base, { status: 'scheduled' })}
            />
            <Kpi label="За 7 днів" value={String(week.length)} note={`${week.filter((l) => l.format === 'online').length} онлайн · ${week.filter((l) => l.format === 'office').length} в офісі`} />
            <Kpi
              label="Стали заявками"
              value={decided.length ? `${Math.round((won.length / decided.length) * 100)} %` : '—'}
              note={`${won.length} з ${decided.length} закритих консультацій`}
            />
          </>
        )}
      </div>

      {/* ── Воронка вкладками ── */}
      <div className={`${CARD} overflow-hidden`}>
        <nav aria-label="Стадії" className="flex overflow-x-auto border-b border-hair-soft [scrollbar-width:none]">
          <Tab href={href(base, { status: undefined })} on={!status} label="Усі" n={scoped.length} />
          {pipe.map((s) => (
            <Tab key={s} href={href(base, { status: s })} on={status === s} label={STATUS_LABEL[s]} n={count(s)} dot={STATUS_TONE[s].dot} />
          ))}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 px-3">
            <span className="hidden text-[12.5px] text-slate-2 min-[900px]:inline">Відповідальний:</span>
            {[
              { v: undefined, l: 'усі' },
              ...TEAM.map((t) => ({ v: t, l: t.split(' ')[0]! })),
              { v: 'none', l: 'нікого' },
            ].map((o) => (
              <a
                key={o.l}
                href={href(base, { owner: o.v })}
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] ${owner === o.v ? 'bg-ink text-white' : 'text-slate hover:bg-paper-2'}`}
              >
                {o.l}
              </a>
            ))}
          </div>
        </nav>

        {rows.length === 0 ? (
          <p className="m-0 px-5 py-14 text-center text-[14.5px] text-slate">
            {q ? `За запитом «${sp.q}» нічого немає.` : 'Тут поки порожньо.'}
          </p>
        ) : (
          <ul className="m-0 list-none p-0">
            {rows.map((l) => (
              <Row key={l.id} lead={l} now={now} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, note, alert, href }: { label: string; value: string; note: string; alert?: boolean; href?: string }) {
  const body = (
    <>
      <span className={LABEL}>{label}</span>
      <span className={`font-serif text-[clamp(22px,3vw,32px)] font-semibold leading-none tabular-nums ${alert ? 'text-accent-ink' : 'text-ink'}`}>{value}</span>
      <span className={`text-[12px] leading-snug min-[560px]:text-[12.5px] ${alert ? 'text-accent-ink' : 'text-slate-2'}`}>{note}</span>
    </>
  )
  const cls = `${CARD} grid content-start gap-2 p-[14px] min-[560px]:gap-2.5 min-[560px]:p-[18px] ${alert ? 'shadow-[inset_0_0_0_1.5px_rgb(250_33_99/0.4)]' : ''}`
  return href ? (
    <a href={href} className={`${cls} transition-transform hover:-translate-y-px`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  )
}

function Tab({ href, on, label, n, dot }: { href: string; on: boolean; label: string; n: number; dot?: string }) {
  return (
    <a
      href={href}
      aria-current={on ? 'page' : undefined}
      className={`relative flex shrink-0 items-center gap-2 px-4 py-3.5 text-[13.5px] transition-colors ${on ? 'text-ink' : 'text-slate hover:text-ink'}`}
    >
      {dot && <span className={`size-1.5 rounded-full ${dot}`} />}
      {label}
      <span className={`rounded-full px-1.5 font-mono text-[11px] tabular-nums ${on ? 'bg-ink text-white' : 'bg-paper-2 text-slate-2'}`}>{n}</span>
      {on && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-accent" />}
    </a>
  )
}

function Row({ lead: l, now }: { lead: Lead; now: number }) {
  const late = l.status === 'new' && now - new Date(l.createdAt).getTime() > SLA_MINUTES * 60_000
  return (
    <li className="border-b border-hair-soft last:border-b-0">
      <a
        href={`/admin/leads/${l.id}`}
        className="grid gap-x-5 gap-y-1.5 px-[clamp(14px,2vw,22px)] py-3.5 transition-colors hover:bg-paper min-[980px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1fr)_128px] min-[980px]:items-center"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className={`mt-px size-2 shrink-0 rounded-full ${l.status === 'new' ? 'bg-accent' : 'bg-transparent'}`} aria-hidden="true" />
          <div className="min-w-0">
            <p className="m-0 truncate text-[15px] font-medium text-ink">{l.name}</p>
            <p className="m-0 font-mono text-[12px] tabular-nums text-slate">{formatPhone(l.phone)}</p>
          </div>
        </div>
        <div className="min-w-0 pl-5 min-[980px]:pl-0">
          <p className="m-0 truncate text-[14px] text-ink">{l.practiceTitle}</p>
          <p className="m-0 truncate text-[12.5px] text-slate-2">
            {l.kind === 'consultation' && l.format && <span className="text-slate">{FORMAT_LABEL[l.format]} · </span>}
            {l.packageName && <span className="text-slate">Пакет «{l.packageName}» · </span>}
            {l.quote ? <span className="font-mono text-accent-ink">{l.quote.label}</span> : (l.message ?? 'без опису')}
          </p>
        </div>
        <div className="min-w-0 pl-5 text-[12.5px] leading-snug min-[980px]:pl-0">
          <p className={`m-0 ${late ? 'font-medium text-accent-ink' : 'text-slate'}`}>
            {late ? `чекає ${waited(l.createdAt, now)}` : relTime(l.createdAt, now)}
          </p>
          <p className="m-0 truncate text-slate-2">
            {l.convertedFrom ? 'з консультації' : sourceLabel(l)}
            {l.owner ? ` · ${l.owner.split(' ')[0]}` : ''}
          </p>
        </div>
        <div className="pl-5 min-[980px]:justify-self-end min-[980px]:pl-0">
          <StatusPill status={l.status} />
        </div>
      </a>
    </li>
  )
}
