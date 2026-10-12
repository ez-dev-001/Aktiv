/**
 * Розбір тексту статті (portable text) без React: час читання, зміст
 * за заголовками h2 і поділ тексту на шматки між ними.
 *
 * Навіщо ділити: спільний Prose не дає своїх компонентів для h2, а
 * якорям змісту потрібні id. Тому h2 рендеримо самі (див. ArticleBody),
 * а все між ними віддаємо Prose як є — списки й цитати не розриваються,
 * бо межа завжди проходить по заголовку.
 */

type Span = { _type?: string; text?: string }
export type PTBlock = { _type?: string; _key?: string; style?: string; children?: Span[] }

const asBlocks = (body: unknown): PTBlock[] => (Array.isArray(body) ? (body as PTBlock[]) : [])

export const blockText = (b: PTBlock) =>
  (b.children ?? [])
    .map((c) => (typeof c?.text === 'string' ? c.text : ''))
    .join('')
    .trim()

/** Хвилини читання: ~200 слів за хвилину — середня швидкість для
 *  юридичного тексту українською. Немає тексту — немає й числа. */
export function readingMinutes(body: unknown): number | null {
  const words = asBlocks(body)
    .filter((b) => b._type === 'block')
    .reduce((n, b) => n + (blockText(b).match(/\S+/g)?.length ?? 0), 0)
  return words > 0 ? Math.max(1, Math.round(words / 200)) : null
}

export interface Heading {
  id: string
  text: string
}

export interface Segment {
  /** заголовок, з якого починається шматок (у першого — немає) */
  heading?: Heading
  blocks: PTBlock[]
}

/**
 * Шматки тексту, кожен (крім першого) починається з h2.
 * id — порядковий (`s-1`, `s-2`…): кирилицю в якорі браузери кодують
 * у %D0%… і посилання на розділ виходить нечитабельним.
 */
export function splitByH2(body: unknown): Segment[] {
  const out: Segment[] = [{ blocks: [] }]
  let n = 0
  for (const b of asBlocks(body)) {
    if (b._type === 'block' && b.style === 'h2' && blockText(b)) {
      n += 1
      out.push({ heading: { id: `s-${n}`, text: blockText(b) }, blocks: [] })
    } else {
      out[out.length - 1]?.blocks.push(b)
    }
  }
  return out.filter((s) => s.heading || s.blocks.length > 0)
}
