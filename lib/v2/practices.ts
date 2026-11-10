/**
 * «Наша практика» на головній — вісім напрямів у редакції клієнта
 * (документ «бачення сайту», 2026). Структура в Sanity поки інша
 * (чотири категорії), тому тут — статичний список з посиланнями на
 * наявні сторінки практик. Коли категорії в Sanity переведуть на ці
 * вісім напрямів, блок можна буде годувати звідти.
 *
 * href пункту — сторінка практики, якщо вона вже є; інакше пункт —
 * просто текст. img — файл у public/v2/img (експорт зі сторінки
 * Assets у Figma).
 */
export interface V2Practice {
  title: string
  href: string
  img: string
  items: { title: string; href?: string }[]
}

const SUD = '/practices/sudova-praktyka'
const BIZ = '/practices/biznes-nerukhomist-zemlya'
const MIL = '/practices/vijskove-pravo'
const LIQ = '/practices/likvidatsiya-bankrutstvo'

export const V2_PRACTICES: V2Practice[] = [
  {
    title: 'Судова практика',
    href: SUD,
    img: 'p-court',
    items: [
      { title: 'Господарські спори', href: `${SUD}/hozyajstvennye-spory` },
      { title: 'Цивільні спори', href: `${SUD}/grazhdanskie-spory` },
      { title: 'Адміністративні спори', href: `${SUD}/administrativnye-spory` },
      { title: 'Податкові спори', href: `${SUD}/tax-law` },
      { title: 'Спори про нерухомість', href: `${SUD}/spory-o-nedvizhimosti` },
      { title: 'Сімейні спори', href: `${SUD}/semejnye-spory` },
      { title: 'Трудові спори', href: `${SUD}/trudovye-spory` },
      { title: 'Кримінальний захист', href: `${SUD}/ugolovnaya-zashhita` },
      { title: 'Представництво в органах державної влади', href: `${SUD}/predstavitelstvo-v-organakh-vlasti` },
    ],
  },
  {
    title: 'Супровід бізнесу',
    href: BIZ,
    img: 'p-business',
    items: [
      { title: 'Абонентське юридичне обслуговування', href: `${BIZ}/abonentske-obsluhovuvannya` },
      { title: 'Реєстрація підприємств', href: `${BIZ}/registration-of-enterprises` },
      { title: 'Реорганізація підприємств', href: `${BIZ}/corporate-law` },
      { title: 'Ліквідація підприємств', href: `${LIQ}/liquidation-of-enterprises` },
      { title: 'Реєстрація права власності', href: `${BIZ}/property-rights-services` },
    ],
  },
  {
    title: 'Військове право',
    href: MIL,
    img: 'p-military',
    items: [
      { title: 'Юридична допомога військовослужбовцям', href: `${MIL}/yurydychna-dopomoha-vijskovosluzhbovtsyam` },
      { title: 'Супровід адвоката в органах ТЦК', href: `${MIL}/suprovid-advokata-v-organah-tczk` },
      { title: 'Відстрочка від мобілізації та захист від незаконних дій ТЦК', href: `${MIL}/vidstrochka-vid-mobilizacziyi` },
      { title: 'Оскарження рішень ВЛК', href: `${MIL}/oskarzhennya-rishen-vlk` },
      { title: 'Перерахунок і підвищення пенсій військовослужбовцям', href: `${MIL}/pererahunok-pensij` },
      { title: 'Виплати у разі інвалідності, загибелі або зникнення', href: `${MIL}/vyplaty-invalidnist-zagybel` },
      { title: 'Виплата винагороди 100 000 грн військовослужбовцям', href: `${MIL}/vynagoroda-100000` },
    ],
  },
  {
    title: 'Ліквідація та банкрутство',
    href: LIQ,
    img: 'p-liquidation',
    items: [
      { title: 'Альтернативна ліквідація', href: `${LIQ}/alternative-liquidation` },
      { title: 'Ліквідація підприємства в Україні', href: `${LIQ}/liquidation-of-enterprises` },
      { title: 'Банкрутство юридичних осіб', href: `${LIQ}/bankrutstvo` },
      { title: 'Банкрутство фізичних осіб', href: `${LIQ}/bankrutstvo-fizychnyh-osib` },
      { title: 'Відстрочення кредитів', href: `${LIQ}/deferred-loans` },
      { title: 'Захист активів від кредиторів і банків', href: `${LIQ}/asset-protection` },
    ],
  },
  {
    title: 'Нерухомість та будівництво',
    href: `${BIZ}/the-property`,
    img: 'p-realty',
    items: [
      { title: 'Супровід операцій з нерухомістю', href: `${BIZ}/nedvizhimost` },
      { title: 'Юридичний супровід будівництва', href: `${BIZ}/stroitelstvo` },
      { title: 'Земельні спори', href: `${BIZ}/land-law` },
    ],
  },
  {
    title: 'Енергетичне право',
    href: `${BIZ}/energetychne-pravo`,
    img: 'p-energy',
    items: [
      { title: 'Договори постачання та публічні закупівлі' },
      { title: 'Ліцензування та регулювання' },
      { title: 'Судові спори' },
      { title: 'Податкові питання' },
      { title: 'Загальна підтримка бізнесу' },
    ],
  },
  {
    title: 'Інтелектуальна власність',
    href: `${BIZ}/intelektualna-vlasnist`,
    img: 'p-ip',
    items: [
      { title: 'Реєстрація й захист торгових марок, авторських прав і патентів' },
      { title: 'Міжнародна реєстрація торгових марок' },
      { title: 'Договори щодо ІТ-обʼєктів' },
    ],
  },
  {
    title: 'Захист дітей від булінгу',
    href: `${BIZ}/zahyst-ditej-vid-bulingu`,
    img: 'p-bullying',
    items: [
      { title: 'Правова допомога та захист прав дитини' },
      { title: 'Соціальний супровід та підтримка' },
      { title: 'Робота із закладами освіти' },
      { title: 'Захист від кібербулінгу' },
    ],
  },
]

/** Цінності — блок «Цінність AKTIV — у вашому результаті». */
export const V2_VALUES = [
  { title: 'Партнерство', text: 'Ми працюємо як частина вашого бізнесу', img: 'v-rings' },
  { title: 'Реальні рішення', text: 'Замість теорії — практичні кроки до результату', img: 'v-crystal' },
  { title: 'Експертиза', text: 'Глибокі знання у ключових напрямах практики', img: 'v-bars' },
  { title: 'Довіра', text: 'Довгострокові відносини та підтримка на кожному етапі', img: 'v-shield' },
]

/** Шлях до картинки нової редакції (public/v2/img/<name>.jpg). */
export const v2img = (name: string) => `/v2/img/${name}.jpg`
