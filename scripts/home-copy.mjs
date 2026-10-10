/**
 * Нові тексти головної → Sanity.
 *
 *   npm run home:copy                 показати, що зміниться (нічого не пише)
 *   npm run home:copy -- --apply      записати
 *   npm run home:copy -- --apply --trust
 *                                     ще й блок «Нам довіряють» (Налаштування сайту)
 *
 * ── Що чіпає ──
 * Документ homePage, лише три поля:
 *   • heroHeading, heroHeadingAccent, heroLede, heroCtaPrimary, heroCtaSecondary —
 *     заголовок, абзац і кнопки першого екрана;
 *   • credo    — нові назви п'яти правил (ключі елементів зберігаються);
 *   • credoEyebrow — «Місія».
 * З прапорцем --trust ще siteSettings:
 *   • trustEyebrow і trustHeading;
 *   • trustFacts — ТІЛЬКИ якщо список порожній. Чотири цифри зі старого
 *     сайту (2007, 300+, 400+, 150 млн ₴). Якщо в студії вже є свої
 *     цифри — їх не чіпаємо.
 * Нічого іншого — ні практик, ні команди, ні контактів — скрипт не
 * торкається. Це не seed.
 *
 * Пише в опубліковані документи. Сайт оновиться сам через вебхук.
 * Якщо в студії в цих документах є неопубліковані правки (чернетка),
 * скрипт попередить: чернетка після публікації перезапише ці поля.
 *
 * Токен — SANITY_API_WRITE_TOKEN з .env.local. Скрипт його не друкує.
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(resolve(process.cwd(), file), 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  } catch {
    /* файлу немає */
  }
}

const APPLY = process.argv.includes('--apply')
const TRUST = process.argv.includes('--trust')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN

