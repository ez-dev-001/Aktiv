/**
 * Заполнение датасета контентом сайта.
 *
 *   npm run seed
 *
 * ── Главное отличие от прежней версии ──
 * Скрипт больше не хранит свою копию данных. Раньше здесь лежали
 * вручную выписанные 5 практик и 6 человек, и это неизбежно разошлось
 * с сайтом: в lib/content.ts было 36 направлений и 10 человек, а в
 * Sanity приезжало 5 и 6. Причём цена альтернативной ликвидации тут
 * оставалась старой — 10 000 вместо 12 000.
 *
 * Теперь источник один: lib/content.ts импортируется
 * напрямую. Node читает TypeScript через --experimental-strip-types
 * (есть с 22.6), поэтому расхождение стало невозможным физически.
 *
 * Идемпотентно: у документов детерминированные _id, повторный запуск
 * обновляет, а не плодит дубли.
 *
 * Нужен токен с правом записи:
 *   sanity.io/manage → ваш проєкт → API → Tokens → Add token → Editor
 *   в .env.local как SANITY_API_WRITE_TOKEN
 *
 * Сухой прогон — ничего не пишет, только показывает, что уедет:
 *   npm run seed -- --dry
 */
import { createClient } from '@sanity/client'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { categories, contacts, figures, team } from '../lib/content.ts'
import { staticAbout, staticHome, staticTeamPage, trustFacts, staticCareer, exampleVacancies } from '../lib/content.ts'
import { staticCookieTexts } from '../lib/consent.ts'

/* .env.local читаем сами: скрипт запускается вне Next. */
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

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId) {
  console.error('\n  Не заданий NEXT_PUBLIC_SANITY_PROJECT_ID в .env.local\n')
  process.exit(1)
}
const DRY = process.argv.includes('--dry')
/** --only=homePage,practice — записать лишь перечисленные типы */
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) ?? '')
  .slice(7)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/**
 * Документы, которые НЕЛЬЗЯ перезаписывать целиком.
 *
 * siteSettings хранит и то, что скрипт умеет (цифры, контакты), и то,
 * что заводят руками в студии, — ленту клиентов с логотипами и
 * галочками разрешения. createOrReplace снёс бы её молча: в
 * settingsDoc поля clients просто нет, а replace означает «документ
 * теперь выглядит РОВНО так». Первый же повторный запуск сида стёр бы
 * согласованные логотипы, и восстанавливать их пришлось бы по памяти.
 *
 * Поэтому синглтоны обновляются патчем: create-if-not-exists, а затем
 * set ровно тех полей, которые скрипт считает своими. Всё остальное в
 * документе остаётся нетронутым.
 */
const PATCH_ONLY = new Set(['siteSettings', 'homePage', 'aboutPage', 'teamPage'])

/**
 * Документы, которые сид создаёт ОДИН раз и больше не трогает.
 *
 * «Карʼєра» и вакансии засеваются заглушками, которые фирма потом
 * заменяет своим текстом. Перезапись при каждом `npm run seed` вернула
 * бы заглушки поверх настоящих вакансий. Поэтому — createIfNotExists:
 * документа нет — создаём, есть — не трогаем ни поля.
 * Вернуть заглушки заново: удалить документ в студии и запустить сид.
 */
const CREATE_ONLY = new Set(['careerPage', 'vacancy'])

/**
 * Поля настроек, которые сид заполняет, только если они пустые.
 * Адрес частями и подсказку «як знайти» фирма правит под себя — сид
 * не должен возвращать заглушку поверх её правки.
 */
const SETTINGS_IF_MISSING = ['street', 'unit', 'city', 'officeHint', 'mapQuery']

if (!token && !DRY) {
  console.error(
    '\n  Не заданий SANITY_API_WRITE_TOKEN.\n' +
      '  sanity.io/manage → ваш проєкт → API → Tokens → Add token → права Editor\n' +
      '  Подивитись, що саме поїде, без запису: npm run seed -- --dry\n',
  )
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2026-01-01', token, useCdn: false })

/* ── помощники локализации ── */
const L = (ua) => (ua == null ? undefined : { _type: 'localeString', ua })
const T = (ua) => (ua == null ? undefined : { _type: 'localeText', ua })
/** массив localeString с ключами — Sanity требует _key у элементов массива */
const LArr = (arr) =>
  Array.isArray(arr) && arr.length
    ? arr.map((v, i) => ({ _type: 'localeString', ua: v, _key: `i${i}` }))
    : undefined

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ\s-]/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)

