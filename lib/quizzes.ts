import type { QuizConfig } from './quote'

/**
 * Конфиги квизов — временный fallback.
 *
 * На этапе 6 они приезжают из Sanity (документ quiz), форма совпадает
 * один в один с QuizConfig, поэтому подключение клиента не тронет ни
 * компонент квиза, ни движок расчёта.
 *
 * TODO(client): коэффициенты — моя оценка из логики процедуры, а не
 * цифры фирмы. Требуют прогона и подтверждения.
 */

export const liquidationQuiz: QuizConfig = {
  id: 'likvidatsiya-bankrutstvo',
  practice: 'Ліквідація та банкрутство',
  spread: { low: 0.85, high: 1.3 },
  roundTo: 1000,
  floor: 8000,
  steps: [
    {
      id: 'goal',
      options: [
        { id: 'alt', base: 10000, reason: 'Альтернативна ліквідація: викуп, зміна керівника і засновників' },
        { id: 'classic', base: 18000, reason: 'Класична ліквідація — супровід перевірки ДПС' },
        { id: 'bnkr-legal', base: 25000, reason: 'Процедура банкрутства юридичної особи' },
        { id: 'bnkr-person', base: 20000, reason: 'Банкрутство фізичної особи' },
      ],
    },
    {
      id: 'debts',
      options: [
        { id: 'none', factor: 1, reason: 'Без непогашених зобовʼязань' },
        { id: 'to500', factor: 1.25, reason: 'Боргів до 500 тис ₴' },
        { id: 'to3m', factor: 1.6, reason: 'Боргів 500 тис – 3 млн ₴' },
        { id: 'over3m', factor: 2.1, reason: 'Боргів понад 3 млн ₴ — кредиторів кілька, засідань більше' },
      ],
    },
    {
      id: 'assets',
      options: [
        { id: 'none', add: 0, reason: 'Активів на балансі немає' },
        { id: 'movable', add: 6000, reason: 'Транспорт і обладнання — оцінка та реалізація' },
        { id: 'realty', add: 14000, reason: 'Нерухомість на балансі' },
        { id: 'pledged', add: 25000, reason: 'Майно під заставою — окремий спір із банком' },
      ],
    },
    {
      id: 'deadline',
      options: [
        { id: 'flex', factor: 1, reason: 'Строк не критичний' },
        { id: 'q3', factor: 1.2, reason: 'Результат до 3 місяців' },
        { id: 'asap', factor: 1.45, reason: 'Максимально швидко — паралельні дії, більше ресурсу' },
      ],
    },
  ],
}

export const courtQuiz: QuizConfig = {
  id: 'sudova-praktyka',
  practice: 'Судова практика',
  spread: { low: 0.85, high: 1.35 },
  roundTo: 500,
  floor: 2500,
  steps: [
    {
      id: 'dispute',
      options: [
        { id: 'commercial', base: 2500, reason: 'Господарський спір' },
        { id: 'civil', base: 2500, reason: 'Цивільний спір' },
        { id: 'admin', base: 3500, reason: 'Адміністративний чи податковий спір — сторона держава' },
        { id: 'family', base: 2500, reason: 'Сімейний спір' },
        { id: 'labour', base: 2500, reason: 'Трудовий спір' },
      ],
    },
    {
      id: 'amount',
      options: [
        { id: 'small', factor: 1, reason: 'Немайновий спір або вимоги до 100 тис ₴' },
        { id: 'to1m', factor: 1.8, reason: 'Вимоги 100 тис – 1 млн ₴' },
        { id: 'to10m', factor: 3.2, reason: 'Вимоги 1–10 млн ₴' },
        { id: 'over10m', factor: 5, reason: 'Вимоги понад 10 млн ₴' },
      ],
    },
    {
      id: 'stage',
      options: [
        { id: 'not-filed', add: 2500, reason: 'Позов не поданий — складання позовної заяви' },
        { id: 'first', factor: 1.15, reason: 'Справа в першій інстанції' },
        { id: 'appeal', factor: 1.4, reason: 'Апеляція чи касація — нова інстанція, новий обсяг' },
        {
          id: 'judgment',
          switchToPercent: { percent: 15, basisId: 'recovery' },
          reason: 'Рішення є — працює приватний виконавець, оплата від суми стягнення',
        },
      ],
    },
    {
      id: 'instances',
      options: [
        { id: 'one', factor: 1, reason: 'Одна інстанція' },
        { id: 'two', factor: 1.7, reason: 'Перша інстанція плюс апеляція' },
        { id: 'all', factor: 2.3, reason: 'Усі інстанції до касації' },
      ],
    },
  ],
}

