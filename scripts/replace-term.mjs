/**
 * «вилка» → «діапазон» в документах, которые уже лежат в Sanity.
 *
 *   npm run term:diapazon            — показать, что изменится (ничего не пишет)
 *   npm run term:diapazon -- --apply — записать
 *
 * ── Зачем отдельный скрипт ──
 * Слово поменяли в коде, но код — это только запасной текст на случай,
 * если документа в Sanity нет. Всё, что уже засеяно (кредо на главной,
 * станции «Шлях справи», заголовки и дисклеймеры калькуляторов), сайт
 * берёт из Sanity. Там «вилка» осталась бы, и правка в коде на живом
 * сайте не изменила бы ничего — самый обидный вид несделанной работы.
 *
 * Пересеять документы заново (`npm run seed`) — не выход: сид
 * перезаписывает поля целиком и снёс бы ваши собственные правки в
 * студии. Этот скрипт меняет ТОЛЬКО строки, в которых есть «вилка», и
 * только известные фразы.
 *
 * ── Почему фразы целиком, а не слово ──
 * «вилка» женского рода, «діапазон» — мужского. Механическая замена
 * слова дала бы «Письмова діапазон» и «цей вилку» — хуже, чем было.
 * Поэтому каждая фраза, которую засеял сид, заменяется целиком, уже
 * согласованной. Всё, где «вилка» стоит в тексте, который вы писали
 * сами, скрипт НЕ трогает, а показывает списком: документ, поле и
 * фрагмент, — такое править надо руками, с падежами.
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(resolve(process.cwd(), file), 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    /* файла нет — не страшно */
  }
}

const APPLY = process.argv.includes('--apply')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId) {
  console.error('\n  Не задано NEXT_PUBLIC_SANITY_PROJECT_ID у .env.local\n')
  process.exit(1)
}
if (APPLY && !token) {
  console.error('\n  Для --apply потрібен SANITY_API_WRITE_TOKEN у .env.local\n')
  process.exit(1)
}

/**
 * Фразы ровно в том виде, в каком их засеял сид (lib/content.ts и
 * lib/quizzes.ts до замены), и их новый вид — такой же, как теперь в
 * коде. Порядок важен: длинные фразы идут раньше коротких, чтобы
 * «вилка або гонорар успіху» не была частично съедена правилом для
 * какой-нибудь более короткой фразы.
 */
const PHRASES = [
  [
    'Письмова вилка з прайсу або з калькулятора',
    'Письмовий діапазон вартості з прайсу або з калькулятора',
  ],
  [
    'Чотири питання — і вилка по вашій ситуації',
    'Чотири питання — і діапазон вартості для вашої ситуації',
  ],
  ['Вилка — попередня оцінка, а не оферта.', 'Діапазон — попередня оцінка, а не оферта.'],
  ['Вилка покриває гонорар за представництво.', 'Діапазон покриває гонорар за представництво.'],
  ['вилка або гонорар успіху', 'діапазон або гонорар успіху'],
  ['вилка в гривнях', 'діапазон у гривнях'],
  ['Стратегія і вилка', 'Стратегія і діапазон вартості'],
]

const TYPES = [
  'homePage',
  'aboutPage',
  'teamPage',
  'siteSettings',
  'practice',
  'practiceCategory',
  'post',
  'teamMember',
]

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
  perspective: 'raw', /* и опубликованные, и черновики */
})

const hasTerm = (s) => /вилк/i.test(s)

/** Меняет известные фразы в строке. Возвращает новую строку. */
function fix(s) {
  let out = s
  for (const [a, b] of PHRASES) out = out.split(a).join(b)
  return out
}

/**
 * Обходит значение и возвращает его копию с заменами.
 * leftovers собирает строки, где «вилка» осталась после замен:
 * это текст, написанный вручную, — его скрипт не трогает.
 */
function walk(value, path, leftovers) {
  if (typeof value === 'string') {
    const next = hasTerm(value) ? fix(value) : value
    if (hasTerm(next)) leftovers.push({ path, text: next })
    return next
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => walk(v, `${path}[${v && v._key ? `_key=="${v._key}"` : i}]`, leftovers))
  }
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = walk(v, path ? `${path}.${k}` : k, leftovers)
    return out
  }
  return value
}

const docs = await client.fetch(`*[_type in $types]`, { types: TYPES })

const patches = []
const manual = []

for (const doc of docs) {
  const set = {}
  for (const [field, value] of Object.entries(doc)) {
    if (field.startsWith('_')) continue
    const leftovers = []
    const next = walk(value, field, leftovers)
    if (JSON.stringify(next) !== JSON.stringify(value)) set[field] = next
    for (const l of leftovers) manual.push({ id: doc._id, type: doc._type, ...l })
  }
  if (Object.keys(set).length) patches.push({ id: doc._id, type: doc._type, set })
}

const shorten = (s) => (s.length > 90 ? `${s.slice(0, 87)}…` : s)

console.log(`\n  Переглянуто документів: ${docs.length}`)
console.log(`  Буде змінено автоматично: ${patches.length}`)
for (const p of patches) console.log(`    · ${p.type.padEnd(16)} ${p.id}  → поля: ${Object.keys(p.set).join(', ')}`)

if (manual.length) {
  console.log(`\n  Лишилось «вилка» в тексті, написаному вручну — ${manual.length}. Це треба поправити в студії:`)
  for (const m of manual) {
    const at = m.text.search(/вилк/i)
    const frag = m.text.slice(Math.max(0, at - 30), at + 40)
    console.log(`    · ${m.type} ${m.id}\n        ${m.path}\n        …${shorten(frag)}…`)
  }
} else {
  console.log('\n  Тексту з «вилка», написаного вручну, немає.')
}

if (!APPLY) {
  console.log(
    patches.length
      ? '\n  Це був перегляд — нічого не записано. Щоб записати: npm run term:diapazon -- --apply\n'
      : '\n  Змінювати нічого.\n',
  )
  process.exit(0)
}

if (!patches.length) {
  console.log('\n  Змінювати нічого.\n')
  process.exit(0)
}

const tx = patches.reduce((t, p) => t.patch(p.id, (pt) => pt.set(p.set)), client.transaction())
await tx.commit()
console.log(`\n  Записано: ${patches.length} документ(ів). Сайт підхопить зміни за кілька хвилин або після вебхука.\n`)
