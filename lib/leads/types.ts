/**
 * Заявка (лид) — одна форма на сайт, CRM, Telegram и аналитику.
 *
 * Файл без зависимостей: его импортируют и server action, и клиентская
 * форма, и админка. Хранилище (сейчас демо в памяти, дальше Firestore)
 * живёт отдельно, в lib/leads/store.ts.
 */

/* ═══════════ ДВА ТИПА ОБРАЩЕНИЙ ═══════════
   Бесплатная консультация и заявка на услугу — разные разговоры и разные
   воронки. Консультация — «разберитесь в моей ситуации», у неё нет суммы,
   её цель — встреча. Заявка — «хочу, чтобы вы это сделали», у неё есть
   направление и часто расчёт, её цель — договор.

   В одной воронке их цифры смешивались: сотня консультаций без суммы
   топила конверсию и средний чек заявок. Теперь у каждой своя воронка,
   а консультация, после которой клиент решил работать, переводится в
   заявку одной кнопкой — и связь между ними сохраняется. */

export const KINDS = ['consultation', 'order'] as const
export type LeadKind = (typeof KINDS)[number]

export const KIND_LABEL: Record<LeadKind, string> = {
  consultation: 'Безкоштовна консультація',
  order: 'Заявка на послугу',
}
/** Во множественном числе — для вкладок CRM. */
export const KIND_PLURAL: Record<LeadKind, string> = {
  consultation: 'Консультації',
  order: 'Заявки на послуги',
}

/**
 * Стадии. Ключи уходят в базу — переименовывать после запуска нельзя,
 * подписи можно менять свободно.
 */
export const STATUSES = ['new', 'contacted', 'scheduled', 'held', 'converted', 'consultation', 'contract', 'lost'] as const
export type LeadStatus = (typeof STATUSES)[number]

/** Воронка каждого типа. Порядок = порядок вкладок в CRM. */
export const PIPELINE: Record<LeadKind, readonly LeadStatus[]> = {
  consultation: ['new', 'contacted', 'scheduled', 'held', 'converted', 'lost'],
  order: ['new', 'contacted', 'consultation', 'contract', 'lost'],
}

/** Стадии, на которых обращение ещё в работе. */
export const OPEN_STATUSES: readonly LeadStatus[] = ['new', 'contacted', 'scheduled', 'held', 'consultation']

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Нова',
  contacted: 'Звʼязались',
  scheduled: 'Призначена',
  held: 'Проведена',
  converted: 'Стала заявкою',
  consultation: 'Консультація',
  contract: 'Договір',
  lost: 'Відмова',
}

/** Подсказка в CRM: что значит стадия и что делать дальше. */
export const STATUS_HINT: Record<LeadKind, Partial<Record<LeadStatus, string>>> = {
  consultation: {
    new: 'Ще ніхто не дзвонив. Передзвонити протягом 30 хвилин у робочий час і узгодити час консультації.',
    contacted: 'Поговорили, але час ще не узгоджено. Далі — призначити консультацію.',
    scheduled: 'Час узгоджено. Дату й формат — у нотатку, щоб юрист бачив перед зустріччю.',
    held: 'Консультацію проведено. Якщо клієнт хоче працювати далі — «Перевести в заявку».',
    converted: 'Клієнт замовив послугу. Заявка — у сусідній воронці, посилання нижче.',
    lost: 'Не прийшов, не відповідає або допомога не потрібна. Причину — в нотатку.',
  },
  order: {
    new: 'Ще ніхто не дзвонив. Мета — передзвонити протягом 30 хвилин у робочий час.',
    contacted: 'Поговорили, зʼясовуємо обставини. Далі — зустріч або документи для розрахунку.',
    consultation: 'Зустрілись, документи отримано. Далі — письмова вартість і договір.',
    contract: 'Договір підписано. Заявку закрито успішно.',
    lost: 'Клієнт відмовився або справа не наша. Причину — в нотатку.',
  },
}

/** Формат бесплатной консультации — выбирает человек в форме. */
export const FORMATS = ['office', 'online', 'phone'] as const
export type ConsultFormat = (typeof FORMATS)[number]
export const FORMAT_LABEL: Record<ConsultFormat, string> = {
  office: 'В офісі',
  online: 'Онлайн',
  phone: 'Телефоном',
}

/** Откуда пришёл человек. Первое касание за сессию, см. lib/leads/attribution.ts. */
export interface LeadSource {
  /** где стояла форма: contact_section, quiz_result… */
  formLocation: string
  /** страница, с которой отправили */
  page?: string
  /** страница, на которую человек пришёл впервые за сессию */
  landing?: string
  referrer?: string
  utm?: Partial<Record<'source' | 'medium' | 'campaign' | 'term' | 'content', string>>
}

/** Расчёт из калькулятора — ПЕРЕСЧИТАН на сервере, не взят из браузера. */
export interface LeadQuote {
  quizId: string
  practice: string
  answers: Record<string, string>
  complete: boolean
  priceMode: 'fixed' | 'percent'
  expectedValue: number | null
  range: { low: number; high: number } | null
  successFeePercent: number | null
  /** «18 000 – 27 000 ₴» или «10 % від суми стягнення» */
  label: string
  /** вопрос → выбранный ответ, человеческим языком */
  breakdown?: { q: string; a: string }[]
}

export interface LeadNote {
  at: string
  author: string
  text: string
}

export interface LeadEvent {
  at: string
  author: string
  text: string
}

export interface Lead {
  id: string
  kind: LeadKind
  createdAt: string
  updatedAt: string
  status: LeadStatus
  /** только у консультаций */
  format?: ConsultFormat
  /** пакет, выбранный кнопкой «Обрати цей варіант» на странице практики */
  packageName?: string
  /** консультация → заявка: id заявки, в которую её перевели */
  convertedTo?: string
  /** заявка ← консультация: id консультации, из которой она выросла */
  convertedFrom?: string
  name: string
  /** E.164: +380XXXXXXXXX */
  phone: string
  email?: string
  message?: string
  /** slug направления или «cat:<категория>»; пусто — «ще не знаю» */
  practiceKey?: string
  practiceTitle: string
  categoryTitle?: string
  quote?: LeadQuote
  source: LeadSource
  /** тот же, что в dataLayer: на нём держится дедупликация Meta CAPI */
  eventId: string
  /** кто ведёт */
  owner?: string
  notes: LeadNote[]
  history: LeadEvent[]
  /** true — демо-запись из lib/leads/demo.ts */
  demo?: boolean
}

/** То, что форма показывает на странице «Дякуємо» — без телефона и почты. */
export interface LeadReceipt {
  kind: LeadKind
  format?: ConsultFormat
  firstName: string
  practiceTitle: string
  quoteLabel?: string
  wantsEmail: boolean
  at: string
}

export type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'message' | 'consent', string>>

export type SubmitResult =
  | { ok: true; id: string; receipt: LeadReceipt; demo: boolean }
  | { ok: false; errors?: FieldErrors; message?: string }
