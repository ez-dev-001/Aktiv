'use server'

import { headers } from 'next/headers'
import { getCategories } from '@/lib/sanity/content'
import { notifyNewLead } from '@/lib/leads/notify'
import { leadStore, type StoredFile } from '@/lib/leads/store'
import type { FieldErrors, Lead, LeadSource, LeadType, SubmitResult } from '@/lib/leads/types'
import { validateLead } from '@/lib/leads/validate'

/**
 * Приём обращений с сайта: заявка клиента и резюме кандидата.
 *
 * Порядок важен: сначала всё, что может отказать дёшево (ловушка для
 * ботов, частота, поля), потом запись. Уведомление в Telegram —
 * последним и без ожидания ошибки: упавший Telegram не должен стоить
 * нам обращения.
 */

/* ── Частота: не больше 5 обращений с одного адреса за 10 минут ──
   Память процесса: на Netlify у каждой функции своя, так что это
   защита от скрипта-долбилки, а не точный счётчик. Основное от ботов —
   ловушка company_url. */
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

const HONEYPOT: SubmitResult = { ok: true, id: 'hp', receipt: { firstName: '', at: new Date(0).toISOString() } }

/** Общая часть обеих форм: ловушка, частота, контакты, источник. */
async function intake(fd: FormData, formLocation: string) {
  const h = await headers()
  const ip = (h.get('x-nf-client-connection-ip') ?? h.get('x-forwarded-for') ?? 'local').split(',')[0]!.trim()

  /* Ловушка: поле невидимо человеку. Боту отвечаем «успехом», чтобы он
     не подбирал обход, — но ничего не сохраняем. */
  if (str(fd.get('company_url'))) return { early: HONEYPOT }
  if (tooMany(ip)) {
    return { early: { ok: false, message: 'Забагато звернень поспіль. Зателефонуйте нам, будь ласка, — так буде швидше.' } as SubmitResult }
  }

  const input = {
    name: str(fd.get('name'), 200),
    phone: str(fd.get('phone'), 40),
    email: str(fd.get('email'), 200),
    message: str(fd.get('message'), 4000),
  }
  const { errors, phone } = validateLead(input)

  const attr = parseJson(str(fd.get('attribution'), 2000)) as Partial<LeadSource> | null
  const source: LeadSource = {
    formLocation,
    page: str(fd.get('page'), 200) || undefined,
    ...(attr?.landing ? { landing: String(attr.landing).slice(0, 200) } : {}),
    ...(attr?.referrer ? { referrer: String(attr.referrer).slice(0, 120) } : {}),
    ...(attr?.utm && typeof attr.utm === 'object' ? { utm: attr.utm } : {}),
  }

  return { input, errors, phone, source }
}

function baseLead(type: LeadType, input: { name: string; email: string; message: string }, phone: string, source: LeadSource, eventId: string): Lead {
  const now = new Date().toISOString()
  const email = input.email.trim()
  const message = input.message.trim()
  return {
    id: crypto.randomUUID(),
    type,
    createdAt: now,
    updatedAt: now,
    status: 'new',
    name: input.name.trim(),
    phone,
    ...(email ? { email } : {}),
    ...(message ? { message } : {}),
    source,
    eventId: eventId || `f-${Date.now().toString(36)}`,
    notes: [],
    history: [{ at: now, author: 'Сайт', text: type === 'candidate' ? 'Резюме зі сторінки «Карʼєра»' : 'Заявка з форми на сайті' }],
  }
}

async function save(lead: Lead, file?: StoredFile): Promise<SubmitResult> {
  const store = leadStore()
  try {
    await store.create(lead, file)
  } catch {
    return { ok: false, message: 'Не вдалося надіслати. Зателефонуйте нам — ми на звʼязку.' }
  }
  if (!store.persistsSubmissions) {
    /* Демо на Netlify: обращение проверено и «принято», но нигде не
       сохранено. В лог — без имени, телефона и почты. */
    console.info('[lead:demo] accepted, not stored', { type: lead.type, practice: lead.practiceTitle, position: lead.position })
  }
  void notifyNewLead(lead, file)
  return {
    ok: true,
    id: lead.id,
    receipt: { firstName: lead.name.split(/\s+/)[0] ?? lead.name, ...(lead.practiceTitle ? { practiceTitle: lead.practiceTitle } : {}), at: lead.createdAt },
  }
}

/* ═══════════ ЗАЯВКА КЛИЕНТА ═══════════ */

export async function submitLead(fd: FormData): Promise<SubmitResult> {
  const r = await intake(fd, 'contact_section')
  if ('early' in r) return r.early!
  const { input, errors, phone, source } = r
  if (Object.keys(errors).length || !phone) return { ok: false, errors }

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
  const packageName = str(fd.get('package'), 80).trim()

  const lead: Lead = {
    ...baseLead('client', input, phone, source, str(fd.get('event_id'), 80)),
    ...(practiceKey && practiceKey !== 'unknown' ? { practiceKey } : {}),
    practiceTitle,
    ...(categoryTitle ? { categoryTitle } : {}),
    ...(packageName ? { packageName } : {}),
  }
  return save(lead)
}

/* ═══════════ РЕЗЮМЕ ═══════════ */

const CV_MAX = 4 * 1024 * 1024
const CV_TYPES = /\.(pdf|docx?|rtf|odt)$/i

export async function submitCv(fd: FormData): Promise<SubmitResult> {
  const r = await intake(fd, 'career')
  if ('early' in r) return r.early!
  const { input, errors, phone, source } = r
  const all: FieldErrors = { ...errors }

  const position = str(fd.get('position'), 120).trim()
  if (!position) all.position = 'Оберіть позицію — або «Інша»'

  /* Резюме — файлом или ссылкой (LinkedIn, Google Диск, work.ua). */
  const raw = fd.get('cv')
  const file = raw instanceof File && raw.size > 0 ? raw : null
  const link = str(fd.get('cv_link'), 300).trim()
  if (file) {
    if (file.size > CV_MAX) all.cv = 'Файл більший за 4 МБ — стисніть або додайте посилання'
    else if (!CV_TYPES.test(file.name)) all.cv = 'Потрібен PDF або Word'
  } else if (link) {
    if (!/^https?:\/\/\S+\.\S+/.test(link)) all.cv = 'Посилання має починатися з https://'
  } else {
    all.cv = 'Додайте файл резюме або посилання на нього'
  }

  if (Object.keys(all).length || !phone) return { ok: false, errors: all }

  const stored: StoredFile | undefined = file
    ? { name: file.name.slice(0, 120), type: file.type, data: new Uint8Array(await file.arrayBuffer()) }
    : undefined

  const lead: Lead = {
    ...baseLead('candidate', input, phone, source, ''),
    position,
    ...(link && !file ? { cvLink: link } : {}),
    ...(stored ? { cvFile: { name: stored.name, type: stored.type, size: stored.data.byteLength } } : {}),
  }
  return save(lead, stored)
}
