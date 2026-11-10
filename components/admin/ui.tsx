import { STATUS_LABEL, type LeadStatus } from '@/lib/leads/types'

/**
 * Мелкие детали CRM. Цвет статуса — один на всю админку: вкладка,
 * пилюля в строке, кнопка в карточке. Палитра сайта: новая — акцент
 * (требует действия), в работе — фиолетовый, завершена — тёмная,
 * отказ — приглушённый.
 */
export const STATUS_TONE: Record<LeadStatus, { dot: string; pill: string }> = {
  new: { dot: 'bg-accent', pill: 'bg-accent-wash text-accent-ink shadow-[inset_0_0_0_1px_rgb(250_33_99/0.25)]' },
  in_progress: { dot: 'bg-[#8a7bd1]', pill: 'bg-[#f1eefb] text-[#4c3d99] shadow-[inset_0_0_0_1px_rgb(76_61_153/0.18)]' },
  done: { dot: 'bg-ink', pill: 'bg-ink text-white' },
  rejected: { dot: 'bg-slate-2', pill: 'bg-paper-2 text-slate-2 shadow-[inset_0_0_0_1px_var(--color-hair)]' },
}

export function StatusPill({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium ${STATUS_TONE[status].pill}`}>
      {status !== 'done' && <span className={`size-1.5 rounded-full ${STATUS_TONE[status].dot}`} />}
      {STATUS_LABEL[status]}
    </span>
  )
}

export const CARD = 'rounded-[14px] bg-white shadow-[0_1px_2px_rgb(11_7_16/0.04),inset_0_0_0_1px_var(--color-hair-soft)]'
export const LABEL = 'font-mono text-[10px] uppercase tracking-[0.12em] text-slate-2'
