import { defineArrayMember, defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'

/**
 * homePage — текст главной страницы. Один документ на весь сайт.
 *
 * ── Зачем он появился ──
 * Практики, команда, цифры, клиенты и контакты уже редактировались из
 * Sanity, а первый экран — нет. Заголовок «Рішення без виконання — не
 * результат», кредо из пяти правил, четыре станции пути дела, цитата
 * на фотографии и три обещания лежали в lib/content.ts, то есть менялись
 * только правкой кода. Для блока, который читают первым, это ровно
 * наоборот: его переписывают чаще всего остального.
 *
 * ── Почему отдельный документ, а не поля в siteSettings ──
 * siteSettings — это настройки: телефон, цифры, лента клиентов. Они
 * работают на всех страницах. Здесь же текст одной страницы, и его
 * правят другие люди в другие моменты. Слив их в один документ дал бы
 * форму на сорок полей, где телефон фирмы стоит рядом с четвёртым
 * правилом кредо.
 *
 * ── Что будет, если документ не создан ──
 * Ничего не сломается. Каждый блок падает на статику из lib/content.ts,
 * причём по отдельным полям: заполненный герой и пустое кредо — это
 * рабочее состояние, а не половина страницы. Поэтому здесь почти нет
 * required: обязательным полем в этом документе можно только прострелить
 * себе ногу, заблокировав публикацию из-за незаполненного пункта.
 */
export const homePage = defineType({
  name: 'homePage',
  title: 'Головна сторінка',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Перший екран', default: true },
    { name: 'credo', title: 'Місія' },
    { name: 'team', title: 'Блок «Команда»' },
  ],

  fields: [
    /* ═══════════ ПЕРВЫЙ ЭКРАН ═══════════ */
    defineField({
      name: 'heroEyebrow',
      title: 'Надзаголовок',
      type: 'localeString',
      group: 'hero',
      description: 'Дрібний рядок над заголовком. Напр. «Юридична компанія «АКТИВ» · Київ · з 2007 року».',
      validation: (r) => r.custom(localeMax(90)),
    }),
    /* Заголовок разрезан на две части не из вредности: вторая половина
       набрана курсивом в акцентном цвете, и это часть приёма, а не
       оформление текста. Одно поле означало бы разметку внутри строки —
       либо HTML в поле, либо потерю курсива. */
    defineField({
      name: 'heroTitle',
      title: 'Заголовок — перша частина',
      type: 'localeString',
      group: 'hero',
      description: 'Набирається звичайним накресленням, білим.',
      validation: (r) => r.custom(localeMax(70)),
    }),
    defineField({
      name: 'heroTitleAccent',
      title: 'Заголовок — акцентна частина',
      type: 'localeString',
      group: 'hero',
      description:
        'Продовження заголовка. На сайті набирається курсивом в акцентному кольорі — ' +
        'саме тому це окреме поле, а не один рядок із розміткою.',
      validation: (r) => r.custom(localeMax(50)),
    }),
    defineField({
      name: 'heroCtaPrimary',
      title: 'Головна кнопка',
      type: 'localeString',
      group: 'hero',
      description: 'Веде до форми заявки.',
      validation: (r) => r.custom(localeMax(34)),
    }),
    defineField({
      name: 'heroCtaSecondary',
      title: 'Друга кнопка',
      type: 'localeString',
      group: 'hero',
      description: 'Кнопка з напрямами: плавно прокручує сторінку до блоку практик. Напр. «Обрати напрям».',
      validation: (r) => r.custom(localeMax(34)),
    }),
    /* H1 і продовження — один абзац під слоганом. Слоган — образ,
       H1 каже пошуковику й людині прямо, що робить фірма. */
    defineField({
      name: 'heroHeading',
      title: 'Заголовок H1 (що ми робимо)',
      type: 'localeString',
      group: 'hero',
      description:
        'Абзац під великим слоганом, білим. Словами, які шукають у Google. ' +
        'Напр. «Юридичний супровід бізнесу і захист прав у судах України».',
      validation: (r) => r.custom(localeMax(90)),
    }),
    defineField({
      name: 'heroLede',
      title: 'Продовження після H1',
      type: 'localeText',
      group: 'hero',
      description:
        'Одне речення тим самим кеглем, але тихіше: напрями й чим відрізняємось. До 140 знаків — ' +
        'разом із H1 це має бути 3–4 рядки, не більше.',
      validation: (r) => r.custom(localeMax(140)),
    }),

    /* ═══════════ МІСІЯ: «ЯК МИ ЦЕ РОБИМО» ═══════════ */
    defineField({
      name: 'credo',
      title: 'Правила',
      type: 'array',
      group: 'credo',
      description:
        'Блок «Як ми це робимо» під місією: короткі формулювання, без пояснень. ' +
        'Нумерація рахується сама. Саму місію редагують у «Про компанію».',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'rule',
          fields: [
            defineField({ name: 'title', title: 'Правило', type: 'localeString' }),
          ],
          preview: { select: { title: 'title.ua' } },
        }),
      ],
    }),

    /* ═══════════ БЛОК «КОМАНДА» ═══════════ */
    defineField({
      name: 'teamQuote',
      title: 'Цитата',
      type: 'localeText',
      group: 'team',
      description:
        'Кілька речень від керуючого партнера: як фірма веде справи. Поки поле порожнє, на тестовому ' +
        'сайті видно заглушку, а на справжньому блок цитати просто не показується.',
      validation: (r) => r.custom(localeMax(420)),
    }),
    defineField({
      name: 'teamQuoteAuthor',
      title: 'Автор цитати',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      group: 'team',
      description: 'Імʼя, посада й фото підтягуються з картки в «Команді».',
    }),
    defineField({
      name: 'teamTitle',
      title: 'Заголовок',
      type: 'localeString',
      group: 'team',
      validation: (r) => r.custom(localeMax(120)),
    }),
  ],

  preview: { prepare: () => ({ title: 'Головна сторінка' }) },
})
