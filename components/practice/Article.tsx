import type { ReactNode } from 'react'
import { Prose, ProseInline } from '@/components/site/Prose'
import { CheckList } from './Parts'

/**
 * Текст послуги як стаття.
 *
 * Portable Text з Sanity ріжеться на розділи за заголовками h2: кожен
 * розділ отримує якір (для змісту збоку) і номер «01, 02…». Вступ —
 * усе до першого h2 — йде лід-абзацом.
 *
 * Список, де кожен пункт починається з жирного терміна («**Договірні** —
 * …»), показується сіткою карток «термін → пояснення»: так у старих
 * текстах описані види спорів і послуг, і в картках їх легше сканувати.
 * Решта — звичайний Prose. Редактору нічого окремо робити не треба.
 */

/* ── мінімальні типи Portable Text ── */
interface Span {
  _type: 'span'
  _key?: string
  text: string
  marks?: string[]
}
interface Block {
  _type: string
  _key?: string
  style?: string
  listItem?: string
  level?: number
  children?: Span[]
  markDefs?: unknown[]
}

export interface ArticleSection {
  id: string
  title: string
  blocks: Block[]
}

const plain = (b: Block) => (b.children ?? []).map((c) => c.text).join('')

/** Вступ і розділи за h2. Якорі стабільні: s-1, s-2… */
export function splitArticle(value: unknown): { intro: Block[]; sections: ArticleSection[] } {
  const blocks = (Array.isArray(value) ? value : []) as Block[]
  const intro: Block[] = []
  const sections: ArticleSection[] = []
  for (const b of blocks) {
    if (b._type === 'block' && b.style === 'h2') {
      sections.push({ id: `s-${sections.length + 1}`, title: plain(b), blocks: [] })
    } else if (sections.length) {
      sections[sections.length - 1]!.blocks.push(b)
    } else {
      intro.push(b)
    }
  }
  return { intro, sections }
}

/** Орієнтовний час читання: ~180 слів на хвилину. */
export function readMinutes(value: unknown): number {
  const blocks = (Array.isArray(value) ? value : []) as Block[]
  const words = blocks.reduce((n, b) => n + plain(b).split(/\s+/).filter(Boolean).length, 0)
  return Math.max(1, Math.round(words / 180))
}

