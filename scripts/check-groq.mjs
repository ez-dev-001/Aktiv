/**
 * Сторож GROQ: разбирает каждый запрос из lib/sanity/queries.ts
 * настоящим парсером, не отправляя ничего в сеть.
 *
 *   npm run check:groq
 *
 * ── Зачем ──
 * Ошибка в GROQ не роняет сборку и не красит страницу. TypeScript
 * видит внутри обратных кавычек просто строку и молчит. Запрос
 * уезжает на сервер, Sanity отвечает parse error, sanityFetch по
 * правилу «пусто → статика» возвращает null, и блок показывает текст
 * из lib/content.ts. Снаружи это выглядит как «Sanity не
 * подключён» — при полностью рабочем подключении.
 *
 * Именно так сломался TRUST_QUERY: я оставил внутри запроса блочный
 * комментарий. GROQ комментариев не понимает вообще — ни блочных, ни
 * строчных, ни решёткой. Блок честно показывал прежний текст, и
 * отличить это от нормальной работы на глаз было нельзя: в Sanity те
 * же поля были не заполнены, и статика совпадала с ожидаемым.
 *
 * Поэтому проверка статическая и запускается рядом с check:schema.
 *
 * ── Почему подставляются числа в срезы ──
 * groq-js 2.0 требует в срезе константу и отвергает `[0...$limit]`,
 * хотя живой API его принимает. Чтобы сторож не ругался на рабочий
 * код, переменная в срезе заменяется числом перед разбором. Всё
 * остальное — `$lang` в ключах, `$slug` в фильтрах — парсер понимает
 * как есть, и подменять это нельзя: именно там и живут опечатки,
 * которые мы ловим.
 */
import { readFileSync } from 'node:fs'
import { parse } from 'groq-js'

const FILE = 'lib/sanity/queries.ts'
const C = {
  b: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[90m${s}\x1b[0m`,
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  bad: (s) => `\x1b[31m${s}\x1b[0m`,
}

let src
try {
  src = readFileSync(FILE, 'utf8')
} catch {
  console.error(`\n  ${C.bad('Не знайшов')} ${FILE}\n`)
  process.exit(1)
}

const queries = [...src.matchAll(/export const (\w+) = groq`([\s\S]*?)`/g)]

if (queries.length === 0) {
  console.error(`\n  ${C.bad('У файлі немає жодного groq-запиту')} — перевіряти нічого.\n`)
  process.exit(1)
}

/** Номер строки в файле, где начинается запрос — чтобы клик в терминале попадал куда нужно. */
const lineOf = (index) => src.slice(0, index).split('\n').length

const problems = []

for (const m of queries) {
  const [, name, body] = m
  const at = lineOf(m.index)

  /* Комментарий внутри запроса — самая частая и самая незаметная
     ошибка, поэтому про неё говорим отдельно и своими словами, а не
     сообщением парсера про «expected '}'». */
  const comment = /\/\*|\*\//.exec(body) ?? /(^|\s)\/\//.exec(body) ?? /(^|\s)#/.exec(body)
  if (comment) {
    problems.push({
      name,
      at,
      what: `коментар «${comment[0].trim()}» всередині запиту`,
      why: 'GROQ не розуміє коментарів — ні блочних, ні рядкових, ні решіткою',
      fix: 'перенести пояснення в JSDoc над запитом',
    })
    continue
  }

  const forParser = body.replace(/\[(\d+)\s*\.\.\.\s*\$\w+\]/g, '[$1...100]')

  try {
    parse(forParser)
  } catch (e) {
    problems.push({
      name,
      at,
      what: e.message.split('\n')[0],
      why: 'Sanity відповість parse error, запит віддасть null — і блок тихо покаже статику',
      fix: 'перевірити дужки, коми й назви полів у запиті',
    })
  }
}

if (problems.length === 0) {
  console.log(`\n  ${C.ok('GROQ у порядку')}: ${queries.length} запитів розібрано парсером, помилок немає.\n`)
  process.exit(0)
}

console.error(`\n  ${C.b(`Помилок у GROQ: ${problems.length}`)}\n`)
for (const p of problems) {
  console.error(`  ${C.bad('×')} ${C.b(p.name)}  ${C.dim(`${FILE}:${p.at}`)}`)
  console.error(`      ${p.what}`)
  console.error(`      ${C.dim(p.why)}`)
  console.error(`      Полагодити: ${p.fix}\n`)
}
process.exit(1)
