import { KIND_LABEL, STATUS_LABEL, type LeadKind, type LeadStatus } from '@/lib/leads/types'

/**
 * Мелкие детали CRM. Цвет стадии — один на всю админку: колонка,
 * пилюля в строке, кнопка в карточке. Палитра сайта, без новых оттенков:
 * новая — акцент (требует действия), договор — тёмный (итог), отказ —
 * приглушённый, промежуточные — нейтральные с разной насыщенностью.
 */
export const STATUS_TONE: Record<LeadStatus, { dot: string; pill: string }> = {
  new: { dot: 'bg-accent', pill: 'bg-accent-wash text-accent-ink shadow-[inset_0_0_0_1px_rgb(250_33_99/0.25)]' },
  contacted: { dot: 'bg-[#8a7bd1]', pill: 'bg-[#f1eefb] text-[#4c3d99] shadow-[inset_0_0_0_1px_rgb(76_61_153/0.18)]' },
  scheduled: { dot: 'bg-[#e0a33a]', pill: 'bg-[#fbf3e3] text-[#8a5a0b] shadow-[inset_0_0_0_1px_rgb(138_90_11/0.2)]' },
  held: { dot: 'bg-[#3f9a80]', pill: 'bg-[#e8f5f0] text-[#23694f] shadow-[inset_0_0_0_1px_rgb(35_105_79/0.2)]' },
  converted: { dot: 'bg-ink', pill: 'bg-ink text-white' },
  consultation: { dot: 'bg-[#e0a33a]', pill: 'bg-[#fbf3e3] text-[#8a5a0b] shadow-[inset_0_0_0_1px_rgb(138_90_11/0.2)]' },
  contract: { dot: 'bg-ink', pill: 'bg-ink text-white' },
  lost: { dot: 'bg-slate-2', pill: 'bg-paper-2 text-slate-2 shadow-[inset_0_0_0_1px_var(--color-hair)]' },
}

/** Итоговые стадии рисуются тёмной плашкой без точки. */
const FINAL: LeadStatus[] = ['contract', 'converted']

/** Метка типа обращения: консультация — светлая, заявка — акцентная. */
export function KindTag({ kind, short }: { kind: LeadKind; short?: boolean }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-[6px] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] ${
        kind === 'order' ? 'bg-accent-wash text-accent-ink' : 'bg-paper-2 text-slate'
      }`}
    >
      {short ? (kind === 'order' ? 'Заявка' : 'Консультація') : KIND_LABEL[kind]}
    </span>
  )
}

export function StatusPill({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium ${STATUS_TONE[status].pill}`}>
      {!FINAL.includes(status) && <span className={`size-1.5 rounded-full ${STATUS_TONE[status].dot}`} />}
      {STATUS_LABEL[status]}
    </span>
  )
}

export const CARD = 'rounded-[14px] bg-white shadow-[0_1px_2px_rgb(20_11_51/0.04),inset_0_0_0_1px_var(--color-hair-soft)]'
export const LABEL = 'font-mono text-[10px] uppercase tracking-[0.12em] text-slate-2'
