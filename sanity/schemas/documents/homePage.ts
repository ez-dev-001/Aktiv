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
    { name: 'promises', title: 'Три обіцянки' },
    { name: 'credo', title: 'Кредо' },
    { name: 'path', title: 'Шлях справи' },
    { name: 'manifesto', title: 'Цитата на фото' },
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
      name: 'heroLede',
      title: 'Підзаголовок',
      type: 'localeText',
      group: 'hero',
      description: 'Один-два речення під заголовком. **Жирним** виділяються частини всередині.',
      validation: (r) => r.custom(localeMax(240)),
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
      description: 'Веде до блоку практик нижче на сторінці.',
      validation: (r) => r.custom(localeMax(34)),
    }),

    /* ═══════════ ТРИ ОБЕЩАНИЯ ═══════════ */
    defineField({
      name: 'promises',
      title: 'Три обіцянки',
      type: 'array',
      group: 'promises',
      description:
        'Смуга під першим екраном. Рівно три — сітка в три колонки, четверта запис її ламає, ' +
        'а дві залишають дірку.',
      validation: (r) => r.max(3).warning('Смуга розрахована на три обіцянки'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'promise',
          fields: [
            defineField({
              name: 'kicker',
              title: 'Питання',
              type: 'localeString',
              description: 'Дрібний рядок над відповіддю. Напр. «Перша консультація».',
            }),
            defineField({
              name: 'answer',
              title: 'Відповідь',
              type: 'localeString',
              description: 'Коротко й категорично. Напр. «Без оплати».',
            }),
            defineField({ name: 'note', title: 'Пояснення', type: 'localeText' }),
          ],
          preview: {
            select: { title: 'answer.ua', subtitle: 'kicker.ua' },
          },
        }),
      ],
    }),

    /* ═══════════ КРЕДО ═══════════ */
    defineField({ name: 'credoEyebrow', title: 'Надзаголовок', type: 'localeString', group: 'credo' }),
    defineField({
      name: 'credoTitle',
      title: 'Заголовок блоку',
      type: 'localeString',
      group: 'credo',
      validation: (r) => r.custom(localeMax(120)),
    }),
    defineField({ name: 'credoLede', title: 'Вступний текст', type: 'localeText', group: 'credo' }),
    defineField({
      name: 'credo',
      title: 'Правила',
      type: 'array',
      group: 'credo',
      description:
        'Нумерація на сайті рахується сама від порядку в цьому списку. Блок «Цитата на фото» ' +
        'нижче посилається на четверте правило — якщо міняєте порядок, перевірте підпис там.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'rule',
          fields: [
            defineField({ name: 'title', title: 'Правило', type: 'localeString' }),
            defineField({
              name: 'text',
              title: 'Пояснення',
              type: 'localeText',
              description: '**Жирним** виділяються частини всередині.',
            }),
          ],
          preview: { select: { title: 'title.ua', subtitle: 'text.ua' } },
        }),
      ],
    }),

    /* ═══════════ ШЛЯХ СПРАВИ ═══════════ */
    defineField({ name: 'pathEyebrow', title: 'Надзаголовок', type: 'localeString', group: 'path' }),
    defineField({
      name: 'pathTitle',
      title: 'Заголовок блоку',
      type: 'localeString',
      group: 'path',
      validation: (r) => r.custom(localeMax(120)),
    }),
    defineField({
      name: 'path',
      title: 'Станції',
      type: 'array',
      group: 'path',
      description: 'Сітка на чотири колонки. Номери станцій рахуються самі.',
      validation: (r) => r.max(4).warning('Сітка розрахована на чотири станції'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'station',
          fields: [
            defineField({ name: 'title', title: 'Назва станції', type: 'localeString' }),
            defineField({ name: 'text', title: 'Опис', type: 'localeText' }),
          ],
          preview: { select: { title: 'title.ua', subtitle: 'text.ua' } },
        }),
      ],
    }),

    /* ═══════════ ЦИТАТА НА ФОТО ═══════════ */
    defineField({
      name: 'manifestoKicker',
      title: 'Надпис над цитатою',
      type: 'localeString',
      group: 'manifesto',
      description: 'Напр. «Четверте правило».',
      validation: (r) => r.custom(localeMax(40)),
    }),
    defineField({
      name: 'manifestoQuote',
      title: 'Цитата',
      type: 'localeString',
      group: 'manifesto',
      description:
        'Набирається великим кеглем поверх фотографії. Коротко: довший рядок ' +
        'на телефоні займе весь екран.',
      validation: (r) => r.custom(localeMax(70)),
    }),
    defineField({
      name: 'manifestoNote',
      title: 'Пояснення під цитатою',
      type: 'localeText',
      group: 'manifesto',
      validation: (r) => r.custom(localeMax(220)),
    }),
  ],

  preview: { prepare: () => ({ title: 'Головна сторінка' }) },
})