const catId = (s) => `category-${s}`
const pracId = (s) => `practice-${s}`
const memberId = (s) => `member-${s}`

/** Транслит для slug'ов команды: имена кириллицей, slug нужен латиницей. */
const TR = {
  а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ye',ж:'zh',з:'z',и:'y',і:'i',ї:'yi',й:'j',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'c',ч:'ch',
  ш:'sh',щ:'shch',ь:'',ю:'yu',я:'ya',
  "'":'', '\u2019':'',
}
const translit = (s) =>
  s.toLowerCase().split('').map((c) => (c in TR ? TR[c] : /[a-z0-9]/.test(c) ? c : ' ')).join('')
    .trim().replace(/\s+/g, '-')

/* ═══════════════ КОМАНДА ═══════════════ */
const KIND = {
  'Керуючий партнер, адвокат': 'managing',
  'Приватний виконавець': 'executor',
  'Партнер, адвокат': 'partner',
  'Військовий юрист, адвокат': 'military',
}

const teamDocs = team.map((m, i) => {
  const slug = translit(m.name)
  return {
    _id: memberId(slug),
    _type: 'teamMember',
    name: L(m.name),
    role: L(m.role),
    kind: KIND[m.role] ?? 'advocate',
    order: (i + 1) * 10,
    highlight: Boolean(m.key),
    slug: { _type: 'slug', current: slug },
    practiceNote: L(m.practice),
  }
})

/* ═══════════════ КАТЕГОРИИ И ПРАКТИКИ ═══════════════ */
const categoryDocs = categories.map((c, i) => ({
  _id: catId(c.slug),
  _type: 'practiceCategory',
  title: L(c.title),
  excerpt: T(c.excerpt),
  icon: c.icon,
  order: (i + 1) * 10,
  slug: { _type: 'slug', current: c.slug },
}))

const practiceDocs = []
const noExcerpt = []

for (const c of categories) {
  c.practices.forEach((p, i) => {
    if (!p.excerpt) noExcerpt.push(p.title)

    const doc = {
      _id: pracId(p.slug),
      _type: 'practice',
      title: L(p.title),
      /* Иконку берём у категории: у направления своей нет, а поле
         в схеме есть — пусть будет осмысленное значение, а не пусто. */
      icon: c.icon,
      order: (i + 1) * 10,
      slug: { _type: 'slug', current: p.slug },
      category: { _type: 'reference', _ref: catId(c.slug) },
      legacyPaths: p.legacyPath ? [p.legacyPath] : undefined,
      /* «Показувати на головній» — первые пять направлений категории. */
      featured: i < 5,
    }

    if (p.excerpt) doc.excerpt = T(p.excerpt)

    if (p.bodyText?.length) {
      /* bodyText — обычные абзацы; в Sanity это PortableText. */
      doc.body = {
        _type: 'localeBlock',
        ua: p.bodyText.map((t, k) => ({
          _type: 'block',
          _key: `b${k}`,
          style: 'normal',
          markDefs: [],
          children: [{ _type: 'span', _key: `s${k}`, text: t, marks: [] }],
        })),
      }
    }

    if (p.includes?.length) doc.includes = LArr(p.includes)

    if (p.faq?.length) {
      doc.faq = p.faq.map((f, k) => ({
        _type: 'qa',
        _key: `q${k}`,
        q: L(f.q),
        a: T(f.a),
      }))
    }

    if (p.packages?.length) {
      doc.packages = p.packages.map((pk, k) => ({
        _type: 'package',
        _key: `p${k}`,
        name: L(pk.name),
        audience: LArr(pk.audience),
        includes: LArr(pk.includes),
        note: L(pk.note),
      }))
    }

    practiceDocs.push(doc)
  })
}

