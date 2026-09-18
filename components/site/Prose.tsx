import { PortableText, type PortableTextComponents } from '@portabletext/react'

/**
 * Рендер текста из Sanity.
 *
 * Стили заданы здесь, а не через prose-плагин: у сайта свой типографический
 * ритм — серифные заголовки, гротеск в тексте, узкая мера набора. Плагин
 * притащил бы свою шкалу и поспорил бы с ней.
 *
 * Мера набора 68ch: длинные строки в юридическом тексте читаются хуже
 * всего, а его тут будет много.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mb-5 max-w-[68ch] text-[16.5px] leading-[1.68] text-slate">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mb-4 mt-11 max-w-[30ch] text-[clamp(21px,3vw,28px)] leading-[1.18]">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 mt-9 max-w-[34ch] text-[clamp(18px,2.3vw,22px)] leading-[1.24]">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-7 max-w-[62ch] border-l-2 border-accent py-1 pl-5 font-serif text-[clamp(17px,2.2vw,21px)] italic leading-[1.42] text-ink">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="mb-6 grid max-w-[66ch] list-none gap-2.5 p-0">{children}</ul>,
    number: ({ children }) => (
      <ol className="mb-6 grid max-w-[66ch] list-none gap-2.5 p-0 [counter-reset:li]">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="grid grid-cols-[16px_1fr] gap-3 text-[16px] leading-[1.6] text-slate">
        <span className="mt-[0.62em] size-[5px] rounded-full bg-accent" />
        <span>{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li className="grid grid-cols-[22px_1fr] gap-3 text-[16px] leading-[1.6] text-slate [counter-increment:li] before:font-mono before:text-[12px] before:text-accent-ink before:content-[counter(li)'.']">
        <span>{children}</span>
      </li>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-medium text-ink">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => {
      const href = String((value as { href?: string })?.href ?? '')
      const external = /^https?:\/\//.test(href)
      return (
        <a
          href={href}
          className="text-accent-ink underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent"
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
      )
    },
  },
}

export function Prose({ value }: { value: unknown }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null
  return <PortableText value={value as never} components={components} />
}