/** Тексты вопросов и вариантов. В Sanity это localeString внутри quiz.steps. */
export interface QuizCopy {
  heading: string
  disclaimer: string
  steps: Record<string, { q: string; hint?: string; options: Record<string, string> }>
}

export const quizCopy: Record<string, QuizCopy> = {
  'likvidatsiya-bankrutstvo': {
    heading: 'Чотири питання — і вилка по вашій ситуації',
    disclaimer:
      'Вилка — попередня оцінка, а не оферта. Точну суму називаємо після ознайомлення з документами, до підписання договору. Судовий збір і послуги оцінювача сплачуються окремо.',
    steps: {
      goal: {
        q: 'Що потрібно зробити з підприємством?',
        hint: 'Від цього залежить сама процедура, а не лише її ціна.',
        options: {
          alt: 'Закрити швидко — зміна директора і власників',
          classic: 'Класична ліквідація з податковою перевіркою',
          'bnkr-legal': 'Банкрутство юридичної особи',
          'bnkr-person': 'Банкрутство фізичної особи або ФОП',
        },
      },
      debts: {
        q: 'Які непогашені зобовʼязання перед кредиторами і ДПС?',
        hint: 'Кількість кредиторів визначає кількість засідань.',
        options: { none: 'Немає', to500: 'До 500 тис ₴', to3m: 'Від 500 тис до 3 млн ₴', over3m: 'Понад 3 млн ₴' },
      },
      assets: {
        q: 'Що є на балансі?',
        options: { none: 'Нічого', movable: 'Транспорт, обладнання', realty: 'Нерухомість', pledged: 'Нерухомість під заставою банку' },
      },
      deadline: {
        q: 'За який строк потрібен результат?',
        options: { flex: 'Не критично, 6 місяців і більше', q3: 'До 3 місяців', asap: 'Максимально швидко' },
      },
    },
  },
  'sudova-praktyka': {
    heading: 'Чотири питання — і оцінка вартості спору',
    disclaimer:
      'Вилка покриває гонорар за представництво. Судовий збір, експертизи та витрати на виконання — окремо. Точну суму фіксуємо в договорі до початку роботи.',
    steps: {
      dispute: {
        q: 'Яка категорія спору?',
        options: { commercial: 'Господарський', civil: 'Цивільний', admin: 'Адміністративний або податковий', family: 'Сімейний', labour: 'Трудовий' },
      },
      amount: {
        q: 'Яка сума вимог?',
        hint: 'Від неї залежить і обсяг роботи, і судовий збір.',
        options: { small: 'Немайновий спір або до 100 тис ₴', to1m: 'Від 100 тис до 1 млн ₴', to10m: 'Від 1 до 10 млн ₴', over10m: 'Понад 10 млн ₴' },
      },
      stage: {
        q: 'На якій стадії справа?',
        options: {
          'not-filed': 'Ще не звертались до суду',
          first: 'Триває перша інстанція',
          appeal: 'Апеляція або касація',
          judgment: 'Рішення є, потрібне виконання',
        },
      },
      instances: {
        q: 'На скільки інстанцій розраховувати?',
        options: { one: 'Одна інстанція', two: 'Готуємось до апеляції одразу', all: 'Усі інстанції до касації' },
      },
    },
  },
}

export const quizzes = { liquidation: liquidationQuiz, court: courtQuiz }

