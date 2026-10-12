import type { FieldErrors } from './types'
import { ui } from '../ui'

/**
 * Проверка заявки. Одна и та же на клиенте (подсказка до отправки) и на
 * сервере (решение). Клиентской проверке не доверяем: её обходят, просто
 * отправив запрос руками, — поэтому server action вызывает её заново.
 */

export const LIMITS = { name: 80, email: 120, message: 2000 } as const

/**
 * Телефон → E.164 (+380XXXXXXXXX) или null.
 *
 * Принимает то, как люди реально пишут: «067 123 45 67», «(067)1234567»,
 * «380671234567», «+38 067 …», «8 067 …». Иностранный номер с «+» и
 * 10–15 цифрами тоже пропускаем — клиенты бывают за границей.
 */
export function normalizePhone(raw: string): string | null {
  const s = raw.trim()
  const digits = s.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 12 && digits.startsWith('380')) return `+${digits}`
  if (digits.length === 11 && digits.startsWith('80')) return `+3${digits}`
  if (digits.length === 10 && digits.startsWith('0')) return `+38${digits}`
  if (digits.length === 9) return `+380${digits}`
  if (s.startsWith('+') && digits.length >= 10 && digits.length <= 15) return `+${digits}`
  return null
}

/** +380671234567 → +38 067 123 45 67 */
export function formatPhone(e164: string): string {
  const m = e164.match(/^\+38(0\d{2})(\d{3})(\d{2})(\d{2})$/)
  return m ? `+38 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface LeadInput {
  name: string
  phone: string
  email: string
  message: string
}

/** `lang` — мова текстів помилок (сторінка, з якої прийшла форма). */
export function validateLead(input: LeadInput, lang = 'ua'): { errors: FieldErrors; phone: string | null } {
  const t = ui(lang).validation
  const errors: FieldErrors = {}
  const name = input.name.trim()
  if (name.length < 2) errors.name = t.nameRequired
  else if (name.length > LIMITS.name) errors.name = t.tooLong(LIMITS.name)

  const phone = normalizePhone(input.phone)
  if (!input.phone.trim()) errors.phone = t.phoneRequired
  else if (!phone) errors.phone = t.phoneInvalid

  const email = input.email.trim()
  if (email && (!EMAIL.test(email) || email.length > LIMITS.email)) errors.email = t.emailInvalid

  if (input.message.length > LIMITS.message) errors.message = t.messageTooLong(LIMITS.message)

  return { errors, phone }
}
