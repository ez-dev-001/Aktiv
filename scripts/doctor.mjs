/**
 * Диагностика Sanity в обход Next.
 *
 *   npm run sanity:doctor
 *
 * Зачем отдельный скрипт, когда есть /sanity-check. Та страница живёт
 * внутри Next, а значит внутри его кеша, его режима сборки и его
 * фолбэков. Когда вопрос звучит «связь есть, но правки не видно»,
 * страница — свидетель заинтересованный: она сама может показывать
 * снимок. Скрипт ходит в API напрямую, без CDN и без кеша, и печатает
 * то, что в датасете прямо сейчас.
 *
 * Главное, что он отвечает: КАЖДЫЙ блок сайта берёт данные из своего
 * типа документов, и переключается на Sanity независимо от остальных.
 * Если категорий нет — практики, цены и карточки на главной останутся
 * статикой, сколько бы вы ни правили сами практики. Скрипт показывает
 * это по блокам, а не одним словом «подключено».
 *
 * Запросы берутся из lib/sanity/queries.ts, а не дублируются здесь:
 * иначе диагностика однажды начнёт проверять не то, что выполняет сайт.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/* ── .env.local читаем сами: скрипт запускается вне Next ── */
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

const projectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '').trim()
const dataset = (process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production').trim()
const apiVersion = (process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? '2026-01-01').trim()
const readToken = (process.env.SANITY_API_READ_TOKEN ?? '').trim()
const writeToken = (process.env.SANITY_API_WRITE_TOKEN ?? '').trim()

const C = {
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  bad: (s) => `\x1b[31m${s}\x1b[0m`,
  warn: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[90m${s}\x1b[0m`,
  b: (s) => `\x1b[1m${s}\x1b[0m`,
}

const line = () => console.log(C.dim('─'.repeat(64)))

if (!projectId) {
  console.log(C.bad('NEXT_PUBLIC_SANITY_PROJECT_ID не заданий в .env.local — перевіряти нічого.'))
  process.exit(1)
}

/**
 * Достаём запросы из lib/sanity/queries.ts.
 *
 * Файл на TypeScript, импортировать его из .mjs нельзя, поэтому
 * шаблонные строки вынимаются разбором исходника. Приём держится
 * на том, что внутри GROQ нет обратных кавычек — а их там нет
 * и быть не может.
 */
function loadQueries() {
  const src = readFileSync(resolve(process.cwd(), 'lib/sanity/queries.ts'), 'utf8')
  const out = {}
  for (const m of src.matchAll(/export const (\w+)\s*=\s*groq`([\s\S]*?)`/g)) out[m[1]] = m[2]
  return out
}

const Q = loadQueries()

/** Прямой запрос в API: без CDN, без кеша Next, с токеном если он есть. */
async function query(groq, params = {}, token = readToken || writeToken) {
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set('query', groq)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, JSON.stringify(v))

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const text = await res.text()
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
    err.status = res.status
    throw err
  }
  return JSON.parse(text).result
}

console.log('')
console.log(C.b('  Діагностика Sanity — напряму, без Next'))
line()
console.log(`  проєкт    ${projectId}`)
console.log(`  датасет   ${dataset}`)
console.log(`  API       ${apiVersion}`)
console.log(`  read-токен  ${readToken ? C.ok('заданий') : C.warn('порожній')}`)
console.log(`  write-токен ${writeToken ? C.ok('заданий') : C.dim('порожній')}`)
line()

/* ── 1. доступ ── */
let access = 'unknown'
try {
  await query('count(*)', {}, '') // анонимно
  access = 'public'
  console.log(`  доступ    ${C.ok('публічний')} — сайт читає датасет без токена`)
} catch (e) {
  if (e.status === 401 || e.status === 403) {
    if (readToken || writeToken) {
      try {
        await query('count(*)')
        access = 'private'
        console.log(`  доступ    ${C.warn('приватний')} — без токена датасет не віддається`)
        if (!readToken) {
          console.log(
            C.bad(
              '            SANITY_API_READ_TOKEN порожній, отже САЙТ ходить без токена\n' +
                '            і бачить 401. Зробіть датасет публічним або задайте read-токен.',
            ),
          )
        }
      } catch {
        access = 'missing'
        console.log(`  доступ    ${C.bad('немає')} — відмова і з токеном: перевірте id проєкту й назву датасету`)
      }
    } else {
      console.log(`  доступ    ${C.bad('401')} — і токенів немає, щоб розрізнити приватність від опечатки`)
    }
  } else {
    console.log(`  доступ    ${C.bad(e.message)}`)
  }
}

if (access === 'missing') process.exit(1)

/* ── 2. что лежит в датасете ── */
line()
console.log(C.b('  Документи'))
/* Страницы-синглтоны в списке обязательно: по ним видно, засеяна ли
   страница вообще. Ноль у homePage — значит сайт показывает текст из
   кода, и сид этого документа ничего не перезапишет. Единица — значит
   документ уже есть и, возможно, отредактирован в студии, и сидить его
   заново — стирать эти правки. */
const TYPES = [
  'practiceCategory', 'practice', 'post', 'teamMember', 'quiz',
  'siteSettings', 'homePage', 'aboutPage', 'teamPage',
]
let totalPublished = 0
/* Счёт может не выполниться вовсе. Считать это нулём нельзя: «типів
   немає» и «не зміг дізнатися» — разные ответы, а диагностика, которая
   их путает, отправляет чинить не то. */
let countsKnown = true
for (const t of TYPES) {
  let pub = null
  let dr = null
  try {
    pub = await query(`count(*[_type == "${t}" && !(_id in path("drafts.**"))])`)
    dr = await query(`count(*[_type == "${t}" && _id in path("drafts.**")])`)
  } catch (e) {
    countsKnown = false
    console.log(`  ${C.bad('×')} ${t.padEnd(18)} ${C.bad(e.message.slice(0, 44))}`)
    continue
  }
  totalPublished += pub
  const mark = pub > 0 ? C.ok('●') : dr > 0 ? C.warn('○') : C.dim('·')
  const draftNote = dr > 0 ? C.warn(`  + ${dr} у чернетках (сайт їх НЕ бачить)`) : ''
  console.log(`  ${mark} ${t.padEnd(18)} ${String(pub).padStart(3)} опубліковано${draftNote}`)
}

if (countsKnown && totalPublished === 0) {
  console.log('')
  console.log(C.bad('  У датасеті немає ЖОДНОГО опублікованого документа.'))
  console.log(C.dim('  Якщо в студії контент є — його не опубліковано: у кожному документі'))
  console.log(C.dim('  треба натиснути Publish. Сайт ходить з perspective "published"'))
  console.log(C.dim('  і чернеток не бачить взагалі.'))
}

/* ── 3. что покажет каждый блок сайта ── */
line()
console.log(C.b('  Звідки візьме дані кожен блок сайта'))
console.log(C.dim('  Правило всюди одне: порожня відповідь → статика з lib/content.ts'))
console.log('')

const BLOCKS = [
  ['практики, меню, картки', 'CATEGORIES_QUERY', { lang: 'ua' }],
  ['таблиця цін', 'PRICE_LIST_QUERY', { lang: 'ua' }],
  ['команда', 'TEAM_QUERY', { lang: 'ua' }],
  ['цифри-лічильники', 'FIGURES_QUERY', { lang: 'ua' }],
  ['блог', 'POSTS_QUERY', { lang: 'ua', limit: 3 }],
  ['калькулятори', 'QUIZZES_QUERY', { lang: 'ua' }],
  ['контакти', 'CONTACTS_QUERY', { lang: 'ua' }],
  ['«Нам довіряють»: текст, цифри, стрічка', 'TRUST_QUERY', { lang: 'ua' }],
  ['перший екран, кредо, шлях справи', 'HOME_QUERY', { lang: 'ua' }],
  ['«Про компанію»: місія, цінності, принципи', 'ABOUT_QUERY', { lang: 'ua' }],
  ['«Команда»: заголовки й виконавець', 'TEAM_PAGE_QUERY', { lang: 'ua' }],
]

/**
 * Блоки, у которых Sanity нет вовсе — они всегда из кода.
 * Перечислены явно: молчание о них и породило вопрос «правлю,
 * а не меняется». Лучше честный список, чем догадки.
 */
const CODE_ONLY = [
  ['підписи станцій лінії справи', 'app/[lang]/page.tsx → STATIONS'],
  ['заголовки блоків «Вартість», «Команда», «Блог»', 'у розмітці сторінок'],
]

let anyLive = false
for (const [label, name, params] of BLOCKS) {
  if (!Q[name]) {
    console.log(`  ${C.dim('?')} ${label.padEnd(28)} ${C.dim(`запит ${name} не знайдено`)}`)
    continue
  }
  try {
    const rows = await query(Q[name], params)
    const n = Array.isArray(rows) ? rows.length : rows ? 1 : 0
    if (n > 0) {
      anyLive = true
      console.log(`  ${C.ok('●')} ${label.padEnd(28)} ${C.ok('Sanity')} ${C.dim(`(${n})`)}`)
    } else {
      console.log(`  ${C.warn('○')} ${label.padEnd(28)} ${C.warn('статика')} ${C.dim('— запит повернув порожньо')}`)
    }
  } catch (e) {
    console.log(`  ${C.bad('×')} ${label.padEnd(28)} ${C.bad(e.message.slice(0, 60))}`)
  }
}

console.log('')
console.log(C.dim('  Завжди з коду, Sanity для них не підключений:'))
for (const [label, where] of CODE_ONLY) {
  console.log(`  ${C.dim('—')} ${label.padEnd(28)} ${C.dim(where)}`)
}

/* ── 4. свежесть ── */
line()
try {
  const last = await query('*[!(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{_type,_updatedAt,"id":_id}')
  if (last?._updatedAt) {
    const ago = Math.round((Date.now() - new Date(last._updatedAt).getTime()) / 1000)
    console.log(`  Остання правка в датасеті: ${last._type} — ${ago} с тому`)
    console.log(C.dim(`  ${last.id}`))
    console.log(C.dim('  Якщо ви щойно щось змінили, а тут стара дата — правку не опубліковано.'))
  } else {
    console.log(C.warn('  У датасеті немає опублікованих документів.'))
  }
} catch {
  /* не критично */
}

/* ── 5. вывод ── */
line()
if (!countsKnown && !anyLive) {
  console.log(C.bad('  ПІДСУМОК: датасет не відповідає — причина вище, у рядках з «×».'))
  console.log(C.dim('  Поки запити не проходять, про вміст датасету сказати нічого не можна.'))
} else if (!anyLive) {
  console.log(C.bad('  ПІДСУМОК: сайт зараз показує статику, а не Sanity.'))
  console.log('')
  console.log('  Найчастіші причини, згори вниз:')
  console.log('   1. документи створені, але не опубліковані — натисніть Publish;')
  console.log('   2. немає жодного practiceCategory — головна тримається саме на них,')
  console.log('      і без категорій практики, ціни й меню лишаються статикою.')
  console.log('      Запустіть `npm run seed`;')
  console.log('   3. датасет приватний, а SANITY_API_READ_TOKEN порожній.')
} else {
  console.log(C.ok('  ПІДСУМОК: датасет віддає дані, блоки вище з позначкою «Sanity» — живі.'))
  console.log(C.dim('  Якщо на сторінці все одно старе — перезапустіть dev-сервер.'))
}
console.log('')
