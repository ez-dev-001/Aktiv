/** Время в CRM: «5 хв тому», «сьогодні о 14:20», «вчора о 09:05», «12 вересня о 18:40». */
export function relTime(isoStr: string, now = Date.now()): string {
  const t = new Date(isoStr)
  const diff = (now - t.getTime()) / 60_000
  if (diff < 1) return 'щойно'
  if (diff < 60) return `${Math.floor(diff)} хв тому`
  const time = t.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv' })
  const day = (d: Date) => d.toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv' })
  const today = new Date(now)
  const yesterday = new Date(now - 86_400_000)
  if (day(t) === day(today)) return `сьогодні о ${time}`
  if (day(t) === day(yesterday)) return `вчора о ${time}`
  return `${t.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', timeZone: 'Europe/Kyiv' })} о ${time}`
}

/** «2 год 15 хв», «40 хв», «3 дн» — сколько заявка ждёт звонка. */
export function waited(isoStr: string, now = Date.now()): string {
  const m = Math.max(0, Math.floor((now - new Date(isoStr).getTime()) / 60_000))
  if (m < 60) return `${m} хв`
  if (m < 60 * 24) return `${Math.floor(m / 60)} год${m % 60 ? ` ${m % 60} хв` : ''}`
  return `${Math.floor(m / 1440)} дн`
}

export const money = (n: number) => new Intl.NumberFormat('uk-UA').format(Math.round(n)) + ' ₴'

/** Сколько минут заявка может ждать звонка, прежде чем CRM подсветит её. */
export const SLA_MINUTES = 30
