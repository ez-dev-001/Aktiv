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
    { name: 'practices', title: 'Блок «Наша практика»' },
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
      description: 'Зараз на сайті не показується (перший екран у форматі «заголовок + абзац»). Лишається про запас.',
      validation: (r) => r.custom(localeMax(90)),
    }),
    /* Заголовок разрезан на две части не из вредности: вторая половина
       набрана курсивом в акцентном цвете, и это часть приёма, а не
       оформление текста. Одно поле означало бы разметку внутри строки —
       либо HTML в поле, либо потерю курсива. */
    defineField({
      name: 'heroTitle',
      title: 'Слоган — перша частина',
      type: 'localeString',
      group: 'hero',
      description: 'Велика фраза з водяним знаком «АКТИВ» під блоком практик. Звичайним накресленням.',
      validation: (r) => r.custom(localeMax(70)),
    }),
    defineField({
      name: 'heroTitleAccent',
      title: 'Слоган — акцентна частина',
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
      description: 'Тихе посилання поруч із головною кнопкою: веде до блоку «Команда». Напр. «Ознайомитись».',
      validation: (r) => r.custom(localeMax(34)),
    }),
    /* H1 першого екрана в два поля — як і слоган: друга частина
       набирається курсивом у малиновому. */
    defineField({
      name: 'heroHeading',
      title: 'Заголовок H1 — перша частина',
      type: 'localeString',
      group: 'hero',
      description:
        'Великий заголовок першого екрана: що робить фірма, словами, які шукають у Google. ' +
        'Напр. «Юридичний супровід бізнесу і».',
      validation: (r) => r.custom(localeMax(70)),
    }),
    defineField({
      name: 'heroHeadingAccent',
      title: 'Заголовок H1 — акцентна частина',
      type: 'localeString',
      group: 'hero',
      description: 'Продовження заголовка курсивом у малиновому. Напр. «захист ваших прав».',
      validation: (r) => r.custom(localeMax(50)),
    }),
    defineField({
      name: 'heroLede',
      title: 'Абзац під заголовком',
      type: 'localeText',
      group: 'hero',
      description: 'Два речення: хто ми, з якого року, які напрями і чим відрізняємось. До 260 знаків.',
      validation: (r) => r.custom(localeMax(260)),
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

    /* ═══════════ БЛОК «НАША ПРАКТИКА» ═══════════ */
    defineField({
      name: 'practicesText',
      title: 'Абзац у тёмній половині',
      type: 'localeText',
      group: 'practices',
      description: 'Два-три рядки під «Наша практика». Самі напрями й послуги беруться з розділу «Практики».',
      validation: (r) => r.custom(localeMax(240)),
    }),

    /* ═══════════ БЛОК «КОМАНДА» ═══════════ */
    defineField({
      name: 'teamText',
      title: 'Абзац під «Команда»',
      type: 'localeText',
      group: 'team',
      description:
        'Два речення про команду. {n} на сайті заміниться на кількість людей у розділі «Команда» — ' +
        'число не треба оновлювати вручну.',
      validation: (r) => r.custom(localeMax(260)),
    }),
    defineField({
      name: 'teamQuote',
      title: 'Цитата',
      type: 'localeText',
      group: 'team',
      description:
        'Кілька речень від керуючого партнера: як фірма веде справи. Поки поле порожнє, блок цитати ' +
        'на сайті просто не показується.',
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
