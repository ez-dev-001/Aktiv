'use client'

import { useEffect, useState } from 'react'
import type { Contacts } from '@/lib/sanity/content'
import { trackPhone } from '@/lib/analytics'
import { Icon } from './Icon'

/**
 * Липка панель дій на телефоні й планшеті (до 1000px).
 *
 * «Отримати консультацію» і дзвінок — у скляній панелі внизу екрана,
 * під великим пальцем, і лишаються там під час прокрутки. Тому на
 * першому екрані телефона немає великої кнопки: вона вже тут.
 *
 * Панель ховається, щойно форма заявки підходить до кадру, і не
 * повертається нижче (у футері): дублювати кнопку поруч із самою
 * формою немає сенсу.
 *
 * На сторінці з панеллю круглу кнопку звʼязку (FloatingActions) на
 * телефоні вимкнено — дві плаваючі кнопки змагалися б за той самий кут.
 */
export function MobileDock({ contacts, label = 'Отримати консультацію' }: { contacts: Contacts; label?: string }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const form = document.getElementById('contact')
    if (!form) return
    let raf = 0
    const paint = () => {
      raf = 0
      setHidden(form.getBoundingClientRect().top < window.innerHeight * 0.85)
    }
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', tick, { passive: true })
    window.addEventListener('resize', tick)
    return () => {
      window.removeEventListener('scroll', tick)
      window.removeEventListener('resize', tick)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      data-hidden={hidden}
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom,0px))] z-[70] flex gap-2 rounded-full bg-[rgb(28_18_66/0.84)] p-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),0_20px_40px_-14px_rgb(0_0_0/0.6)] backdrop-blur-md transition-[opacity,transform] duration-300 data-[hidden=true]:pointer-events-none data-[hidden=true]:translate-y-6 data-[hidden=true]:opacity-0 min-[1000px]:hidden"
    >
      <a
        href="#contact"
        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent-btn px-4 text-[15px] font-medium text-white transition-colors hover:bg-accent-btn-hover"
      >
        {label}
      </a>
      <a
        href={contacts.phoneHref}
        onClick={() => trackPhone('dock')}
        aria-label={`Подзвонити: ${contacts.phone}`}
        className="grid size-12 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.25)]"
      >
        <Icon name="phone" className="size-5" />
      </a>
    </div>
  )
}