/* ═══════════════ НАСТРОЙКИ САЙТА ═══════════════ */
const settingsDoc = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  figures: figures.map((f, i) => ({
    _type: 'figure',
    _key: `f${i}`,
    value: f.value,
    suffix: f.suffix,
    unit: L(f.unit),
    label: L(f.label),
  })),
  /* Текст блока «Нам довіряють». Лента клиентов сюда НЕ попадает:
     её заводят руками в студии, вместе с галочками разрешений, и
     скрипту там делать нечего (см. PATCH_ONLY ниже — именно поэтому
     настройки обновляются патчем, а не заменой). */
  trustEyebrow: L('Нам довіряють'),
  trustHeading: L('Чому нам доручають справи'),
  trustText: T('Серед клієнтів «АКТИВ» — компанії й підприємці, які доручають нам ліквідації, судові спори та стягнення боргів. Логотипи показуємо лише з дозволу клієнта.'),
  trustFacts: trustFacts.map((f, i) => ({
    _type: 'fact',
    _key: `t${i}`,
    value: f.value,
    label: L(f.label),
    note: L(f.note),
  })),
  /* Баннер cookie: заголовок и текст. Ссылку на политику не сеем —
     страницы политики пока нет, а ссылка в никуда хуже, чем никакой. */
  cookieTitle: L(staticCookieTexts.title),
  cookieText: T(staticCookieTexts.text),
  phone: contacts.phone,
  email: contacts.email,
  address: L(contacts.address),
  street: L(contacts.office.street),
  unit: L(contacts.office.unit),
  city: L(contacts.office.city),
  /* Заглушка-подсказка: видно, где и как она стоит на картке офиса. */
  officeHint: L(contacts.officeHint),
  hours: L(contacts.hours),
  messengers: contacts.messengers.map((m, i) => ({
    _type: 'messenger',
    _key: `m${i}`,
    channel: m.label.toLowerCase(),
    href: m.href,
  })),
}

/* ═══════════════ ТЕКСТ ГЛАВНОЙ ═══════════════ */
/* Источник — staticHome из lib/sanity/content.ts, то есть ровно то, что
   сайт показывает без Sanity. После сида админка открывается уже
   заполненной текущим текстом страницы, и редактор правит его, а не
   набирает с нуля по скриншоту. */
const homeDoc = {
  _id: 'homePage',
  _type: 'homePage',
  heroEyebrow: L(staticHome.heroEyebrow),
  heroTitle: L(staticHome.heroTitle),
  heroTitleAccent: L(staticHome.heroTitleAccent),
  heroCtaPrimary: L(staticHome.heroCtaPrimary),
  heroCtaSecondary: L(staticHome.heroCtaSecondary),
  heroHeading: L(staticHome.heroHeading),
  heroHeadingAccent: L(staticHome.heroHeadingAccent),
  heroLede: T(staticHome.heroLede),
  teamText: T(staticHome.teamText),
  practicesText: T(staticHome.practicesText),
  credo: staticHome.credo.map((r, i) => ({
    _type: 'rule',
    _key: `r${i}`,
    title: L(r.title),
  })),
}

/* ═══════════════ «ПРО КОМПАНІЮ» ═══════════════ */
/* Источник — staticAbout, то есть ровно то, что страница показывает
   без Sanity. После сида админка открывается заполненной текущим
   текстом, и редактор правит его, а не набирает по скриншоту. */
const tenetDoc = (t, i, prefix) => ({
  _type: 'tenet',
  _key: `${prefix}${i}`,
  title: L(t.title),
  text: T(t.text),
  icon: t.icon,
})

const blockDoc = (b) => ({
  _type: 'tenetBlock',
  eyebrow: L(b.eyebrow),
  statement: T(b.statement),
  text: T(b.text),
})

