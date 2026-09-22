'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/leads/client'

/**
 * Запоминает, откуда пришёл посетитель: UTM-метки и первую страницу
 * визита. Стоит в лейауте, потому что человек редко оставляет заявку
 * на той странице, куда пришёл по рекламе, — а метки живут только в
 * адресе первой. Ничего не рисует.
 */
export function Attribution() {
  useEffect(() => captureAttribution(), [])
  return null
}
