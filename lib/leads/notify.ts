import { SITE_URL } from '@/lib/site'
import type { StoredFile } from './store'
import type { Lead } from './types'
import { formatPhone } from './validate'

/**
 * Уведомление о новом обращении в Telegram.
 *
 * Текст собирается всегда — его же CRM показывает в карточке как
 * «так прийде в Telegram». Отправка — только когда заданы
 * TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID; без них ничего не уходит.
 * Резюме с файлом уходит документом, текст — подписью к нему.
 *
 * Разметка — HTML-режим Telegram: в нём экранируются всего три символа,
 * а в MarkdownV2 — восемнадцать, и любое «ТОВ «Ромашка» (Київ)» из
 * формы роняло бы отправку.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function telegramText(lead: Lead): string {
  const head =
    lead.type === 'candidate'
      ? `📄 <b>Резюме</b>${lead.position ? ` · ${esc(lead.position)}` : ''}`
      : `🟢 <b>Нова заявка</b>${lead.practiceTitle ? ` · ${esc(lead.practiceTitle)}` : ''}`
  const lines = [
    head,
    '',
    `<b>${esc(lead.name)}</b>`,
    `📞 ${formatPhone(lead.phone)}`,
    ...(lead.email ? [`✉️ ${esc(lead.email)}`] : []),
    ...(lead.packageName ? [`Варіант: ${esc(lead.packageName)}`] : []),
    ...(lead.cvLink ? [`🔗 ${esc(lead.cvLink)}`] : []),
    ...(lead.message ? ['', `«${esc(lead.message.slice(0, 600))}${lead.message.length > 600 ? '…' : ''}»`] : []),
    '',
    `Джерело: ${esc(sourceLabel(lead))}`,
    `${SITE_URL}/admin/leads/${lead.id}`,
  ]
  return lines.join('\n')
}

/** «google · cpc · court_search» / «google.com» / «прямий захід» */
export function sourceLabel(lead: Lead): string {
  const u = lead.source.utm
  if (u?.source) return [u.source, u.medium, u.campaign].filter(Boolean).join(' · ')
  if (lead.source.referrer) return lead.source.referrer.replace(/^www\./, '')
  return 'прямий захід'
}

export const telegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)

export async function notifyNewLead(lead: Lead, file?: StoredFile): Promise<'sent' | 'skipped' | 'failed'> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return 'skipped'
  const api = `https://api.telegram.org/bot${token}`
  try {
    let res: Response
    if (file) {
      const body = new FormData()
      body.set('chat_id', chat)
      /* Подпись к документу — до 1024 символов. */
      body.set('caption', telegramText(lead).slice(0, 1000))
      body.set('parse_mode', 'HTML')
      body.set('document', new Blob([file.data as BlobPart], { type: file.type || 'application/octet-stream' }), file.name)
      res = await fetch(`${api}/sendDocument`, { method: 'POST', body, signal: AbortSignal.timeout(8000) })
    } else {
      res = await fetch(`${api}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text: telegramText(lead), parse_mode: 'HTML', disable_web_page_preview: true }),
        signal: AbortSignal.timeout(4000),
      })
    }
    return res.ok ? 'sent' : 'failed'
  } catch {
    /* Telegram недоступен — обращение всё равно сохранено, это важнее. */
    return 'failed'
  }
}