/* Картка: термін, пояснення і (якщо термін — посилання) адреса. */
interface Card {
  term: string
  body?: ReactNode
  href?: string
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
const linkOf = (b: Block, sp: Span) => {
  const defs = (b.markDefs ?? []) as { _key: string; _type?: string; href?: string }[]
  return defs.find((d) => d._type === 'link' && sp.marks?.includes(d._key))?.href
}
const hasLink = (b: Block) => (b.children ?? []).some((c) => !!linkOf(b, c))
const isBullet = (b?: Block) => b?._type === 'block' && b.listItem === 'bullet'

/* Пункт «**Термін** — пояснення» або «[Термін](посилання) — пояснення».
   Пункт-посилання без пояснення теж картка (огляд підпрактик). */
function termItem(b: Block): Card | null {
  if (!isBullet(b)) return null
  const [first, ...more] = b.children ?? []
  if (!first?.text.trim()) return null
  const href = linkOf(b, first)
  if (!href && !first.marks?.includes('strong')) return null
  const tail = more.map((c) => c.text).join('')
  if (!tail.trim()) return href ? { term: first.text.trim(), href } : null
  if (!/^\s*[—–:-]/.test(tail) || more.some((c) => linkOf(b, c))) return null
  return { term: first.text.trim(), body: cap(tail.replace(/^\s*[—–:-]\s*/, '').trim()), href }
}

/* Пункт для списку з галочками: без маркера списку, з великої літери,
   без «;» / «.» у кінці. Жирне всередині лишається. */
function tidy(b: Block): Block {
  const ch = (b.children ?? []).map((c) => ({ ...c }))
  const first = ch.find((c) => c.text.trim())
  if (first) first.text = cap(first.text.trimStart())
  const last = [...ch].reverse().find((c) => c.text.trim())
  if (last) last.text = last.text.trimEnd().replace(/[;,.]$/, '')
  return { ...b, listItem: undefined, level: undefined, children: ch }
}

type Chunk = { kind: 'prose'; blocks: Block[] } | { kind: 'cards'; items: Card[] } | { kind: 'checks'; items: Block[] }

/* Ділить блоки розділу на шматки:
   - ≥3 пунктів «термін — пояснення» → сітка карток;
   - ≥2 пар «h3 + абзац» → ті самі картки (абзац зі своїми посиланнями);
   - ≥4 простих пунктів без посилань → список з галочками у дві колонки;
   - решта → звичайний текст. */
function chunks(blocks: Block[]): Chunk[] {
  const out: Chunk[] = []
  const push = (b: Block) => {
    const last = out[out.length - 1]
    if (last?.kind === 'prose') last.blocks.push(b)
    else out.push({ kind: 'prose', blocks: [b] })
  }
  let i = 0
  while (i < blocks.length) {
    /* терміни */
    let j = i
    const terms: Card[] = []
    for (let t; j < blocks.length && (t = termItem(blocks[j]!)); j++) terms.push(t)
    if (terms.length >= 3) {
      out.push({ kind: 'cards', items: terms })
      i = j
      continue
    }
    /* h3 + абзац */
    j = i
    const pairs: Card[] = []
    while (blocks[j]?.style === 'h3' && blocks[j + 1] && !blocks[j + 1]!.listItem && (blocks[j + 1]!.style ?? 'normal') === 'normal') {
      pairs.push({ term: plain(blocks[j]!), body: <Prose value={[blocks[j + 1]]} /> })
      j += 2
    }
    if (pairs.length >= 2) {
      out.push({ kind: 'cards', items: pairs })
      i = j
      continue
    }
    /* простий список */
    j = i
    while (isBullet(blocks[j]) && !hasLink(blocks[j]!)) j++
    if (j - i >= 4 && !(j < blocks.length && isBullet(blocks[j]))) {
      out.push({ kind: 'checks', items: blocks.slice(i, j).map(tidy) })
      i = j
      continue
    }
    push(blocks[i]!)
    i++
  }
  return out
}

function Cards({ items }: { items: Card[] }) {
  return (
    <ul className="m-0 mb-7 mt-2 grid list-none gap-2.5 p-0 min-[640px]:grid-cols-2">
      {items.map((t, i) => {
        const inner = (
          <>
            <span className="font-serif text-[19px] font-semibold leading-[1.2] text-ink">{t.term}</span>
            {t.body && (
              <span className="text-[14.5px] leading-[1.6] text-slate [&_p]:m-0 [&_p]:max-w-none [&_p]:text-[14.5px] [&_p]:leading-[1.6]">{t.body}</span>
            )}
          </>
        )
        const cls =
          'group relative flex h-full flex-col gap-2 overflow-hidden rounded-[18px] bg-white p-[16px_18px_18px] no-underline shadow-[inset_0_0_0_1px_var(--color-hair)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_0_0_1px_var(--color-accent),0_18px_40px_-28px_rgb(11_7_16/0.45)] min-[640px]:p-[20px_22px_22px]'
        return (
          <li key={t.term}>
            {t.href ? (
              <a href={t.href} className={cls}>
                {inner}
              </a>
            ) : (
              <div className={cls}>{inner}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function SectionBody({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {chunks(blocks).map((c, i) =>
        c.kind === 'cards' ? (
          <Cards key={i} items={c.items} />
        ) : c.kind === 'checks' ? (
          <div key={i} className="mb-7 mt-2 rounded-[20px] bg-white p-[clamp(20px,2.6vw,28px)] shadow-[inset_0_0_0_1px_var(--color-hair)] [&_ul]:min-[640px]:grid-cols-2 [&_ul]:min-[640px]:gap-x-8">
            <CheckList items={c.items.map((b, k) => <ProseInline key={k} value={[b]} />)} />
          </div>
        ) : (
          <Prose key={i} value={c.blocks} />
        ),
      )}
    </>
  )
}

/** Розділ статті: заголовок і тіло (номерів немає — розділи не є кроками). */
export function ArticleSectionView({ s, n, children }: { s: ArticleSection; n: number; children?: ReactNode }) {
  return (
    <section id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-[calc(var(--hdr)+24px)] [&+&]:mt-[clamp(36px,4.4vw,56px)]">
      {void n}
      <h2
        id={`${s.id}-h`}
        className="m-0 mb-5 max-w-[26ch] font-serif text-[clamp(28px,3vw,40px)] font-normal leading-[1.15] tracking-[-0.02em] text-ink"
      >
        {s.title}
      </h2>
      <SectionBody blocks={s.blocks} />
      {children}
    </section>
  )
}

/** Вступ: перший абзац — лід великим серифом, решта — звичайний текст. */
export function ArticleIntro({ blocks }: { blocks: Block[] }) {
  if (!blocks.length) return null
  const [first, ...rest] = blocks
  const lead = first && first._type === 'block' && !first.listItem && (first.style ?? 'normal') === 'normal'
  return (
    <div className="mb-[clamp(36px,4.4vw,56px)]">
      <Prose value={[first]} lead={!!lead} />
      <SectionBody blocks={rest} />
    </div>
  )
}
