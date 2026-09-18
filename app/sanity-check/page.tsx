import {
  apiVersion,
  dataset,
  isSanityConfigured,
  projectId,
  projectIdLooksValid,
  sanityClient,
  sanityLiveClient,
  sanityProbeClient,
} from '@/lib/sanity/client'
import { COUNTS_QUERY, DRAFTS_QUERY, FRESHNESS_QUERY, PING_QUERY } from '@/lib/sanity/queries'
import { getCategories } from '@/lib/sanity/content'

/**
 * /sanity-check — диагностика подключения.
 *
 * Смысл страницы в том, чтобы РАЗЛИЧАТЬ причины, а не сообщать «не
 * работает». «Сайт не берёт контент из Sanity» бывает шести видов,
 * и лечатся они по-разному:
 *
 *   1. не заполнен projectId
 *   2. опечатка в projectId или в имени датасета
 *   3. датасет приватный, а read-токена нет   ← самая частая
 *   4. датасет пустой
 *   5. документы есть, но не опубликованы     ← вторая по частоте
 *   6. контент уже в Sanity, но страница собрана раньше (SSG)
 *
 * С сервера Sanity причины 2 и 3 выглядят одинаково: на несуществующий
 * проект он отвечает 401, а не 404. Различить их можно только повторив
 * запрос с токеном — если с токеном датасет отвечает, значит он есть
 * и он приватный. Ровно это страница и делает: анонимный запрос,
 * а при отказе — контрольный с write-токеном.
 *
 * Страница всегда динамическая: смысл в том, чтобы дёрнуть API сейчас.
 */
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Перевірка Sanity', robots: { index: false, follow: false } }

type Status = 'ok' | 'warn' | 'fail' | 'skip'

interface Check {
  name: string
  status: Status
  detail: string
  fix?: string
}

const DOT: Record<Status, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  fail: 'bg-accent',
  skip: 'bg-slate-2',
}

const WORD: Record<Status, string> = { ok: 'ok', warn: 'увага', fail: 'помилка', skip: 'пропущено' }

interface Counts {
  practiceCategory: number
  practice: number
  quiz: number
  withPrice: number
  withoutCategory: number
}

interface Drafts {
  published: number
  drafts: number
  byType: Record<string, number>
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e))
const httpCode = (m: string) => /\b(401|403|404|429|5\d\d)\b/.exec(m)?.[1]

