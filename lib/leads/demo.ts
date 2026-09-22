import { staticQuizSets } from '@/lib/quizzes'
import { buildLeadQuote } from './quote'
import type { ConsultFormat, Lead, LeadKind, LeadStatus } from './types'

/**
 * Демо-заявки для CRM, пока не подключено хранилище.
 *
 * Имена, телефоны и истории выдуманы. Телефоны из диапазона
 * +380 50 000 00 xx — такого номера не существует, и позвонить
 * случайно нельзя. Даты считаются от «сейчас», поэтому воронка всегда
 * выглядит живой: сегодняшние, вчерашние, недельной давности.
 */

const H = 3_600_000
const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * H).toISOString()

interface Seed {
  id: string
  kind: LeadKind
  h: number
  status: LeadStatus
  format?: ConsultFormat
  packageName?: string
  convertedTo?: string
  convertedFrom?: string
  name: string
  email?: string
  message?: string
  practiceKey?: string
  practiceTitle: string
  categoryTitle?: string
  quiz?: [string, Record<string, string>]
  src: Lead['source']
  owner?: string
  notes?: [number, string, string][]
  steps?: [number, string][]
}

const SEEDS: Seed[] = [
  {
    h: 0.4, status: 'new', id: 'demo-01', kind: 'order', packageName: 'Резидент', name: 'Олена Коваль', email: 'olena.demo@example.com',
    message: 'ТОВ на спрощеній системі, діяльність не ведемо з 2023 року. Хочемо закрити якнайшвидше.',
    practiceKey: 'alternative-liquidation', practiceTitle: 'Альтернативна ліквідація — зміна директора і власників', categoryTitle: 'Ліквідація та банкрутство',
    quiz: ['likvidatsiya-bankrutstvo', { goal: 'alt', debts: 'none', assets: 'none', deadline: 'asap' }],
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/likvidatsiya-bankrutstvo/alternative-liquidation', referrer: 'www.google.com' },
  },
  {
    h: 1.2, status: 'new', id: 'demo-02', kind: 'consultation', format: 'phone', name: 'Андрій', practiceTitle: 'Ще не знаю',
    message: 'Прийшла повістка з ТЦК, є відстрочка по догляду. Чи законно?',
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/vijskove-pravo', utm: { source: 'facebook', medium: 'cpc', campaign: 'military_sept' } },
  },
  {
    h: 3, status: 'contacted', id: 'demo-03', kind: 'order', name: 'Ігор Мельник', email: 'igor.demo@example.com',
    practiceKey: 'hozyajstvennye-spory', practiceTitle: 'Господарські спори', categoryTitle: 'Судова практика',
    quiz: ['sudova-praktyka', { dispute: 'commercial', amount: 'to1m', stage: 'first', instances: 'two' }],
    message: 'Контрагент не оплатив поставку на 740 тис. Претензію надсилали, відповіді немає.',
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/sudova-praktyka', utm: { source: 'google', medium: 'cpc', campaign: 'court_search', term: 'стягнення боргу з контрагента' } },
    owner: 'Марія Шевчук',
    steps: [[2.2, 'Статус: Нова → Звʼязались']],
    notes: [[2.1, 'Марія Шевчук', 'Передзвонила. Є договір поставки і накладні, акт звірки не підписаний. Чекаємо скани до завтра.']],
  },
  {
    h: 6, status: 'scheduled', id: 'demo-04', kind: 'consultation', format: 'office', name: 'ФОП Тарасенко', email: 'fop.demo@example.com',
    practiceKey: 'tax-law', practiceTitle: 'Податкові спори', categoryTitle: 'Судова практика',
    message: 'Податкове повідомлення-рішення на 1,2 млн після перевірки. Строк оскарження спливає через 8 днів.',
    src: { formLocation: 'contact_section', page: '/', landing: '/blog/podatkovi-perevirky-2026', referrer: 'www.google.com' },
    owner: 'Андрій Демченко',
    steps: [[5, 'Статус: Нова → Звʼязались'], [4.5, 'Статус: Звʼязались → Призначена']],
    notes: [[4.5, 'Андрій Демченко', 'Консультація в офісі завтра о 11:00. Попросив взяти акт перевірки і ППР.']],
  },
  {
    h: 20, status: 'contacted', id: 'demo-05', kind: 'order', name: 'Наталія Бондар',
    practiceKey: 'bankrutstvo-fizychnyh-osib', practiceTitle: 'Банкрутство фізичних осіб', categoryTitle: 'Ліквідація та банкрутство',
    quiz: ['likvidatsiya-bankrutstvo', { goal: 'bnkr-person', debts: 'to500', assets: 'movable', deadline: 'flex' }],
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/likvidatsiya-bankrutstvo/bankrutstvo-fizychnyh-osib', utm: { source: 'google', medium: 'cpc', campaign: 'bankruptcy_person' } },
    owner: 'Марія Шевчук',
    steps: [[18, 'Статус: Нова → Звʼязались']],
    notes: [[18, 'Марія Шевчук', 'Не взяла слухавку, надіслала повідомлення у Viber. Передзвонити після 18:00.']],
  },
  {
    h: 27, status: 'new', id: 'demo-06', kind: 'consultation', format: 'online', name: 'Сергій', email: 'serhii.demo@example.com',
    practiceKey: 'cat:biznes-nerukhomist-zemlya', practiceTitle: 'Бізнес, нерухомість і земля — напрям уточнимо', categoryTitle: 'Бізнес, нерухомість і земля',
    message: 'Купуємо ділянку під склад, хочемо перевірити документи продавця.',
    src: { formLocation: 'contact_section', page: '/', landing: '/' },
  },
  {
    h: 50, status: 'consultation', id: 'demo-07', kind: 'order', name: 'Вікторія Лисенко',
    practiceKey: 'semejnye-spory', practiceTitle: 'Сімейні спори', categoryTitle: 'Судова практика',
    quiz: ['sudova-praktyka', { dispute: 'family', amount: 'small', stage: 'not-filed', instances: 'one' }],
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/sudova-praktyka/semejnye-spory', utm: { source: 'instagram', medium: 'social' } },
    owner: 'Андрій Демченко',
    steps: [[47, 'Статус: Нова → Звʼязались'], [30, 'Статус: Звʼязались → Консультація']],
  },
  {
    h: 75, status: 'contract', id: 'demo-08', kind: 'order', convertedFrom: 'demo-13', name: 'ТОВ «Демо-Агро»', email: 'office.demo@example.com',
    practiceKey: 'liquidation-of-enterprises', practiceTitle: 'Ліквідація підприємства в Україні', categoryTitle: 'Ліквідація та банкрутство',
    quiz: ['likvidatsiya-bankrutstvo', { goal: 'classic', debts: 'to3m', assets: 'realty', deadline: 'q3' }],
    message: 'Потрібна ліквідація з продажем складу. Кредитор — один банк.',
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/likvidatsiya-bankrutstvo', referrer: 'www.google.com' },
    owner: 'Андрій Демченко',
    steps: [[26, 'Статус: Консультація → Договір']],
    notes: [[26, 'Андрій Демченко', 'Договір підписано, аванс отримано. Передано в роботу.']],
  },
  {
    h: 98, status: 'lost', id: 'demo-09', kind: 'consultation', format: 'online', name: 'Максим', practiceKey: 'corporate-law', practiceTitle: 'Корпоративне право', categoryTitle: 'Бізнес, нерухомість і земля',
    src: { formLocation: 'contact_section', page: '/', landing: '/', utm: { source: 'facebook', medium: 'cpc', campaign: 'brand' } },
    owner: 'Марія Шевчук',
    steps: [[96, 'Статус: Нова → Звʼязались'], [70, 'Статус: Звʼязались → Відмова']],
    notes: [[70, 'Марія Шевчук', 'Шукав безкоштовний шаблон статуту, консультація не потрібна.']],
  },
  {
    h: 124, status: 'held', id: 'demo-10', kind: 'consultation', format: 'office', name: 'Павло Гнатюк',
    practiceKey: 'vidstrochka', practiceTitle: 'Відстрочка від мобілізації та захист від незаконних дій ТЦК', categoryTitle: 'Військове право',
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/vijskove-pravo', utm: { source: 'google', medium: 'cpc', campaign: 'military_search' } },
    owner: 'Андрій Демченко',
    steps: [[123, 'Статус: Нова → Звʼязались'], [100, 'Статус: Звʼязались → Призначена'], [80, 'Статус: Призначена → Проведена']],
    notes: [[80, 'Андрій Демченко', 'Провели консультацію. Підстави для відстрочки є, клієнт думає до пʼятниці.']],
  },
  {
    h: 150, status: 'lost', id: 'demo-11', kind: 'consultation', format: 'phone', name: 'Ірина', practiceTitle: 'Ще не знаю',
    message: 'Скільки коштує розлучення?',
    src: { formLocation: 'contact_section', page: '/', landing: '/' },
    steps: [[140, 'Статус: Нова → Відмова']],
    notes: [[140, 'Марія Шевчук', 'Не відповідає 3 дні, номер поза зоною.']],
  },
  {
    h: 190, status: 'contract', id: 'demo-12', kind: 'order', name: 'ТОВ «Приклад Буд»',
    practiceKey: 'hozyajstvennye-spory', practiceTitle: 'Господарські спори', categoryTitle: 'Судова практика',
    quiz: ['sudova-praktyka', { dispute: 'commercial', amount: 'to10m', stage: 'appeal', instances: 'two' }],
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/sudova-praktyka/hozyajstvennye-spory', referrer: 'www.google.com' },
    owner: 'Андрій Демченко',
    steps: [[189, 'Статус: Нова → Звʼязались'], [160, 'Статус: Звʼязались → Консультація'], [120, 'Статус: Консультація → Договір']],
  },
]