/**
 * Калькулятор в том виде, в каком его потребляет компонент: веса,
 * тексты и подпись на вкладке — одним объектом.
 *
 * Из Sanity приезжает ровно такая же форма, поэтому компонент не знает,
 * откуда данные, и переключение источника не стоит ни строчки в UI.
 */
export interface QuizSet {
  key: string
  config: QuizConfig
  copy: QuizCopy
  tab: { title: string; note: string }
}

/**
 * Подпись на вкладке выводится из самих весов, а не пишется руками:
 * если хоть один вариант переводит расчёт в процент, у калькулятора
 * есть ветка гонорара успеха — и об этом честно сказано на вкладке.
 */
export function tabNote(config: QuizConfig): string {
  const hasPercent = config.steps.some((s) => s.options.some((o) => o.switchToPercent))
  return hasPercent ? 'вилка або гонорар успіху' : 'вилка в гривнях'
}

export const staticQuizSets: QuizSet[] = Object.entries(quizzes).map(([key, config]) => ({
  key,
  config,
  copy: quizCopy[config.id]!,
  tab: { title: config.practice, note: tabNote(config) },
}))

/* ═══════════════ СБОРКА ИЗ SANITY ═══════════════
   Преобразование чистое: на входе плоский ответ GROQ, на выходе
   QuizSet. Живёт здесь, а не рядом с запросами, потому что ничего
   не знает ни про сеть, ни про Sanity — и потому что так его может
   звать проверка `npm run check:quiz`, которая сверяет расчёт
   до и после круга через датасет. */

export interface RawQuiz {
  id?: string
  practice?: string
  heading?: string
  disclaimer?: string
  spreadLow?: number
  spreadHigh?: number
  roundTo?: number
  floor?: number
  steps?: {
    id?: string
    q?: string
    hint?: string
    options?: {
      id?: string
      label?: string
      base?: number
      factor?: number
      add?: number
      successFeePercent?: number
      reason?: string
    }[]
  }[]
}

export function toQuizSet(raw: RawQuiz): QuizSet | null {
  if (!raw?.id || !raw.steps?.length) return null

  const steps: QuizConfig['steps'] = []
  const copySteps: QuizCopy['steps'] = {}

  for (const st of raw.steps) {
    if (!st?.id || !st.options?.length) continue
    const options: QuizConfig['steps'][number]['options'] = []
    const copyOptions: Record<string, string> = {}

    for (const o of st.options) {
      if (!o?.id) continue
      options.push({
        id: o.id,
        ...(typeof o.base === 'number' ? { base: o.base } : {}),
        ...(typeof o.factor === 'number' ? { factor: o.factor } : {}),
        ...(typeof o.add === 'number' ? { add: o.add } : {}),
        ...(typeof o.successFeePercent === 'number'
          ? { switchToPercent: { percent: o.successFeePercent, basisId: 'recovery' } }
          : {}),
        ...(o.reason ? { reason: o.reason } : {}),
      })
      copyOptions[o.id] = o.label ?? o.id
    }

    if (options.length === 0) continue
    steps.push({ id: st.id, options })
    copySteps[st.id] = { q: st.q ?? st.id, ...(st.hint ? { hint: st.hint } : {}), options: copyOptions }
  }

  if (steps.length === 0) return null

  const config: QuizConfig = {
    id: raw.id,
    practice: raw.practice ?? raw.id,
    steps,
    /* Значения по умолчанию совпадают с initialValue в схеме: документ,
       заведённый вручную и не тронутый в этих полях, считается так же,
       как засеянный скриптом. */
    spread: { low: raw.spreadLow ?? 0.85, high: raw.spreadHigh ?? 1.3 },
    roundTo: raw.roundTo ?? 1000,
    floor: raw.floor ?? 0,
  }

  return {
    key: raw.id,
    config,
    copy: {
      heading: raw.heading ?? config.practice,
      disclaimer: raw.disclaimer ?? '',
      steps: copySteps,
    },
    tab: { title: config.practice, note: tabNote(config) },
  }
}