export default async function SanityCheckPage() {
  const checks: Check[] = []
  let counts: Counts | null = null
  let drafts: Drafts | null = null

  const readToken = (process.env.SANITY_API_READ_TOKEN ?? '').trim()
  const writeToken = (process.env.SANITY_API_WRITE_TOKEN ?? '').trim()

  /* ── 1. переменные окружения ── */
  if (!projectId) {
    checks.push({
      name: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
      status: 'fail',
      detail: 'не заданий',
      fix: 'Створити проєкт на sanity.io/manage, скопіювати Project ID і дописати в .env.local. Після правки .env.local сервер треба перезапустити — Next читає його один раз при старті.',
    })
  } else if (!projectIdLooksValid) {
    checks.push({
      name: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
      status: 'fail',
      detail: `«${projectId}» не схоже на id`,
      fix: 'Sanity видає id з 8+ малих латинських літер і цифр, без дефісів і пробілів. Перевірте, чи не скопіювалась назва проєкту замість id.',
    })
  } else {
    checks.push({ name: 'NEXT_PUBLIC_SANITY_PROJECT_ID', status: 'ok', detail: projectId })
  }

  checks.push({ name: 'NEXT_PUBLIC_SANITY_DATASET', status: 'ok', detail: dataset })
  checks.push({ name: 'NEXT_PUBLIC_SANITY_API_VERSION', status: 'ok', detail: apiVersion })
  checks.push({
    name: 'SANITY_API_READ_TOKEN',
    status: readToken ? 'ok' : 'skip',
    detail: readToken
      ? `заданий, ${readToken.length} символів`
      : 'порожній — цього достатньо лише для публічного датасету',
  })

  /* ── 2. живой запрос: анонимно, затем контрольный с токеном ── */
  let access: 'public' | 'private' | 'missing' | 'unknown' = 'unknown'
  /** клиент, которым удалось прочитать датасет — для дальнейших подсчётов */
  let reader: ReturnType<typeof sanityClient> = null

  if (!isSanityConfigured) {
    checks.push({ name: 'Запит до API', status: 'skip', detail: 'нема чого питати без projectId' })
  } else {
    const client = sanityClient()!
    const t0 = Date.now()
    try {
      const total = await client.fetch<number>(PING_QUERY)
      access = 'public'
      reader = client
      checks.push({
        name: 'Запит до API (як його бачить сайт)',
        status: 'ok',
        detail: `відповів за ${Date.now() - t0} мс, опублікованих документів: ${total}`,
      })
    } catch (err) {
      const msg = errText(err)
      const code = httpCode(msg)

      if (code === '401' || code === '403') {
        /* Контрольный запрос: тем же адресом, но с write-токеном.
           Ответил — значит проект и датасет существуют, и дело
           исключительно в приватности. Не ответил — адреса нет. */
        const probe = sanityProbeClient()
        if (probe) {
          try {
            await probe.fetch<number>(PING_QUERY)
            access = 'private'
            reader = probe
            checks.push({
              name: 'Запит до API (як його бачить сайт)',
              status: 'fail',
              detail: 'відмовлено в доступі — 401',
              fix:
                `Причину встановлено точно: датасет «${dataset}» існує, але він ПРИВАТНИЙ. ` +
                'З тим самим id і токеном він відповідає, без токена — ні. ' +
                'Саме тому сайт показує статику: він ходить без токена, бо SANITY_API_READ_TOKEN порожній. ' +
                'Два способи полагодити, будь-який на вибір. ' +
                '(1) Зробити датасет публічним: sanity.io/manage → ваш проєкт → Datasets → production → Visibility → Public. ' +
                'Для сайту юридичної фірми це нормально: у датасеті лише те, що й так публікується на сторінках. ' +
                '(2) Видати read-токен: API → Tokens → Add token → права Viewer, і вставити його в .env.local ' +
                'як SANITY_API_READ_TOKEN. Після правки .env.local перезапустити сервер.',
            })
          } catch (probeErr) {
            access = 'missing'
            checks.push({
              name: 'Запит до API (як його бачить сайт)',
              status: 'fail',
              detail: `відмовлено і без токена, і з токеном: ${errText(probeErr).slice(0, 140)}`,
              fix:
                `Проєкту «${projectId}» або датасету «${dataset}» не існує — Sanity на неіснуючу адресу ` +
                'відповідає 401, а не 404. Звірте Project ID на sanity.io/manage і подивіться там же ' +
                'точну назву датасету: у нових проєктах вона не завжди production. ' +
                'Друга можлива причина — write-токен видано для іншого проєкту.',
            })
          }
        } else {
          checks.push({
            name: 'Запит до API (як його бачить сайт)',
            status: 'fail',
            detail: 'відмовлено в доступі — 401',
            fix:
              'Дві причини, і без токена вони не розрізняються: або датасет приватний, або проєкту/датасету ' +
              'з такою назвою немає (Sanity на неіснуючу адресу відповідає 401, а не 404). ' +
              'Щоб ця сторінка сказала точно, додайте в .env.local SANITY_API_WRITE_TOKEN або ' +
              'SANITY_API_READ_TOKEN і перезапустіть сервер.',
          })
        }
      } else if (/ENOTFOUND|ETIMEDOUT|fetch failed|ECONNREFUSED/i.test(msg)) {
        checks.push({
          name: 'Запит до API (як його бачить сайт)',
          status: 'fail',
          detail: msg.slice(0, 160),
          fix: 'Немає мережі до api.sanity.io — перевірте інтернет, VPN, антивірус або корпоративний проксі.',
        })
      } else {
        checks.push({
          name: 'Запит до API (як його бачить сайт)',
          status: 'fail',
          detail: msg.slice(0, 200),
          fix: `Перевірте, чи існує проєкт «${projectId}» і датасет «${dataset}»: sanity.io/manage → Datasets.`,
        })
      }
    }
  }

  /* ── 3. что лежит в датасете ── */
  if (reader) {
    try {
      drafts = await reader.fetch<Drafts>(DRAFTS_QUERY)
      counts = await reader.fetch<Counts>(COUNTS_QUERY)

      if (drafts.published === 0 && drafts.drafts > 0) {
        checks.push({
          name: 'Опубліковано',
          status: 'fail',
          detail: `0 опублікованих, ${drafts.drafts} чернеток`,
          fix:
            'Причину встановлено точно: документи в студії створені, але жоден не опублікований. ' +
            'Сайт ходить у Sanity з perspective «published» і чернеток не бачить взагалі — для нього ' +
            'їх не існує. Відкрийте кожен документ у студії і натисніть Publish (Ctrl+Alt+P). ' +
            'Кнопка внизу праворуч; поки вона активна — документ у чернетках.',
        })
      } else if (drafts.published === 0) {
        checks.push({
          name: 'Контент',
          status: 'warn',
          detail: 'датасет порожній',
          fix: 'Запустіть `npm run seed` — скрипт створить категорії, практики й калькулятори з lib/content.ts. Для запису потрібен SANITY_API_WRITE_TOKEN з правами Editor.',
        })
      } else {
        checks.push({
          name: 'Опубліковано',
          status: drafts.drafts > 0 ? 'warn' : 'ok',
          detail:
            `${drafts.published} опублікованих` +
            (drafts.drafts > 0 ? `, ще ${drafts.drafts} лежать у чернетках і на сайт не потрапляють` : ''),
          fix:
            drafts.drafts > 0
              ? 'Чернетки видно тільки в студії. Якщо якісь зміни мали зʼявитися на сайті — натисніть у них Publish.'
              : undefined,
        })
      }

      if (counts && counts.withoutCategory > 0) {
        checks.push({
          name: 'Практики без категорії',
          status: 'warn',
          detail: `${counts.withoutCategory} шт.`,
          fix: 'Такі практики не потраплять ні в меню, ні на головну — рівно те, що сталося з 17 сторінками старого сайта. Привʼяжіть категорію в студії.',
        })
      }
    } catch (err) {
      checks.push({ name: 'Вміст датасету', status: 'fail', detail: errText(err).slice(0, 200) })
    }
  }

  /* ── 4. что реально показывает сайт ── */
  const cats = await getCategories('ua')
  const live = cats.source === 'sanity'
  checks.push({
    name: 'Джерело контенту сайту',
    status: live ? 'ok' : 'warn',
    detail: live
      ? `Sanity — ${cats.data.length} категорій`
      : `статика lib/content.ts — ${cats.data.length} категорій`,
    fix: live
      ? undefined
      : access === 'private'
        ? 'Наслідок приватного датасету вище. Відкрийте доступ — і джерело перемкнеться саме, без правок коду.'
        : 'Поки Sanity не віддає контент, сайт працює на статиці — це нормальний стан, а не поломка. Щойно в датасеті зʼявиться хоч одна опублікована категорія, джерело перемкнеться саме.',
  })

  /* ── 5. отставание кеша ──
     Самая частая жалоба после «не подключается» — «подключилось, но
     правки не видно». Причина всегда в кеше, и здесь она измеряется:
     один запрос идёт через CDN (как ходит сайт), второй в обход.
     Разошлись — значит сайт показывает снимок, а не датасет. */
  if (isSanityConfigured && access !== 'missing') {
    try {
      const [viaCdn, live] = await Promise.all([
        sanityClient()!.fetch<string | null>(FRESHNESS_QUERY),
        sanityLiveClient()!.fetch<string | null>(FRESHNESS_QUERY),
      ])
      const lagMs = viaCdn && live ? new Date(live).getTime() - new Date(viaCdn).getTime() : 0
      const fmt = (v: string | null) => (v ? new Date(v).toLocaleString('uk-UA') : '—')

      checks.push({
        name: 'Свіжість даних',
        status: lagMs > 1000 ? 'warn' : 'ok',
        detail:
          lagMs > 1000
            ? `сайт бачить датасет станом на ${fmt(viaCdn)}, у студії вже ${fmt(live)} — відставання ${Math.round(lagMs / 1000)} с`
            : `сайт бачить датасет станом на ${fmt(live)} — це поточний стан`,
        fix:
          lagMs > 1000
            ? 'Відстає CDN Sanity: він тримає відповідь близько хвилини. Це нормально для продакшену і гаситься вебхуком (нижче). У dev-режимі CDN вимкнено взагалі.'
            : undefined,
      })
    } catch {
      /* свежесть — приятный бонус, её отказ не должен ломать диагностику */
    }
  }

  /* ── 6. вебхук ревалидации ── */
  const hookSecret = (process.env.SANITY_REVALIDATE_SECRET ?? '').trim()
  checks.push({
    name: 'Вебхук ревалідації',
    status: hookSecret ? 'ok' : 'warn',
    detail: hookSecret ? 'секрет заданий, /api/revalidate готовий' : 'не налаштований',
    fix: hookSecret
      ? 'Залишилось створити сам вебхук: sanity.io/manage → API → Webhooks → URL https://ВАШ-ДОМЕН/api/revalidate, метод POST, заголовок x-revalidate-secret із тим самим значенням.'
      : 'Без нього на продакшені правка доїжджає до сторінки лише через 5 хвилин (страхувальний revalidate) або взагалі до наступної збірки. Задайте SANITY_REVALIDATE_SECRET у .env.local — далі інструкція у файлі app/api/revalidate/route.ts.',
  })

  /* ── 7. режим запуска ──
     Главная и страницы практик собираются заранее (SSG). В продакшен-
     сборке контент вмораживается в HTML на момент `npm run build`,
     и наполнение Sanity ПОСЛЕ сборки на странице не появится, пока
     не пересоберёшь. В dev такой проблемы нет. */
  const isDev = process.env.NODE_ENV !== 'production'
  checks.push({
    name: 'Режим запуску',
    status: isDev ? 'ok' : 'warn',
    detail: isDev
      ? 'dev — CDN і кеш fetch вимкнено, правка в студії видна одразу на F5'
      : 'production build — CDN і кеш увімкнено',
    fix: isDev
      ? undefined
      : 'Головна і сторінки практик збираються заздалегідь, тому контент, доданий у Sanity ПІСЛЯ `npm run build`, сам у них не зʼявиться. Правильне рішення — вебхук вище: він гасить кеш у момент публікації. Без нього лишається страхувальний revalidate 300 с або пересборка.',
  })

  const bad = checks.filter((c) => c.status === 'fail').length
  const warn = checks.filter((c) => c.status === 'warn').length

  return (
    <main className="mx-auto max-w-[760px] px-[var(--gut)] py-[clamp(48px,7vw,88px)]">
      <p className="eyebrow">Діагностика</p>
      <h1 className="text-[clamp(28px,5vw,42px)] leading-[1.06]">Перевірка підключення до Sanity</h1>
      <p className="lede mt-5 text-slate">
        {bad > 0
          ? `Знайдено помилок: ${bad}. Нижче — що саме і як полагодити.`
          : warn > 0
            ? `Підключення працює, є ${warn} зауваження.`
            : 'Підключення працює, сайт читає контент із Sanity.'}
      </p>

      <ul className="mt-9 list-none border-t border-hair p-0">
        {checks.map((c) => (
          <li
            key={c.name + c.detail}
            className="grid grid-cols-[10px_1fr] gap-x-3.5 gap-y-2 border-b border-hair-soft py-4"
          >
            <span className={`mt-[9px] size-2.5 rounded-full ${DOT[c.status]}`} aria-hidden="true" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-[12.5px] text-ink">{c.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-2">
                  {WORD[c.status]}
                </span>
              </div>
              <p className="m-0 mt-1 break-words text-[14.5px] text-slate">{c.detail}</p>
              {c.fix && (
                <p className="m-0 mt-2.5 border-l-2 border-accent pl-3 text-[13.5px] leading-relaxed text-slate">
                  {c.fix}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {(drafts || counts) && (
        <div className="mt-8 rounded-xl bg-paper-2 p-5">
          <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.12em] text-slate-2">
            Опубліковані документи за типами
          </p>
          <div className="mt-3 grid gap-x-6 gap-y-1.5 font-mono text-[13px] text-ink sm:grid-cols-2">
            {Object.entries({ ...(drafts?.byType ?? {}), ...(counts ?? {}) }).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-hair-soft py-1">
                <span className="text-slate">{k}</span>
                <span className="tabular-nums">{String(v)}</span>
              </div>
            ))}
          </div>
          {drafts && drafts.drafts > 0 && (
            <p className="m-0 mt-3 text-[13px] text-slate-2">
              Плюс {drafts.drafts} у чернетках — сайт їх не бачить.
            </p>
          )}
        </div>
      )}

      <p className="mt-8 text-[13px] leading-relaxed text-slate-2">
        Сторінка закрита від індексації і не має посилань із сайту. Перед здачею її можна видалити —
        файл <code className="font-mono text-ink">app/sanity-check/page.tsx</code>.
      </p>
    </main>
  )
}
