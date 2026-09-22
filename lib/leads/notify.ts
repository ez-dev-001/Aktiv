import { SITE_URL } from '@/lib/site'
import { FORMAT_LABEL, type Lead } from './types'
import { formatPhone } from './validate'

/**
 * Уведомление о новой заявке в Telegram.
 *
 * Текст собирается всегда — его же CRM показывает в карточке заявки
 * как «так прийде в Telegram». Отправка — только когда заданы
 * TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID; без них ничего не уходит.
 *
 * Разметка — HTML-режим Telegram: в нём экранируются всего три символа,
 * а в MarkdownV2 — восемнадцать, и любое «ТОВ «Ромашка» (Київ)» из
 * формы роняло бы отправку.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function telegramText(lead: Lead): string {
  const lines = [
    lead.kind === 'order'
      ? `🟢 <b>Заявка на послугу</b> · ${esc(lead.practiceTitle)}`
      : `💬 <b>Безкоштовна консультація</b>${lead.format ? ` · ${FORMAT_LABEL[lead.format].toLowerCase()}` : ''}`,
    ...(lead.kind === 'consultation' && lead.practiceTitle !== 'Ще не знаю' ? [`Тема: ${esc(lead.practiceTitle)}`] : []),
    ...(lead.packageName ? [`Пакет: ${esc(lead.packageName)}`] : []),
    '',
    `<b>${esc(lead.name)}</b>`,
    `📞 ${formatPhone(lead.phone)}`,
    ...(lead.email ? [`✉️ ${esc(lead.email)}`] : []),
    ...(lead.quote ? ['', `💰 ${esc(lead.quote.label)}${lead.quote.complete ? '' : ' (не всі відповіді)'}`] : []),
    ...(lead.message ? ['', `«${esc(lead.message.slice(0, 600))}${lead.message.length > 600 ? '…' : ''}»`] : []),
    '',
    `Джерело: ${esc(sourceLabel(lead))}`,
    `${SITE_URL}/admin/leads/${lead.id}`,
  ]
  return lines.join('\n')
}

/** «Google Ads · court_search» / «google.com» / «прямий захід» */
export function sourceLabel(lead: Lead): string {
  const u = lead.source.utm
  if (u?.source) return [u.source, u.medium, u.campaign].filter(Boolean).join(' · ')
  if (lead.source.referrer) return lead.source.referrer.replace(/^www\./, '')
  return 'прямий захід'
}

export async function notifyNewLead(lead: Lead): Promise<'sent' | 'skipped' | 'failed'> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return 'skipped'
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: telegramText(lead), parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(4000),
    })
    return res.ok ? 'sent' : 'failed'
  } catch {
    /* Telegram недоступен — заявка всё равно сохранена, это важнее. */
    return 'failed'
  }
}