SEEDS.push({
  id: 'demo-13', kind: 'consultation', format: 'office', convertedTo: 'demo-08',
  h: 96, status: 'converted', name: 'ТОВ «Демо-Агро»', email: 'office.demo@example.com',
  practiceKey: 'cat:likvidatsiya-bankrutstvo', practiceTitle: 'Ліквідація та банкрутство — напрям уточнимо', categoryTitle: 'Ліквідація та банкрутство',
  message: 'Хочемо закрити підприємство, є склад і кредит у банку. Що робити спочатку?',
  src: { formLocation: 'contact_section', page: '/', landing: '/practices/likvidatsiya-bankrutstvo', referrer: 'www.google.com' },
  owner: 'Андрій Демченко',
  steps: [[95, 'Статус: Нова → Звʼязались'], [90, 'Статус: Звʼязались → Призначена'], [76, 'Статус: Призначена → Проведена'], [75, 'Перевели в заявку на послугу']],
  notes: [[76, 'Андрій Демченко', 'Консультація в офісі. Класична ліквідація з продажем складу, банк — один кредитор. Клієнт готовий до договору.']],
})

export function demoLeads(): Lead[] {
  return SEEDS.map((s, i) => {
    const createdAt = iso(s.h)
    const history = [
      s.convertedFrom
        ? { at: createdAt, author: s.owner ?? 'Менеджер', text: 'Створено з безкоштовної консультації' }
        : { at: createdAt, author: 'Сайт', text: s.kind === 'order' ? 'Заявка з форми на сайті' : 'Запис на консультацію з сайту' },
      ...(s.steps ?? []).map(([h, text]) => ({ at: iso(h), author: s.owner ?? 'Марія Шевчук', text })),
    ]
    return {
      id: s.id,
      kind: s.kind,
      ...(s.format ? { format: s.format } : {}),
      ...(s.packageName ? { packageName: s.packageName } : {}),
      ...(s.convertedTo ? { convertedTo: s.convertedTo } : {}),
      ...(s.convertedFrom ? { convertedFrom: s.convertedFrom } : {}),
      createdAt,
      updatedAt: history[history.length - 1]!.at,
      status: s.status,
      name: s.name,
      phone: `+3805000000${String(i + 10).padStart(2, '0')}`,
      ...(s.email ? { email: s.email } : {}),
      ...(s.message ? { message: s.message } : {}),
      ...(s.practiceKey ? { practiceKey: s.practiceKey } : {}),
      practiceTitle: s.practiceTitle,
      ...(s.categoryTitle ? { categoryTitle: s.categoryTitle } : {}),
      ...(s.quiz ? { quote: buildLeadQuote(staticQuizSets, s.quiz[0], s.quiz[1]) } : {}),
      source: s.src,
      eventId: `f-demo${i}`,
      ...(s.owner ? { owner: s.owner } : {}),
      notes: (s.notes ?? []).map(([h, author, text]) => ({ at: iso(h), author, text })),
      history,
      demo: true,
    }
  })
}
