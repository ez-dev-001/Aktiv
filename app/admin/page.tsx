import { CARD, STATUS_TONE, StatusPill } from '@/components/admin/ui'
import { SLA_MINUTES, relTime, waited } from '@/lib/leads/format'
import { sourceLabel } from '@/lib/leads/notify'
import { TEAM, leadStore } from '@/lib/leads/store'
import { LEAD_TYPES, STATUSES, STATUS_LABEL, TYPE_LABEL, type Lead, type LeadStatus, type LeadType } from '@/lib/leads/types'
import { formatPhone } from '@/lib/leads/validate'

/**
 * Список обращений — главный экран CRM.
 *
 * Простой по задумке: две вкладки (клиенты и резюме), четыре статуса,
 * поиск. Без воронок, сумм и графиков. Сверху — одна строка-напоминание,
 * только если есть новые обращения, которые ждут звонка дольше 30 минут.
 *
 * Фильтры — обычные ссылки и GET-форма: адрес вида
 * /admin?type=candidate&status=new можно сохранить в закладки или
 * переслать коллеге, и он откроет ровно тот же список.
 */

type Search = { type?: string; status?: string; q?: string; owner?: string }

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

  const type: LeadType = sp.type === 'candidate' ? 'candidate' : 'client'
  const all = everything.filter((l) => l.type === type)
  const status = STATUSES.includes(sp.status as LeadStatus) ? (sp.status as LeadStatus) : undefined
  const q = (sp.q ?? '').trim().toLowerCase()
  const qDigits = q.replace(/\D/g, '')
  const owner = sp.owner && (TEAM.includes(sp.owner) || sp.owner === 'none') ? sp.owner : undefined

  const scoped = all.filter((l) => {
    if (owner === 'none' ? l.owner : owner && l.owner !== owner) return false
    if (!q) return true
    return (
      l.name.toLowerCase().includes(q) ||
      (l.practiceTitle ?? '').toLowerCase().includes(q) ||
      (l.position ?? '').toLowerCase().includes(q) ||
      (qDigits.length >= 3 && l.phone.includes(qDigits)) ||
      (l.email ?? '').toLowerCase().includes(q)
    )
  })
  const rows = status ? scoped.filter((l) => l.status === status) : scoped
  const count = (s: LeadStatus) => scoped.filter((l) => l.status === s).length
  const freshOf = (t: LeadType) => everything.filter((l) => l.type === t && l.status === 'new').length

  /* Напоминание: новые клиенты, которым не перезвонили за 30 минут. */
  const overdue = everything.filter(
    (l) => l.type === 'client' && l.status === 'new' && now - new Date(l.createdAt).getTime() > SLA_MINUTES * 60_000,
  )

  const base: Search = { type: type === 'candidate' ? 'candidate' : undefined, status, q: sp.q, owner }

  return (
    <div className="grid gap-[clamp(16px,2.2vw,24px)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Две вкладки: клиенты и резюме. Счётчик — только новые. */}
        <nav aria-label="Розділи" className="flex gap-1 rounded-full bg-paper-2 p-1">
          {LEAD_TYPES.map((t) => {
            const on = t === type
            const n = freshOf(t)
            return (
              <a
                key={t}
                href={t === 'candidate' ? '/admin?type=candidate' : '/admin'}
                aria-current={on ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-[14px] transition-colors ${
                  on ? 'bg-white text-ink shadow-[0_1px_3px_rgb(11_7_16/0.08)]' : 'text-slate hover:text-ink'
                }`}
              >
                {TYPE_LABEL[t]}
                {n > 0 && <span className="rounded-full bg-accent px-1.5 font-mono text-[11px] tabular-nums text-white">{n}</span>}
              </a>
            )
          })}
        </nav>
        <form action="/admin" className="flex w-full max-w-[400px] items-center gap-2">
          {type === 'candidate' && <input type="hidden" name="type" value="candidate" />}
          {owner && <input type="hidden" name="owner" value={owner} />}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder={type === 'candidate' ? 'Імʼя, телефон або позиція' : 'Імʼя, телефон або напрям'}
            className="h-10 w-full rounded-[10px] border-0 bg-white px-3.5 text-[14px] text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] placeholder:text-slate-2 focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] focus:outline-none"
          />
          <button className="h-10 shrink-0 rounded-[10px] border-0 bg-ink px-4 text-[13.5px] text-white">Знайти</button>
        </form>
      </div>

      {type === 'client' && overdue.length > 0 && (
        <a
          href={href({}, { status: 'new' })}
          className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[12px] bg-accent-wash px-4 py-3 text-[14px] text-accent-ink shadow-[inset_0_0_0_1px_rgb(250_33_99/0.25)]"
        >
          <span className="size-2 rounded-full bg-accent" />
          {overdue.length === 1 ? '1 нова заявка чекає' : `${overdue.length} нових заявок чекають`} дзвінка довше {SLA_MINUTES} хвилин
          <span className="text-accent-ink/70">— найдовше {waited(overdue[overdue.length - 1]!.createdAt, now)}</span>
        </a>
      )}

      <div className={`${CARD} overflow-hidden`}>
        <nav aria-label="Статуси" className="flex overflow-x-auto border-b border-hair-soft [scrollbar-width:none]">
          <Tab href={href(base, { status: undefined })} on={!status} label="Усі" n={scoped.length} />
          {STATUSES.map((s) => (
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
  const late = l.type === 'client' && l.status === 'new' && now - new Date(l.createdAt).getTime() > SLA_MINUTES * 60_000
  const topic = l.type === 'candidate' ? l.position : l.practiceTitle
  const detail =
    l.type === 'candidate'
      ? l.cvFile
        ? `📎 ${l.cvFile.name}`
        : l.cvLink
          ? '🔗 посилання на резюме'
          : 'без резюме'
      : [l.packageName && `Варіант «${l.packageName}»`, l.message].filter(Boolean).join(' · ') || 'без опису'
  return (
    <li className="border-b border-hair-soft last:border-b-0">
      <a
        href={`/admin/leads/${l.id}`}
        className="grid gap-x-5 gap-y-1.5 px-[clamp(14px,2vw,22px)] py-3.5 transition-colors hover:bg-paper min-[980px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1fr)_120px] min-[980px]:items-center"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className={`mt-px size-2 shrink-0 rounded-full ${l.status === 'new' ? 'bg-accent' : 'bg-transparent'}`} aria-hidden="true" />
          <div className="min-w-0">
            <p className="m-0 truncate text-[15px] font-medium text-ink">{l.name}</p>
            <p className="m-0 font-mono text-[12px] tabular-nums text-slate">{formatPhone(l.phone)}</p>
          </div>
        </div>
        <div className="min-w-0 pl-5 min-[980px]:pl-0">
          <p className="m-0 truncate text-[14px] text-ink">{topic ?? '—'}</p>
          <p className="m-0 truncate text-[12.5px] text-slate-2">{detail}</p>
        </div>
        <div className="min-w-0 pl-5 text-[12.5px] leading-snug min-[980px]:pl-0">
          <p className={`m-0 ${late ? 'font-medium text-accent-ink' : 'text-slate'}`}>
            {late ? `чекає ${waited(l.createdAt, now)}` : relTime(l.createdAt, now)}
          </p>
          <p className="m-0 truncate text-slate-2">
            {sourceLabel(l)}
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
