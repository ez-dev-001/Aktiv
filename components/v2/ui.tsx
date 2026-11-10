import type { CSSProperties, ReactNode } from 'react'
import { v2img } from '@/lib/v2/practices'
import { V2_ICONS } from '@/lib/v2/content'

/* Спільні дрібниці нової редакції: фон-картинка із заглушкою, заголовок
   секції з малиновим хвостом, стрілка ↗, надзаголовок із рискою. */

/** Фон-картинка поверх градієнта-заглушки. */
export const bg = (name: string, fallback: string, pos = 'center'): CSSProperties => ({
  backgroundImage: `url(${v2img(name)}), ${fallback}`,
  backgroundSize: 'cover, cover',
  backgroundPosition: `${pos}, center`,
  backgroundRepeat: 'no-repeat',
})

export const DARK_ART =
  'radial-gradient(60% 80% at 78% 40%, rgb(250 33 99 / 0.28), transparent 70%), linear-gradient(118deg, transparent 52%, rgb(250 33 99 / 0.55) 52.2%, rgb(250 33 99 / 0.12) 60%, transparent 60.2%), linear-gradient(180deg, #161019, #0b0710)'
export const LIGHT_ART =
  'radial-gradient(50% 70% at 85% 30%, rgb(250 33 99 / 0.12), transparent 70%), linear-gradient(118deg, transparent 70%, rgb(250 33 99 / 0.18) 70.2%, transparent 76%), linear-gradient(180deg, #f3ecea, #f7f3f1)'

/** Заголовок секції одним кольором. Малиновий хвіст прибрано (UI/UX-ревізія):
    акцент лишається тільки в першому екрані й на кнопках. Дві частини —
    для сумісності з викликами. */
export function H2({ a, b, dark, className = '' }: { a: ReactNode; b: ReactNode; dark?: boolean; className?: string }) {
  return (
    <h2
      className={`v2-rise m-0 font-serif text-[clamp(40px,5.4vw,76px)] font-normal leading-[1.04] tracking-[-0.022em] ${
        dark ? 'text-white' : 'text-ink'
      } ${className}`}
    >
      {a}
      {b}
    </h2>
  )
}

export const ArrowUR = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 12 12 4M6 4h6v6" />
  </svg>
)



/** Надзаголовок: коротка малинова риска + моноширинний підпис капітелями. */
export function Kick({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`m-0 text-[14px] font-semibold ${dark ? 'text-on-dark' : 'text-slate'}`}>{children}</p>
  )
}

/** Лінійна іконка нової редакції з набору V2_ICONS. */
export function V2Icon({ name, className = 'size-6' }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: V2_ICONS[name] ?? '' }}
    />
  )
}
