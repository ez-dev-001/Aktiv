'use client'

import { useId, useState, type ReactNode } from 'react'
import { Icon } from '@/components/site/Icon'
import { Button, ButtonLink } from '@/components/ui/Button'

/**
 * Кнопки виділеного юриста + розкривна панель «Про юриста».
 *
 * Окремих сторінок профілю в проєкті немає, тож «Про юриста» не веде
 * нікуди, а відкриває під текстом те, що реально є в Sanity про цю
 * людину (напрями, біо, прямі контакти). Панель рендерить сервер і
 * передає сюди як children; тут — лише стан «відкрито/закрито».
 * Немає панелі (даних) — немає й кнопки. Анімація розкриття —
 * globals.css, блок SpotMore.
 */
export function SpotMore({
  ctaHref,
  ctaLabel,
  moreLabel,
  children,
}: {
  ctaHref: string
  ctaLabel: string
  moreLabel: string
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <>
      <div className="mt-[26px] flex flex-wrap gap-2.5">
        <ButtonLink href={ctaHref} arrow className="min-h-[54px] shadow-[0_14px_34px_-14px_rgb(224_16_85/0.7)]">
          {ctaLabel}
        </ButtonLink>
        {children && (
          <Button
            type="button"
            variant="ghostDark"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((v) => !v)}
            className="min-h-[54px]"
          >
            {moreLabel}
            <Icon
              name="arrow"
              className={`size-[17px] shrink-0 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${open ? '-rotate-90' : 'rotate-90'}`}
            />
          </Button>
        )}
      </div>
      {children && (
        /* Плавне розкриття: висота 0fr → 1fr (grid-rows), лінія зверху
           протягується зліва направо, рядки виїжджають по черзі.
           Закрита панель — inert: з неї не можна потрапити табом. */
        <div id={id} className={`sm-panel ${open ? 'is-open' : ''}`} inert={!open}>
          <div className="sm-clip">
            <div className="sm-in mt-6 pt-6">{children}</div>
          </div>
        </div>
      )}
    </>
  )
}