const aboutDoc = {
  _id: 'aboutPage',
  _type: 'aboutPage',
  headEyebrow: L(staticAbout.headEyebrow),
  headTitle: L(staticAbout.headTitle),
  headTitleAccent: L(staticAbout.headTitleAccent),
  headLede: T(staticAbout.headLede),
  headFacts: staticAbout.headFacts.map((x, i) => ({
    _type: 'headFact',
    _key: `h${i}`,
    kicker: L(x.kicker),
    value: L(x.value),
    note: L(x.note),
  })),
  mission: blockDoc(staticAbout.mission),
  vision: blockDoc(staticAbout.vision),
  valuesEyebrow: L(staticAbout.valuesEyebrow),
  valuesTitle: L(staticAbout.valuesTitle),
  valuesLede: T(staticAbout.valuesLede),
  values: staticAbout.values.map((t, i) => tenetDoc(t, i, 'v')),
  principlesEyebrow: L(staticAbout.principlesEyebrow),
  principlesTitle: L(staticAbout.principlesTitle),
  principlesLede: T(staticAbout.principlesLede),
  principles: staticAbout.principles.map((t, i) => tenetDoc(t, i, 'p')),
  bridgeKicker: L(staticAbout.bridgeKicker),
  bridgeText: T(staticAbout.bridgeText),
  bridgeLink: L(staticAbout.bridgeLink),
  ctaTitle: L(staticAbout.ctaTitle),
  ctaText: T(staticAbout.ctaText),
  ctaPrimary: L(staticAbout.ctaPrimary),
  ctaSecondary: L(staticAbout.ctaSecondary),
}

/* ═══════════════ «КОМАНДА» ═══════════════ */
/* Обрамление страницы. Подстановки {n}, {name} и {role} уезжают в
   Sanity как есть — раскрывает их сайт по живым данным, и именно
   поэтому редактору их видно и можно переставить. */
const teamPageDoc = {
  _id: 'teamPage',
  _type: 'teamPage',
  headEyebrow: L(staticTeamPage.headEyebrow),
  headTitle: L(staticTeamPage.headTitle),
  headTitleAccent: L(staticTeamPage.headTitleAccent),
  headLede: T(staticTeamPage.headLede),
  executorKicker: L(staticTeamPage.executorKicker),
  executorTitle: L(staticTeamPage.executorTitle),
  executorText: T(staticTeamPage.executorText),
  peopleEyebrow: L(staticTeamPage.peopleEyebrow),
  peopleTitle: L(staticTeamPage.peopleTitle),
  peopleLede: T(staticTeamPage.peopleLede),
  noPhotoNote: T(staticTeamPage.noPhotoNote),
  ctaTitle: L(staticTeamPage.ctaTitle),
  ctaText: T(staticTeamPage.ctaText),
  ctaPrimary: L(staticTeamPage.ctaPrimary),
  ctaSecondary: L(staticTeamPage.ctaSecondary),
}

/* ═══════════════ КАРʼЄРА (заглушки) ═══════════════
   Текст страницы и вакансии-образцы — из lib/content.ts (staticCareer,
   exampleVacancies). Всё — заглушки: показывают, что где стоит, и ничего
   не утверждают от имени фирмы. Создаются один раз (CREATE_ONLY). */
const careerDoc = {
  _id: 'careerPage',
  _type: 'careerPage',
  headEyebrow: L(staticCareer.headEyebrow),
  headTitle: L(staticCareer.headTitle),
  headTitleAccent: L(staticCareer.headTitleAccent),
  headLede: T(staticCareer.headLede),
  benefitsTitle: L(staticCareer.benefitsTitle),
  benefits: staticCareer.benefits.map((b, i) => ({
    _type: 'benefit',
    _key: `b${i}`,
    icon: b.icon,
    title: L(b.title),
    text: T(b.text),
  })),
  steps: staticCareer.steps.map((st, i) => ({
    _type: 'step',
    _key: `s${i}`,
    title: L(st.title),
    text: T(st.text),
    duration: L(st.duration),
  })),
  faq: staticCareer.faq.map((f, i) => ({ _type: 'qa', _key: `q${i}`, q: L(f.q), a: T(f.a) })),
  cvTitle: L(staticCareer.cvTitle),
  cvText: T(staticCareer.cvText),
}

const vacancyDocs = exampleVacancies.map((v, i) => ({
  _id: `vacancy-${v.slug}`,
  _type: 'vacancy',
  title: L(v.title),
  active: true,
  example: true,
  department: v.department,
  experience: L(v.experience),
  format: v.format,
  employment: v.employment,
  summary: T(v.summary),
  weSeek: LArr(v.weSeek),
  duties: LArr(v.duties),
  weOffer: LArr(v.weOffer),
  order: (i + 1) * 10,
}))

/* ═══════════════ ЗАПИСЬ ═══════════════ */
const docs = [...teamDocs, ...categoryDocs, ...practiceDocs, settingsDoc, homeDoc, aboutDoc, teamPageDoc, careerDoc, ...vacancyDocs]

