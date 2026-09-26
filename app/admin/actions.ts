'use server'

import { revalidatePath } from 'next/cache'
import { CURRENT_USER, TEAM, leadStore } from '@/lib/leads/store'
import { STATUSES, type LeadStatus } from '@/lib/leads/types'

/**
 * Действия CRM. Формы в админке отправляются сюда обычным POST —
 * работают и без JavaScript, и с ним.
 *
 * TODO: проверка входа — первой строкой каждого действия, когда
 * появится вход в админку. Пока хранилище демо и настоящих обращений
 * в нём нет.
 */

export async function setStatusAction(fd: FormData) {
  const id = String(fd.get('id') ?? '')
  const status = String(fd.get('status') ?? '') as LeadStatus
  if (!STATUSES.includes(status)) return
  await leadStore().setStatus(id, status, CURRENT_USER)
  revalidatePath('/admin')
  revalidatePath(`/admin/leads/${id}`)
}

export async function setOwnerAction(fd: FormData) {
  const id = String(fd.get('id') ?? '')
  const owner = String(fd.get('owner') ?? '')
  if (owner && !TEAM.includes(owner)) return
  await leadStore().setOwner(id, owner, CURRENT_USER)
  revalidatePath('/admin')
  revalidatePath(`/admin/leads/${id}`)
}

export async function addNoteAction(fd: FormData) {
  const id = String(fd.get('id') ?? '')
  const text = String(fd.get('text') ?? '').trim().slice(0, 2000)
  if (!text) return
  await leadStore().addNote(id, text, CURRENT_USER)
  revalidatePath(`/admin/leads/${id}`)
}
