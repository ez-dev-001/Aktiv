/**
 * Убирает из Sanity всё, что связано с ценами и калькуляторами.
 *
 *   npm run cleanup:prices            — показать, что изменится (ничего не пишет)
 *   npm run cleanup:prices -- --apply — записать
 *
 * ── Зачем ──
 * Цены и калькуляторы убраны с сайта и из схемы студии. Но документы,
 * которые уже лежат в датасете, свои поля хранят: студия показала бы их
 * жёлтой плашкой «Unknown field», а документы «Калькулятор» остались бы
 * висеть без типа. Скрипт стирает ровно это и ничего больше:
 *
 *   • у практик — поля price и quiz, и цену внутри каждого варианта
 *     (packages[].price);
 *   • у категорий — поле quiz;
 *   • документы типа quiz целиком — и опубликованные, и черновики.
 *
 * Тексты, фото, варианты услуг, FAQ — не трогаются.
 *
 * Нужен SANITY_API_WRITE_TOKEN (Editor) в .env.local. На Netlify его
 * класть не нужно: скрипт запускается один раз, с вашего компьютера.
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
if (!token) {
  console.error('\n  Не задано SANITY_API_WRITE_TOKEN у .env.local — без нього датасет не прочитати повністю й не змінити.\n')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
  perspective: 'raw', /* и опубликованные, и черновики */
})

const practices = await client.fetch(
  `*[_type == "practice" && (defined(price) || defined(quiz) || count(packages[defined(price)]) > 0)]{
    _id, "title": title.ua, "hasPrice": defined(price), "hasQuiz": defined(quiz),
    "pkgKeys": packages[defined(price)]._key
  }`,
)
const categories = await client.fetch(`*[_type == "practiceCategory" && defined(quiz)]{ _id, "title": title.ua }`)
const quizzes = await client.fetch(`*[_type == "quiz"]{ _id, title }`)

console.log(`\n  Практики з цінами або калькулятором: ${practices.length}`)
for (const p of practices) {
  const what = [p.hasPrice && 'ціна', p.hasQuiz && 'калькулятор', p.pkgKeys?.length && `ціни у ${p.pkgKeys.length} варіантах`]
    .filter(Boolean)
    .join(', ')
  console.log(`    · ${p.title ?? p._id} — ${what}`)
}
console.log(`  Категорії з калькулятором: ${categories.length}`)
for (const c of categories) console.log(`    · ${c.title ?? c._id}`)
console.log(`  Документи «Калькулятор» (буде видалено): ${quizzes.length}`)
for (const q of quizzes) console.log(`    · ${q.title ?? q._id}`)

const total = practices.length + categories.length + quizzes.length
if (!total) {
  console.log('\n  Прибирати нічого — датасет уже чистий.\n')
  process.exit(0)
}
if (!APPLY) {
  console.log('\n  Це був перегляд — нічого не записано. Щоб записати: npm run cleanup:prices -- --apply\n')
  process.exit(0)
}

/* Порядок важен: сначала снимаем ссылки на калькуляторы, потом удаляем
   сами калькуляторы. Иначе Sanity откажет в удалении документа, на
   который ещё кто-то ссылается. */
let tx = client.transaction()
for (const p of practices) {
  tx = tx.patch(p._id, (pt) => pt.unset(['price', 'quiz', ...(p.pkgKeys ?? []).map((k) => `packages[_key=="${k}"].price`)]))
}
for (const c of categories) tx = tx.patch(c._id, (pt) => pt.unset(['quiz']))
await tx.commit()

if (quizzes.length) {
  let del = client.transaction()
  for (const q of quizzes) del = del.delete(q._id)
  await del.commit()
}

console.log(`\n  Готово: ${practices.length + categories.length} документів очищено, ${quizzes.length} калькуляторів видалено.\n`)
