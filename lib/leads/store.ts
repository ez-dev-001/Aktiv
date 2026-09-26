import { demoLeads } from './demo'
import type { Lead, LeadStatus } from './types'
import { STATUS_LABEL } from './types'

/**
 * Хранилище обращений.
 *
 * ── Сейчас: демо в памяти ──
 * Пока база не подключена, обращения живут в памяти процесса Next.
 * Это ровно «посмотреть, как будет выглядеть»:
 *
 *  • локально (npm run dev / npm start) отправленная с сайта заявка или
 *    резюме появляется в /admin сразу, её можно вести и писать заметки —
 *    до перезапуска сервера;
 *  • на Netlify обращения с формы НЕ сохраняются вовсе. Там каждая
 *    функция живёт секунды, память не общая, а главное — тестовый адрес
 *    открыт всем, и чужой телефон или резюме увидел бы любой, кто
 *    откроет /admin. Поэтому на Netlify /admin показывает только
 *    выдуманные демо-записи.
 *
 * ── Дальше: база ──
 * Второй класс с тем же интерфейсом LeadStore (Firestore или другая),
 * выбор — по переменной окружения. Ни формы, ни админка не меняются.
 */

export interface StoredFile {
  name: string
  type: string
  data: Uint8Array
}

export interface LeadStore {
  readonly kind: 'demo' | 'database'
  /** сохраняются ли обращения с сайта (в демо на Netlify — нет) */
  readonly persistsSubmissions: boolean
  list(): Promise<Lead[]>
  get(id: string): Promise<Lead | null>
  create(lead: Lead, file?: StoredFile): Promise<void>
  getFile(id: string): Promise<StoredFile | null>
  setStatus(id: string, status: LeadStatus, author: string): Promise<Lead | null>
  setOwner(id: string, owner: string, author: string): Promise<Lead | null>
  addNote(id: string, text: string, author: string): Promise<Lead | null>
}

/* Локальный запуск — нет переменных сборки Netlify (как в lib/site.ts). */
const isLocal = () => !process.env.CONTEXT && !process.env.NETLIFY

class MemoryStore implements LeadStore {
  readonly kind = 'demo' as const
  readonly persistsSubmissions = isLocal()
  private leads: Lead[] = demoLeads()
  private files = new Map<string, StoredFile>()

  async list() {
    return [...this.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  async get(id: string) {
    return this.leads.find((l) => l.id === id) ?? null
  }
  async create(lead: Lead, file?: StoredFile) {
    if (!this.persistsSubmissions) return
    this.leads.push(lead)
    if (file) this.files.set(lead.id, file)
  }
  async getFile(id: string) {
    return this.files.get(id) ?? null
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
  async addNote(id: string, text: string, author: string) {
    return this.touch(id, (l, at) => {
      l.notes.push({ at, author, text })
    })
  }
}

/* Один экземпляр на процесс. globalThis — чтобы перезагрузка модулей в
   dev (HMR) не сбрасывала обращения при каждой правке кода. */
const g = globalThis as unknown as { __aktivLeadsV2?: LeadStore }
export function leadStore(): LeadStore {
  return (g.__aktivLeadsV2 ??= new MemoryStore())
}

/** Команда: кому можно назначить обращение. Пока — список в коде. */
export const TEAM = ['Андрій Демченко', 'Марія Шевчук']
/** Кто действует в CRM. До входа в админку — условный «Менеджер». */
export const CURRENT_USER = 'Менеджер (демо)'
