import type { Lead, LeadStatus, LeadType } from './types'

/**
 * Демо-обращения для CRM, пока не подключено хранилище.
 *
 * Имена, телефоны и истории выдуманы. Телефоны из диапазона
 * +380 50 000 00 xx — такого номера не существует, и позвонить
 * случайно нельзя. Даты считаются от «сейчас», поэтому список всегда
 * выглядит живым: сегодняшние, вчерашние, недельной давности.
 */

const H = 3_600_000
const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * H).toISOString()

interface Seed {
  type: LeadType
  h: number
  status: LeadStatus
  name: string
  email?: string
  message?: string
  practiceTitle?: string
  categoryTitle?: string
  packageName?: string
  position?: string
  cvLink?: string
  cvFileName?: string
  src: Lead['source']
  owner?: string
  notes?: [number, string][]
  steps?: [number, string][]
}

const SEEDS: Seed[] = [
  {
    type: 'client', h: 0.4, status: 'new', name: 'Олена Коваль', email: 'olena.demo@example.com',
    message: 'ТОВ на спрощеній системі, діяльність не ведемо з 2023 року. Хочемо закрити якнайшвидше.',
    practiceTitle: 'Альтернативна ліквідація — зміна директора і власників', categoryTitle: 'Ліквідація та банкрутство', packageName: 'Резидент',
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/likvidatsiya-bankrutstvo/alternative-liquidation', referrer: 'www.google.com' },
  },
  {
    type: 'client', h: 1.2, status: 'new', name: 'Андрій',
    message: 'Прийшла повістка з ТЦК, є відстрочка по догляду. Чи законно?',
    practiceTitle: 'Ще не знаю',
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/vijskove-pravo', utm: { source: 'facebook', medium: 'cpc', campaign: 'military_sept' } },
  },
  {
    type: 'client', h: 3, status: 'in_progress', name: 'Ігор Мельник', email: 'igor.demo@example.com',
    practiceTitle: 'Господарські спори', categoryTitle: 'Судова практика',
    message: 'Контрагент не оплатив поставку на 740 тис. Претензію надсилали, відповіді немає.',
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/sudova-praktyka', utm: { source: 'google', medium: 'cpc', campaign: 'court_search' } },
    owner: 'Марія Шевчук',
    steps: [[2.2, 'Статус: Нова → В роботі']],
    notes: [[2.1, 'Передзвонила. Є договір поставки і накладні. Консультація завтра о 11:00.']],
  },
  {
    type: 'client', h: 20, status: 'in_progress', name: 'Наталія Бондар',
    practiceTitle: 'Банкрутство фізичних осіб', categoryTitle: 'Ліквідація та банкрутство',
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/likvidatsiya-bankrutstvo/bankrutstvo-fizychnyh-osib' },
    owner: 'Андрій Демченко',
    steps: [[18, 'Статус: Нова → В роботі']],
    notes: [[18, 'Не взяла слухавку, написав у Viber. Передзвонити після 18:00.']],
  },
  {
    type: 'client', h: 27, status: 'new', name: 'Сергій', email: 'serhii.demo@example.com',
    practiceTitle: 'Бізнес, нерухомість і земля — напрям уточнимо', categoryTitle: 'Бізнес, нерухомість і земля',
    message: 'Купуємо ділянку під склад, хочемо перевірити документи продавця.',
    src: { formLocation: 'contact_section', page: '/', landing: '/' },
  },
  {
    type: 'client', h: 75, status: 'done', name: 'ТОВ «Демо-Агро»', email: 'office.demo@example.com',
    practiceTitle: 'Ліквідація підприємства в Україні', categoryTitle: 'Ліквідація та банкрутство',
    message: 'Потрібна ліквідація з продажем складу. Кредитор — один банк.',
    src: { formLocation: 'contact_section', page: '/', landing: '/practices/likvidatsiya-bankrutstvo', referrer: 'www.google.com' },
    owner: 'Андрій Демченко',
    steps: [[74, 'Статус: Нова → В роботі'], [26, 'Статус: В роботі → Завершена']],
    notes: [[26, 'Договір підписано, справу передано в роботу.']],
  },
  {
    type: 'client', h: 98, status: 'rejected', name: 'Максим',
    practiceTitle: 'Корпоративне право', categoryTitle: 'Бізнес, нерухомість і земля',
    src: { formLocation: 'contact_section', page: '/', landing: '/', utm: { source: 'facebook', medium: 'cpc', campaign: 'brand' } },
    owner: 'Марія Шевчук',
    steps: [[96, 'Статус: Нова → В роботі'], [70, 'Статус: В роботі → Відмова']],
    notes: [[70, 'Шукав безкоштовний шаблон статуту, консультація не потрібна.']],
  },
  {
    type: 'candidate', h: 5, status: 'new', name: 'Дарина Приклад', email: 'daryna.demo@example.com',
    position: 'Юрист (Middle)', cvFileName: 'Daryna_CV.pdf',
    message: '3 роки в господарських спорах, веду справи в апеляції самостійно.',
    src: { formLocation: 'career', page: '/career', landing: '/career', referrer: 'www.work.ua' },
  },
  {
    type: 'candidate', h: 30, status: 'in_progress', name: 'Олег Тестовий',
    position: 'Адвокат', cvLink: 'https://www.linkedin.com/in/example',
    src: { formLocation: 'career', page: '/career', landing: '/career', referrer: 'www.linkedin.com' },
    owner: 'Андрій Демченко',
    steps: [[28, 'Статус: Нова → В роботі']],
    notes: [[28, 'Співбесіда в пʼятницю о 15:00.']],
  },
  {
    type: 'candidate', h: 140, status: 'rejected', name: 'Ірина', email: 'iryna.demo@example.com',
    position: 'Помічник юриста', cvFileName: 'Iryna_resume.docx',
    src: { formLocation: 'career', page: '/career', landing: '/' },
    steps: [[120, 'Статус: Нова → Відмова']],
    notes: [[120, 'Шукає лише віддалену роботу — не підходить.']],
  },
]

