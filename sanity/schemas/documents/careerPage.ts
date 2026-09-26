import { defineArrayMember, defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'
import { iconField } from '../objects/icon'

/**
 * careerPage — текст страницы «Карʼєра». Один документ на весь сайт.
 * Сами вакансии — отдельный тип «Вакансії»: их открывают и закрывают
 * независимо от того, как написан заголовок страницы.
 *
 * Пустое поле — сайт берёт текст по умолчанию из кода (lib/content.ts,
 * staticCareer). Блок «Слово партнера» показывается, только если в нём
 * есть цитата: чужих слов от имени партнера сайт не подставляет.
 */
export const careerPage = defineType({
  name: 'careerPage',
  title: 'Сторінка «Карʼєра»',
  type: 'document',
  groups: [
    { name: 'head', title: 'Перший екран', default: true },
    { name: 'benefits', title: 'Переваги' },
    { name: 'process', title: 'Відбір' },
    { name: 'quote', title: 'Слово партнера' },
    { name: 'faq', title: 'Питання' },
    { name: 'cv', title: 'Форма резюме' },
  ],
  fields: [
    defineField({ name: 'headEyebrow', title: 'Надзаголовок', type: 'localeString', group: 'head', validation: (r) => r.custom(localeMax(60)) }),
    defineField({ name: 'headTitle', title: 'Заголовок — перша частина', type: 'localeString', group: 'head', validation: (r) => r.custom(localeMax(70)) }),
    defineField({
      name: 'headTitleAccent',
      title: 'Заголовок — акцентна частина',
      type: 'localeString',
      group: 'head',
      description: 'Курсивом в акцентному кольорі.',
      validation: (r) => r.custom(localeMax(60)),
    }),
    defineField({
      name: 'headLede',
      title: 'Підзаголовок',
      type: 'localeText',
      group: 'head',
      description: '**Жирним** виділяються частини всередині.',
      validation: (r) => r.custom(localeMax(320)),
    }),

    defineField({ name: 'benefitsTitle', title: 'Заголовок блоку', type: 'localeString', group: 'benefits' }),
    defineField({
      name: 'benefits',
      title: 'Переваги',
      type: 'array',
      group: 'benefits',
      validation: (r) => r.max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'benefit',
          fields: [
            iconField(),
            defineField({ name: 'title', title: 'Заголовок', type: 'localeString', validation: (r) => r.required().custom(localeMax(50)) }),
            defineField({ name: 'text', title: 'Текст', type: 'localeText', validation: (r) => r.custom(localeMax(220)) }),
          ],
          preview: { select: { title: 'title.ua', subtitle: 'text.ua' } },
        }),
      ],
    }),

    defineField({
      name: 'steps',
      title: 'Етапи відбору',
      type: 'array',
      group: 'process',
      description: 'Від надсилання резюме до першого робочого дня. 3–5 кроків.',
      validation: (r) => r.max(5),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [
            defineField({ name: 'title', title: 'Крок', type: 'localeString', validation: (r) => r.required().custom(localeMax(40)) }),
            defineField({ name: 'text', title: 'Пояснення', type: 'localeText', validation: (r) => r.custom(localeMax(200)) }),
            defineField({ name: 'duration', title: 'Скільки триває', type: 'localeString', description: 'Напр. «до 3 робочих днів».' }),
          ],
          preview: { select: { title: 'title.ua', subtitle: 'duration.ua' } },
        }),
      ],
    }),

    defineField({
      name: 'quoteText',
      title: 'Цитата',
      type: 'localeText',
      group: 'quote',
      description: 'Слова керуючого партнера — про те, кого фірма шукає. Порожньо — блоку на сторінці немає.',
      validation: (r) => r.custom(localeMax(360)),
    }),
    defineField({ name: 'quoteAuthor', title: 'Хто сказав', type: 'reference', to: [{ type: 'teamMember' }], group: 'quote' }),

    defineField({
      name: 'faq',
      title: 'Питання та відповіді',
      type: 'array',
      group: 'faq',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'qa',
          fields: [
            defineField({ name: 'q', title: 'Питання', type: 'localeString', validation: (r) => r.required() }),
            defineField({ name: 'a', title: 'Відповідь', type: 'localeText', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'q.ua', subtitle: 'a.ua' } },
        }),
      ],
    }),

    defineField({ name: 'cvTitle', title: 'Заголовок форми', type: 'localeString', group: 'cv', validation: (r) => r.custom(localeMax(70)) }),
    defineField({
      name: 'cvText',
      title: 'Текст біля форми',
      type: 'localeText',
      group: 'cv',
      description: 'Що буде після надсилання: хто подивиться резюме і коли відповість.',
      validation: (r) => r.custom(localeMax(260)),
    }),
  ],
  preview: { prepare: () => ({ title: 'Сторінка «Карʼєра»' }) },
})
