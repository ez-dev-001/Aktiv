'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CURRENT_USER, TEAM, leadStore } from '@/lib/leads/store'
import { KINDS, PIPELINE, type LeadKind, type LeadStatus } from '@/lib/leads/types'

/**
 * Действия CRM. Формы в админке отправляются сюда обычным POST —
 * работают и без JavaScript, и с ним.
 *
 * TODO(этап 4): проверка входа (Firebase Auth) — первой строкой каждого
 * действия. Пока хранилище демо и настоящих заявок в нём нет.
 */

export async function setStatusAction(fd: FormData) {
  const id = String(fd.get('id') ?? '')
  const status = String(fd.get('status') ?? '') as LeadStatus
  const lead = await leadStore().get(id)
  /* Стадия должна принадлежать воронке этого типа: у консультации нет
     «Договору», у заявки — «Призначеної». */
  if (!lead || !PIPELINE[lead.kind].includes(status)) return
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

export async function setKindAction(fd: FormData) {
  const id = String(fd.get('id') ?? '')
  const kind = String(fd.get('kind') ?? '') as LeadKind
  if (!KINDS.includes(kind)) return
  await leadStore().setKind(id, kind, CURRENT_USER)
  revalidatePath('/admin')
  revalidatePath(`/admin/leads/${id}`)
}

/** Консультация → заявка. Открывает созданную заявку. */
export async function convertAction(fd: FormData) {
  const id = String(fd.get('id') ?? '')
  const orderId = await leadStore().convert(id, CURRENT_USER)
  revalidatePath('/admin')
  if (orderId) redirect(`/admin/leads/${orderId}`)
}