/** Пустые поля выкидываем: undefined в Sanity лучше не отправлять. */
const clean = (v) => {
  if (Array.isArray(v)) return v.map(clean).filter((x) => x !== undefined)
  if (v && typeof v === 'object') {
    const out = {}
    for (const [k, val] of Object.entries(v)) {
      const c = clean(val)
      if (c !== undefined) out[k] = c
    }
    return out
  }
  return v
}

let ready = docs.map(clean)

if (ONLY.length) {
  const before = ready.length
  ready = ready.filter((d) => ONLY.includes(d._type))
  console.log(`\n  --only=${ONLY.join(',')}: ${ready.length} з ${before} документів.`)
  if (!ready.length) {
    console.log('  Нічого не підходить під фільтр. Типи: ' + [...new Set(docs.map((d) => d._type))].join(', ') + '\n')
    process.exit(1)
  }
}

if (DRY) {
  const byType = ready.reduce((a, d) => ({ ...a, [d._type]: (a[d._type] ?? 0) + 1 }), {})
  console.log('\n  Сухий прогін — нічого не записано.\n')
  console.log('  Документів за типами:')
  for (const [t, n] of Object.entries(byType)) console.log(`    ${t.padEnd(18)} ${n}`)
  const sample = ready.find((d) => d._type === 'practice' && d.packages)
  if (sample) {
    console.log('\n  Приклад практики з пакетами:')
    console.log(JSON.stringify(sample, null, 2).split('\n').slice(0, 30).join('\n'))
  }
  console.log('')
  process.exit(0)
}

const tx = ready.reduce((t, doc) => {
  if (CREATE_ONLY.has(doc._type)) return t.createIfNotExists(doc)
  if (!PATCH_ONLY.has(doc._type)) return t.createOrReplace(doc)
  /* Синглтон: создаём пустой, если его нет, и дальше только
     проставляем свои поля. Чужие — лента клиентов, заголовки блока
     довіри — остаются как есть. */
  const { _id, _type, ...fields } = doc
  const ifMissing = {}
  if (_type === 'siteSettings') {
    for (const k of SETTINGS_IF_MISSING) {
      if (k in fields) {
        ifMissing[k] = fields[k]
        delete fields[k]
      }
    }
  }
  return t
    .createIfNotExists({ _id, _type })
    .patch(_id, (pt) => (Object.keys(ifMissing).length ? pt.setIfMissing(ifMissing) : pt).set(fields))
}, client.transaction())

try {
  await tx.commit()
  console.log(
    `\n  Записано в ${projectId}/${dataset}:\n` +
      `    ${teamDocs.length} фахівців\n` +
      `    ${categoryDocs.length} категорій\n` +
      `    ${practiceDocs.length} практик\n` +
      `    1 документ налаштувань (цифри, «Нам довіряють», контакти; стрічка клієнтів не торкнута)\n` +
      `    1 документ головної (перший екран, кредо, шлях справи, цитата)\n` +
      `    1 документ «Про компанію» (місія, візія, цінності, принципи)\n` +
      `    1 документ «Команда» (заголовки, виконавець, заклик)\n` +
      `    «Карʼєра» і ${vacancyDocs.length} вакансії-заглушки — лише якщо їх ще не було\n`,
  )
  if (noExcerpt.length) {
    console.log(`  Без короткого опису — ${noExcerpt.length} практик. Вони опублікуються,`)
    console.log('  але на картці й у meta description опису не буде. Заповнити в студії:')
    for (const t of noExcerpt.slice(0, 6)) console.log(`    · ${t}`)
    if (noExcerpt.length > 6) console.log(`    · …і ще ${noExcerpt.length - 6}`)
    console.log('')
  }
  console.log('  Відповідальні адвокати НЕ проставлені — навмисно: підставити прізвище')
  console.log('  навмання гірше, ніж лишити поле порожнім. Студія про це нагадає.')
  console.log('\n  Перевірити: npm run sanity:doctor\n')
} catch (err) {
  const msg = err?.message ?? String(err)
  console.error(`\n  Не вдалося записати: ${msg}\n`)
  if (/insufficient permissions|Unauthorized|401|403/i.test(msg))
    console.error('  Схоже, у токена немає прав Editor. Створіть новий: API → Tokens → Editor.\n')
  process.exit(1)
}
