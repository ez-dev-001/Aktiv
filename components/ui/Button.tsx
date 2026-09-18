import type { ComponentProps, ReactNode } from 'react'
import { Icon } from '@/components/site/Icon'

type Variant = 'solid' | 'ghost' | 'ghostDark'
type Size = 'md' | 'sm'

const base =
  'inline-flex items-center justify-center gap-2.5 rounded-full font-sans font-medium leading-tight ' +
  'transition-[background-color,box-shadow,transform] duration-200 active:translate-y-px ' +
  'disabled:pointer-events-none disabled:opacity-35'

const sizes: Record<Size, string> = {
  md: 'px-7 py-[15px] text-[15px]',
  sm: 'min-h-11 px-5 py-[11px] text-sm',
}

const variants: Record<Variant, string> = {
  solid: 'bg-accent text-white hover:bg-accent-ink',
  ghost: 'bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--color-hair)] hover:shadow-[inset_0_0_0_1px_var(--color-ink)]',
  ghostDark:
    'bg-transparent text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)] hover:shadow-[inset_0_0_0_1px_#fff]',
}

function cls(variant: Variant, size: Size, extra?: string) {
  return [base, sizes[size], variants[variant], extra].filter(Boolean).join(' ')
}

export function Button({
  variant = 'solid',
  size = 'md',
  arrow,
  className,
  children,
  ...rest
}: ComponentProps<'button'> & { variant?: Variant; size?: Size; arrow?: boolean }) {
  return (
    <button className={cls(variant, size, className)} {...rest}>
      {children}
      {arrow && <Icon name="arrow" className="size-[17px] shrink-0" />}
    </button>
  )
}

export function ButtonLink({
  variant = 'solid',
  size = 'md',
  arrow,
  className,
  children,
  ...rest
}: ComponentProps<'a'> & { variant?: Variant; size?: Size; arrow?: boolean }) {
  return (
    <a className={cls(variant, size, className)} {...rest}>
      {children}
      {arrow && <Icon name="arrow" className="size-[17px] shrink-0" />}
    </a>
  )
}

export function ArrowLink({ children, className = '', ...rest }: ComponentProps<'a'>) {
  return (
    <a
      className={`group inline-flex items-center gap-2 font-sans text-[14.5px] font-medium text-accent-ink ${className}`}
      {...rest}
    >
      {children}
      <Icon name="arrow" className="size-[15px] transition-transform duration-[240ms] group-hover:translate-x-1" />
    </a>
  )
}

export function Eyebrow({ children, plain }: { children: ReactNode; plain?: boolean }) {
  return (
    <p className="eyebrow" data-plain={plain ? 'true' : undefined}>
      {children}
    </p>
  )
}