if (!projectId) {
  console.error('\n  Немає NEXT_PUBLIC_SANITY_PROJECT_ID у .env.local\n')
  process.exit(1)
}
if (APPLY && !process.env.SANITY_API_WRITE_TOKEN) {
  console.error('\n  Для --apply потрібен SANITY_API_WRITE_TOKEN у .env.local\n')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2026-01-01', useCdn: false, token })
const L = (ua) => ({ _type: 'localeString', ua })

/* ═══════════ НОВІ ТЕКСТИ ═══════════ */

const HERO_HEADING = 'Юридичний супровід бізнесу і'
const HERO_HEADING_ACCENT = 'захист ваших прав'
const HERO_CTA_PRIMARY = 'Отримати консультацію'
const HERO_CTA_SECONDARY = 'Ознайомитись'
const HERO_LEDE =
  'Юридична компанія «АКТИВ» з 2007 року веде ліквідації та банкрутства, судові спори, справи з нерухомістю й військове право. Власний приватний виконавець у команді — тому рішення суду для наших клієнтів стає грошима, а не папером.'

const CREDO_TITLES = [
  'Беремося за справу, лише коли бачимо шлях.',
  'Починаємо без передоплати.',
  'Ціну називаємо до договору.',
  'Доводимо до виконання, а не до рішення.',
  'Інтереси клієнта — вище за процес.',
]

const TRUST_EYEBROW = 'Нам довіряють'
const TRUST_HEADING = 'Чому нам доручають справи'
/* Усі чотири — зі старого сайту aktiv-alb.com (головна сторінка). */
const TRUST_FACTS = [
  { value: '2007', label: 'рік заснування' },
  { value: '300+', label: 'ліквідованих підприємств' },
  { value: '400+', label: 'успішних судових процесів' },
  { value: '150 млн ₴', label: 'стягнуто на користь клієнтів' },
]

/* ═══════════ ЧИТАЄМО ПОТОЧНЕ ═══════════ */

const cur = await client.fetch(`{
  "home": *[_id == "homePage"][0]{ _id, heroHeading, heroHeadingAccent, heroLede, heroCtaPrimary, heroCtaSecondary, credo, credoEyebrow },
  "homeDraft": defined(*[_id == "drafts.homePage"][0]._id),
  "settings": *[_id == "siteSettings"][0]{ _id, trustEyebrow, trustHeading, trustFacts },
  "settingsDraft": defined(*[_id == "drafts.siteSettings"][0]._id)
}`)

if (!cur.home) {
  console.error('\n  Документа homePage немає в Sanity. Спершу: npm run seed -- --only=homePage\n')
  process.exit(1)
}

const ua = (v) => (v && typeof v === 'object' ? v.ua ?? '' : v ?? '')
const show = (label, before, after) => {
  if (before === after) return console.log(`  = ${label}: без змін`)
  console.log(`  ~ ${label}\n      було:  ${before || '—'}\n      стане: ${after}`)
}

/* homePage */
const homeSet = {}

homeSet.heroHeading = { ...(cur.home.heroHeading ?? {}), _type: 'localeString', ua: HERO_HEADING }
homeSet.heroLede = { ...(cur.home.heroLede ?? {}), _type: 'localeText', ua: HERO_LEDE }
homeSet.heroHeadingAccent = { ...(cur.home.heroHeadingAccent ?? {}), _type: 'localeString', ua: HERO_HEADING_ACCENT }
homeSet.heroCtaPrimary = { ...(cur.home.heroCtaPrimary ?? {}), _type: 'localeString', ua: HERO_CTA_PRIMARY }
homeSet.heroCtaSecondary = { ...(cur.home.heroCtaSecondary ?? {}), _type: 'localeString', ua: HERO_CTA_SECONDARY }

const credoNow = cur.home.credo ?? []
const credo = CREDO_TITLES.map((title, i) => {
  const old = credoNow[i]
  return { _type: 'rule', _key: old?._key ?? `c${i}`, title: { ...(old?.title ?? {}), _type: 'localeString', ua: title } }
})
homeSet.credo = credo
homeSet.credoEyebrow = { ...(cur.home.credoEyebrow ?? {}), _type: 'localeString', ua: 'Місія' }

console.log('\n── Головна сторінка (homePage) ──')
show('H1 першого екрана', ua(cur.home.heroHeading), HERO_HEADING)
show('H1 — акцент', ua(cur.home.heroHeadingAccent), HERO_HEADING_ACCENT)
show('абзац під H1', ua(cur.home.heroLede), HERO_LEDE)
show('головна кнопка', ua(cur.home.heroCtaPrimary), HERO_CTA_PRIMARY)
show('посилання поруч', ua(cur.home.heroCtaSecondary), HERO_CTA_SECONDARY)
CREDO_TITLES.forEach((t, i) => show(`правило ${i + 1}`, ua(credoNow[i]?.title), t))
show('надзаголовок місії', ua(cur.home.credoEyebrow), 'Місія')
if (cur.homeDraft) console.log('\n  ! У студії є неопублікована чернетка головної. Після її публікації ці поля повернуться до чернетки.')

/* siteSettings */
const settingsSet = {}
if (TRUST) {
  console.log('\n── Нам довіряють (siteSettings) ──')
  if (!cur.settings) {
    console.log('  ! Документа siteSettings немає — пропускаю.')
  } else {
    settingsSet.trustEyebrow = { ...(cur.settings.trustEyebrow ?? {}), _type: 'localeString', ua: TRUST_EYEBROW }
    settingsSet.trustHeading = { ...(cur.settings.trustHeading ?? {}), _type: 'localeString', ua: TRUST_HEADING }
    show('надзаголовок', ua(cur.settings.trustEyebrow), TRUST_EYEBROW)
    show('заголовок', ua(cur.settings.trustHeading), TRUST_HEADING)
    if ((cur.settings.trustFacts ?? []).length) {
      console.log(`  = цифри: у студії вже ${cur.settings.trustFacts.length} — не чіпаю`)
    } else {
      settingsSet.trustFacts = TRUST_FACTS.map((f, i) => ({ _type: 'fact', _key: `t${i}`, value: f.value, label: L(f.label) }))
      console.log(`  + цифри: ${TRUST_FACTS.map((f) => f.value).join(' · ')}`)
    }
    if (cur.settingsDraft) console.log('\n  ! У студії є неопублікована чернетка налаштувань сайту.')
  }
} else {
  console.log('\n  (блок «Нам довіряють» не чіпаю — додайте --trust, якщо треба)')
}

/* ═══════════ ЗАПИС ═══════════ */

if (!APPLY) {
  console.log('\n  Це попередній перегляд. Записати: npm run home:copy -- --apply' + (TRUST ? ' --trust' : '') + '\n')
  process.exit(0)
}

const tx = client.transaction().patch('homePage', (p) => p.set(homeSet))
if (Object.keys(settingsSet).length) tx.patch('siteSettings', (p) => p.set(settingsSet))
await tx.commit()
console.log('\n  Готово. Сайт оновиться через вебхук за кілька секунд.\n')