export function demoLeads(): Lead[] {
  return SEEDS.map((s, i) => {
    const createdAt = iso(s.h)
    const author = s.owner ?? 'Марія Шевчук'
    const history = [
      { at: createdAt, author: 'Сайт', text: s.type === 'candidate' ? 'Резюме зі сторінки «Карʼєра»' : 'Заявка з форми на сайті' },
      ...(s.steps ?? []).map(([h, text]) => ({ at: iso(h), author, text })),
    ]
    return {
      id: `demo-${String(i + 1).padStart(2, '0')}`,
      type: s.type,
      createdAt,
      updatedAt: history[history.length - 1]!.at,
      status: s.status,
      name: s.name,
      phone: `+3805000000${String(i + 10).padStart(2, '0')}`,
      ...(s.email ? { email: s.email } : {}),
      ...(s.message ? { message: s.message } : {}),
      ...(s.practiceTitle ? { practiceTitle: s.practiceTitle } : {}),
      ...(s.categoryTitle ? { categoryTitle: s.categoryTitle } : {}),
      ...(s.packageName ? { packageName: s.packageName } : {}),
      ...(s.position ? { position: s.position } : {}),
      ...(s.cvLink ? { cvLink: s.cvLink } : {}),
      /* У демо-резюме нет самого файла — только имя: скачать нечего. */
      ...(s.cvFileName ? { cvFile: { name: s.cvFileName, type: '', size: 0 } } : {}),
      source: s.src,
      eventId: `f-demo${i}`,
      ...(s.owner ? { owner: s.owner } : {}),
      notes: (s.notes ?? []).map(([h, text]) => ({ at: iso(h), author, text })),
      history,
      demo: true,
    }
  })
}
