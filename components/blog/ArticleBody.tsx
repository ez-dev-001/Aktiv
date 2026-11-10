import type { ReactNode } from 'react'
import { Prose } from '@/components/site/Prose'
import { splitByH2 } from './text'

/**
 * Текст статті з якорями на h2 і вставкою посередині.
 *
 * Prose спільний і своїх компонентів не приймає, тому h2 ставимо самі
 * між шматками тексту (класи — ті самі, що в Prose), з id для змісту.
 * `middle` — плашка-заклик: перед другим розділом, а якщо розділів
 * менше двох — після тексту.
 */
const H2 =
  'mb-4 mt-11 max-w-[30ch] scroll-mt-[calc(var(--hdr)+24px)] text-[clamp(26px,3vw,38px)] font-serif font-normal leading-[1.18] tracking-[-0.015em]'

export function ArticleBody({ body, middle }: { body: unknown; middle?: ReactNode }) {
  const parts = splitByH2(body)
  const at = parts.findIndex((p) => p.heading?.id === 's-2')

  return (
    <>
      {parts.map((p, i) => (
        <div key={p.heading?.id ?? `p-${i}`} className="contents">
          {i === at && middle}
          {p.heading && (
            <h2 id={p.heading.id} className={H2}>
              {p.heading.text}
            </h2>
          )}
          <Prose value={p.blocks} />
        </div>
      ))}
      {at < 0 && middle}
    </>
  )
}
