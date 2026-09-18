/**
 * Сторож схем Sanity.
 *
 *   npm run check:schema
 *
 * Ловит две ошибки — обе тихие, обе невидимые для TypeScript, обе
 * проявляются только в студии и только в рантайме.
 *
 * 1. Поле ссылается на тип, который забыли зарегистрировать в
 *    schemas/index.ts. Для TS `to: [{ type: 'teamMember' }]` — просто
 *    строка. Студия падает при запуске: «Unknown type».
 *
 * 2. Валидатор длины навешан на локализованное поле. localeString и
 *    localeText — ОБЪЕКТЫ с полями ua/en/ru, а не строки, и `.max(70)`
 *    у объекта не существует. Студия открывается, поле выглядит
 *    исправным, но при публикации выдаёт «Validator for flag "max"
 *    not found for type "Object"» и публиковать не даёт. Вместо
 *    `.max(n)` нужен `.custom(localeMax(n))` из objects/locale.ts.
 *
 * Скрипт разбирает файлы статически, а не импортирует их: схемы тянут
 * за собой весь пакет sanity, и запуск занял бы секунды вместо миллисекунд.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'sanity/schemas'

/** Типы, которые Sanity знает сам — регистрировать не нужно. */
const BUILTIN = new Set([
  'array', 'block', 'boolean', 'crossDatasetReference', 'date', 'datetime',
  'document', 'email', 'file', 'geopoint', 'globalDocumentReference', 'image',
  'number', 'object', 'reference', 'slug', 'span', 'string', 'text', 'url',
])

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : []
  })
}

const files = walk(ROOT).filter((f) => !f.endsWith('index.ts'))

/* Что объявлено: defineType({ name: 'x' — первое name в каждом файле. */
const defined = new Map()
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/defineType\(\{\s*\n?\s*name:\s*'([^']+)'/g)) {
    defined.set(m[1], file)
  }
}

/* Что зарегистрировано в index.ts — по именам импортов в массиве schemaTypes. */
const indexSrc = readFileSync(join(ROOT, 'index.ts'), 'utf8')
const listed = new Set(
  (indexSrc.match(/export const schemaTypes = \[([\s\S]*?)\]/)?.[1] ?? '')
    .split('\n')
    .map((l) => l.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/, '').trim().replace(/,$/, ''))
    .filter((l) => /^[a-zA-Z][\w]*$/.test(l)),
)

/* На что ссылаются: type: 'x' где угодно + to: [{ type: 'x' }]. */
const used = new Map()
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/type:\s*'([^']+)'/g)) {
    const t = m[1]
    if (BUILTIN.has(t)) continue
    const line = src.slice(0, m.index).split('\n').length
    if (!used.has(t)) used.set(t, [])
    used.get(t).push(`${relative('.', file)}:${line}`)
  }
}

const problems = []

/* ── Валидаторы длины на локализованных полях ──
   Ищем defineField, где type — локализованный, а в validation стоит
   .max( или .min(. Разбор нарочно грубый: поле объявляется одним
   выражением, и склейка «от defineField до закрывающей скобки»
   для этой проверки достаточна. */
const LOCALE_TYPES = new Set(['localeString', 'localeText', 'localeBlock'])
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/defineField\(\{([\s\S]*?)\}\)/g)) {
    const body = m[1]
    const type = /type:\s*'([^']+)'/.exec(body)?.[1]
    if (!type || !LOCALE_TYPES.has(type)) continue
    const bad = /validation:[^\n]*?\.(max|min)\(/.exec(body)
    if (!bad) continue
    const name = /name:\s*'([^']+)'/.exec(body)?.[1] ?? '?'
    const line = src.slice(0, m.index).split('\n').length
    problems.push({
      kind: 'Валидатор длины на объекте',
      type: `${name}: ${type}`,
      detail:
        `${relative('.', file)}:${line} — .${bad[1]}() навешан на ${type}, ` +
        'а это объект с полями ua/en/ru. Студия не даст опубликовать документ: ' +
        `«Validator for flag "${bad[1]}" not found for type "Object"»`,
      fix: `заменить .${bad[1]}(n) на .custom(localeMax(n)) — импорт из ../objects/locale`,
    })
  }
}

for (const [type, places] of used) {
  if (!defined.has(type)) {
    problems.push({
      kind: 'Тип не объявлен',
      type,
      detail: `используется в ${places.join(', ')}, но ни один файл его не определяет`,
      fix: `создать sanity/schemas/documents/${type}.ts с defineType({ name: '${type}', ... })`,
    })
  } else if (!listed.has(type)) {
    problems.push({
      kind: 'Тип не зарегистрирован',
      type,
      detail: `объявлен в ${relative('.', defined.get(type))}, используется в ${places[0]}, но его нет в schemaTypes`,
      fix: `добавить импорт и сам ${type} в массив schemaTypes в sanity/schemas/index.ts`,
    })
  }
}

/* Объявлен, но нигде не зарегистрирован и не используется — тоже стоит знать. */
for (const [type, file] of defined) {
  if (!listed.has(type)) {
    if (problems.some((p) => p.type === type)) continue
    problems.push({
      kind: 'Тип потерян',
      type,
      detail: `объявлен в ${relative('.', file)}, но не попал в schemaTypes — студия его не увидит`,
      fix: `добавить в массив schemaTypes в sanity/schemas/index.ts`,
    })
  }
}

if (problems.length === 0) {
  console.log(
    `  Схемы в порядке: ${defined.size} типов объявлено, ${listed.size} зарегистрировано, висячих ссылок нет.`,
  )
  process.exit(0)
}

console.error(`\n  Проблем со схемами: ${problems.length}\n`)
for (const p of problems) {
  console.error(`  ${p.kind}: ${p.type}`)
  console.error(`     ${p.detail}`)
  console.error(`     Починить: ${p.fix}\n`)
}
process.exit(1)
