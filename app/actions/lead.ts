'use server'

import { headers } from 'next/headers'
import { getCategories, getQuizzes } from '@/lib/sanity/content'
import { buildLeadQuote } from '@/lib/leads/quote'
import { notifyNewLead } from '@/lib/leads/notify'
import { leadStore } from '@/lib/leads/store'
import { FORMATS, KINDS, KIND_LABEL, type ConsultFormat, type Lead, type LeadKind, type LeadSource, type SubmitResult } from '@/lib/leads/types'
import { validateLead } from '@/lib/leads/validate'

/**
 * Приём заявки с сайта.
 *
 * Порядок важен: сначала всё, что может отказать дёшево (ловушка для
 * ботов, частота, поля), потом пересчёт суммы, потом запись. Уведомление
 * в Telegram — последним и без ожидания ошибки: упавший Telegram не
 * должен стоить нам заявки.
 */

/* ── Частота: не больше 5 заявок с одного адреса за 10 минут ──
   Память процесса: на Netlify у каждой функции своя, так что это
   защита от скрипта-долбилки, а не точный счётчик. Этого достаточно:
   от ботов основное — ловушка company_url. */
const WINDOW = 10 * 60_000
const LIMIT = 5
const hits = new Map<string, number[]>()
function tooMany(ip: string) {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > LIMIT
}

const str = (v: FormDataEntryValue | null, max = 4000) => (typeof v === 'string' ? v.slice(0, max) : '')

function parseJson(v: string): unknown {
  try {
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

export async function submitLead(fd: FormData): Promise<SubmitResult> {
  const h = await headers()
  const ip = (h.get('x-nf-client-connection-ip') ?? h.get('x-forwarded-for') ?? 'local').split(',')[0]!.trim()

  /* Ловушка: поле невидимо человеку. Боту отвечаем «успехом», чтобы он
     не подбирал обход, — но ничего не сохраняем. */
  if (str(fd.get('company_url'))) {
    return { ok: true, id: 'hp', receipt: { kind: 'consultation', firstName: '', practiceTitle: '', wantsEmail: false, at: new Date().toISOString() }, demo: true }
  }
  if (tooMany(ip)) {
    return { ok: false, message: 'Забагато заявок поспіль. Зателефонуйте нам, будь ласка, — так буде швидше.' }
  }

  const input = {
    name: str(fd.get('name'), 200),
    phone: str(fd.get('phone'), 40),
    email: str(fd.get('email'), 200),
    message: str(fd.get('message'), 4000),
  }
  const { errors, phone } = validateLead(input)
  if (Object.keys(errors).length || !phone) return { ok: false, errors }

  /* Тип обращения: консультация или заявка. Неизвестное значение —
     консультация: это более мягкий вариант, и юрист всё равно
     переведёт в заявку одной кнопкой. */
  const kindRaw = str(fd.get('kind'), 20) as LeadKind
  const kind: LeadKind = KINDS.includes(kindRaw) ? kindRaw : 'consultation'
  const formatRaw = str(fd.get('format'), 20) as ConsultFormat
  const format = kind === 'consultation' && FORMATS.includes(formatRaw) ? formatRaw : undefined
  const packageName = kind === 'order' ? str(fd.get('package'), 80).trim() || undefined : undefined

  /* Направление: название берём с сервера по ключу, а не из формы. */
  const practiceKey = str(fd.get('practice'), 120)
  const { data: cats } = await getCategories()
  let practiceTitle = 'Ще не знаю'
  let categoryTitle: string | undefined
  for (const c of cats) {
    if (practiceKey === `cat:${c.slug}`) {
      practiceTitle = `${c.title} — напрям уточнимо`
      categoryTitle = c.title
    }
    const p = c.practices.find((x) => x.slug === practiceKey)
    if (p) {
      practiceTitle = p.title
      categoryTitle = c.title
    }
  }

  /* Калькулятор: из браузера — только ответы, сумму считаем сами. */
  const quizId = str(fd.get('quiz_id'), 80)
  const quote = quizId ? buildLeadQuote((await getQuizzes()).data, quizId, parseJson(str(fd.get('quiz_answers'), 2000))) : undefined

  const attr = parseJson(str(fd.get('attribution'), 2000)) as Partial<LeadSource> | null
  const source: LeadSource = {
    formLocation: str(fd.get('form_location'), 40) || 'contact_section',
    page: str(fd.get('page'), 200) || undefined,
    ...(attr?.landing ? { landing: String(attr.landing).slice(0, 200) } : {}),
    ...(attr?.referrer ? { referrer: String(attr.referrer).slice(0, 120) } : {}),
    ...(attr?.utm && typeof attr.utm === 'object' ? { utm: attr.utm } : {}),
  }

  const now = new Date().toISOString()
  const name = input.name.trim()
  const email = input.email.trim()
  const message = input.message.trim()
  const lead: Lead = {
    id: crypto.randomUUID(),
    kind,
    ...(format ? { format } : {}),
    ...(packageName ? { packageName } : {}),
    createdAt: now,
    updatedAt: now,
    status: 'new',
    name,
    phone,
    ...(email ? { email } : {}),
    ...(message ? { message } : {}),
    ...(practiceKey && practiceKey !== 'unknown' ? { practiceKey } : {}),
    practiceTitle,
    ...(categoryTitle ? { categoryTitle } : {}),
    ...(quote ? { quote } : {}),
    source,
    eventId: str(fd.get('event_id'), 80) || `f-${Date.now().toString(36)}`,
    notes: [],
    history: [{ at: now, author: 'Сайт', text: kind === 'order' ? 'Заявка з форми на сайті' : 'Запис на консультацію з сайту' }],
  }

  const store = leadStore()
  try {
    await store.create(lead)
  } catch {
    return { ok: false, message: 'Не вдалося надіслати. Зателефонуйте нам — ми на звʼязку.' }
  }
  if (!store.persistsSubmissions) {
    /* Демо на Netlify: заявка проверена и «принята», но нигде не
       сохранена. В лог — без телефона и почты. */
    console.info('[lead:demo] accepted, not stored', { kind: KIND_LABEL[kind], practice: practiceTitle, quiz: quote?.label })
  }
  void notifyNewLead(lead)

  return {
    ok: true,
    id: lead.id,
    demo: store.kind === 'demo',
    receipt: {
      kind,
      ...(format ? { format } : {}),
      firstName: name.split(/\s+/)[0] ?? name,
      practiceTitle,
      ...(quote ? { quoteLabel: quote.label } : {}),
      wantsEmail: Boolean(email),
      at: now,
    },
  }
}
