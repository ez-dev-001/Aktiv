/**
 * Обращение с сайта — одна форма на сайт, CRM и Telegram.
 *
 * Два источника: форма консультации (клиент) и форма резюме на странице
 * «Карʼєра» (кандидат). CRM простая: список, четыре статуса, заметки.
 * Без воронок, сумм и конверсий — фирма ведёт обращения, а не сделки.
 *
 * Файл без зависимостей: его импортируют и server action, и клиентская
 * форма, и админка. Хранилище — lib/leads/store.ts.
 */

export const LEAD_TYPES = ['client', 'candidate'] as const
export type LeadType = (typeof LEAD_TYPES)[number]

export const TYPE_LABEL: Record<LeadType, string> = {
  client: 'Клієнти',
  candidate: 'Резюме',
}

/**
 * Статусы. Ключи уходят в базу — переименовывать после запуска нельзя,
 * подписи можно менять свободно.
 */
export const STATUSES = ['new', 'in_progress', 'done', 'rejected'] as const
export type LeadStatus = (typeof STATUSES)[number]

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Нова',
  in_progress: 'В роботі',
  done: 'Завершена',
  rejected: 'Відмова',
}

/** Откуда пришёл человек. Первое касание за сессию, см. lib/leads/client.ts. */
export interface LeadSource {
  /** где стояла форма: contact_section, career… */
  formLocation: string
  /** страница, с которой отправили */
  page?: string
  /** страница, на которую человек пришёл впервые за сессию */
  landing?: string
  referrer?: string
  utm?: Partial<Record<'source' | 'medium' | 'campaign' | 'term' | 'content', string>>
}

export interface LeadNote {
  at: string
  author: string
  text: string
}

/** Файл резюме: сами байты хранятся отдельно (store.getFile). */
export interface LeadFile {
  name: string
  type: string
  size: number
}

export interface Lead {
  id: string
  type: LeadType
  createdAt: string
  updatedAt: string
  status: LeadStatus
  name: string
  /** E.164: +380XXXXXXXXX */
  phone: string
  email?: string
  message?: string

  /* ── клиент ── */
  /** slug направления или «cat:<категория>»; пусто — «ще не знаю» */
  practiceKey?: string
  practiceTitle?: string
  categoryTitle?: string
  /** вариант услуги, выбранный кнопкой «Обрати цей варіант» */
  packageName?: string

  /* ── кандидат ── */
  position?: string
  cvLink?: string
  cvFile?: LeadFile

  source: LeadSource
  /** тот же, что в dataLayer */
  eventId: string
  /** кто ведёт */
  owner?: string
  notes: LeadNote[]
  history: LeadNote[]
  /** true — демо-запись из lib/leads/demo.ts */
  demo?: boolean
}

/** То, что форма показывает на странице «Дякуємо» — без телефона и почты. */
export interface LeadReceipt {
  firstName: string
  practiceTitle?: string
  at: string
}

export type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'message' | 'position' | 'cv', string>>

export type SubmitResult =
  | { ok: true; id: string; receipt: LeadReceipt }
  | { ok: false; errors?: FieldErrors; message?: string }
