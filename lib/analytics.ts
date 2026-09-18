/**
 * dataLayer. Единственная точка, из которой сайт пишет события.
 *
 * GTM подключается на этапе 5 через @next/third-parties после интерактивности;
 * до тех пор push-и просто складываются в массив, и их видно в консоли —
 * схему событий можно проверять уже сейчас.
 *
 * Имена событий фиксированы: они же заводятся руками в GA4 и Meta
 * Events Manager, поэтому переименование после запуска ломает всю
 * накопленную статистику. Список — в docs/analytics.md.
 */

export type EventName =
  | 'form_start' | 'form_submit'
  | 'phone_click' | 'messenger_click'
  | 'consultation_request' | 'callback_request'
  | 'practice_view'
  | 'quiz_start' | 'quiz_step' | 'quiz_complete'
  | 'article_read' | 'scroll_depth'

interface DataLayerEvent {
  event: EventName
  language?: string
  /** Один и тот же на клиенте и на сервере — на нём держится дедупликация Meta CAPI. */
  event_id?: string
  [key: string]: unknown
}

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[]
  }
}

/**
 * event_id генерируется один раз на «сессию действия» (например на весь
 * проход квиза) и уезжает в лид. Server action переиспользует его при
 * отправке в Meta CAPI — иначе одна заявка считается дважды.
 */
export function newEventId(prefix = 'e'): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now().toString(36)}-${rnd}`
}

export function track(event: EventName, payload: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, language: 'uk', ...payload })
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.info('[dataLayer]', event, payload)
  }
}

/** Клик по телефону — Contact в Meta, конверсия в GA4. */
export const trackPhone = (location: string) => track('phone_click', { form_location: location })

export const trackMessenger = (channel: 'viber' | 'telegram' | 'whatsapp', location: string) =>
  track('messenger_click', { channel, form_location: location })
