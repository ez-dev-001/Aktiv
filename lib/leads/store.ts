import { demoLeads } from './demo'
import type { Lead, LeadKind, LeadStatus } from './types'
import { KIND_LABEL, PIPELINE, STATUS_LABEL } from './types'

/**
 * Хранилище заявок.
 *
 * ── Сейчас: демо в памяти ──
 * Пока Firestore не подключён, заявки живут в памяти процесса Next.
 * Это ровно «посмотреть, как будет выглядеть»:
 *
 *  • локально (npm run dev / npm start) отправленная с сайта заявка
 *    появляется в /admin сразу, её можно двигать по воронке и писать
 *    заметки — до перезапуска сервера;
 *  • на Netlify заявки с формы НЕ сохраняются вовсе. Там каждая функция
 *    живёт секунды, память не общая, а главное — тестовый адрес открыт
 *    всем, и чужой телефон, оставленный в форме, увидел бы любой, кто
 *    откроет /admin. Поэтому на Netlify /admin показывает только
 *    выдуманные демо-заявки.
 *
 * ── Дальше: Firestore ──
 * Этап 4. Второй класс с тем же интерфейсом LeadStore, выбор — по
 * FIREBASE_ADMIN_PROJECT_ID. Ни форма, ни админка при этом не меняются.
 */

export interface LeadStore {
  readonly kind: 'demo' | 'firestore'
  /** сохраняются ли заявки с сайта (в демо на Netlify — нет) */
  readonly persistsSubmissions: boolean
  list(): Promise<Lead[]>
  get(id: string): Promise<Lead | null>
  create(lead: Lead): Promise<void>
  setStatus(id: string, status: LeadStatus, author: string): Promise<Lead | null>
  setOwner(id: string, owner: string, author: string): Promise<Lead | null>
  addNote(id: string, text: string, author: string): Promise<Lead | null>
  /** Обращение попало не в ту воронку: сменить тип, стадию подобрать ближайшую. */
  setKind(id: string, kind: LeadKind, author: string): Promise<Lead | null>
  /** Консультация → новая заявка на услугу. Возвращает id заявки. */
  convert(id: string, author: string): Promise<string | null>
}

/* Локальный запуск — нет переменных сборки Netlify (как в lib/site.ts). */
const isLocal = () => !process.env.CONTEXT && !process.env.NETLIFY

class MemoryStore implements LeadStore {
  readonly kind = 'demo' as const
  readonly persistsSubmissions = isLocal()
  private leads: Lead[] = demoLeads()

  async list() {
    return [...this.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  async get(id: string) {
    return this.leads.find((l) => l.id === id) ?? null
  }
  async create(lead: Lead) {
    if (this.persistsSubmissions) this.leads.push(lead)
  }
  private touch(id: string, fn: (l: Lead, now: string) => void) {
    const l = this.leads.find((x) => x.id === id)
    if (!l) return null
    const now = new Date().toISOString()
    fn(l, now)
    l.updatedAt = now
    return l
  }
  async setStatus(id: string, status: LeadStatus, author: string) {
    return this.touch(id, (l, at) => {
      if (l.status === status) return
      l.history.push({ at, author, text: `Статус: ${STATUS_LABEL[l.status]} → ${STATUS_LABEL[status]}` })
      l.status = status
    })
  }
  async setOwner(id: string, owner: string, author: string) {
    return this.touch(id, (l, at) => {
      if (l.owner === owner) return
      l.history.push({ at, author, text: owner ? `Відповідальний: ${owner}` : 'Відповідального знято' })
      l.owner = owner || undefined
    })
  }
  async setKind(id: string, kind: LeadKind, author: string) {
    return this.touch(id, (l, at) => {
      if (l.kind === kind) return
      l.history.push({ at, author, text: `Тип: ${KIND_LABEL[l.kind]} → ${KIND_LABEL[kind]}` })
      l.kind = kind
      /* Стадии у воронок разные. Общие (Нова, Звʼязались, Відмова)
         сохраняются, остальные откатываются на «Звʼязались»: раз
         обращение уже двигали, с человеком точно говорили. */
      if (!PIPELINE[kind].includes(l.status)) l.status = 'contacted'
      if (kind === 'order') l.format = undefined
    })
  }
  async convert(id: string, author: string) {
    const src = this.leads.find((l) => l.id === id)
    if (!src || src.kind !== 'consultation' || src.convertedTo) return null
    const now = new Date().toISOString()
    const order: Lead = {
      ...structuredClone(src),
      id: crypto.randomUUID(),
      kind: 'order',
      /* Консультация уже была — заявка начинается со стадии, где
         обсуждают вартість и договор, а не с «Нова». */
      status: 'consultation',
      format: undefined,
      convertedFrom: src.id,
      convertedTo: undefined,
      createdAt: now,
      updatedAt: now,
      notes: [],
      history: [{ at: now, author, text: 'Створено з безкоштовної консультації' }],
      demo: src.demo,
    }
    this.leads.push(order)
    src.history.push({ at: now, author, text: 'Перевели в заявку на послугу' })
    src.status = 'converted'
    src.convertedTo = order.id
    src.updatedAt = now
    return order.id
  }
  async addNote(id: string, text: string, author: string) {
    return this.touch(id, (l, at) => {
      l.notes.push({ at, author, text })
    })
  }
}

/* Один экземпляр на процесс. globalThis — чтобы перезагрузка модулей в
   dev (HMR) не сбрасывала заявки при каждой правке кода. */
const g = globalThis as unknown as { __aktivLeads?: LeadStore }
export function leadStore(): LeadStore {
  return (g.__aktivLeads ??= new MemoryStore())
}

/** Команда: кому можно назначить заявку. Пока — список в коде. */
export const TEAM = ['Андрій Демченко', 'Марія Шевчук']
/** Кто действует в CRM. До входа через Firebase Auth — условный «Менеджер». */
export const CURRENT_USER = 'Менеджер (демо)'
