import { defineArrayMember, defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'

/**
 * post — новости и разборы практики.
 *
 * На старом сайте блог был единственным, что работало исправно:
 * 71 украинская статья, 19 страниц пагинации, регулярные публикации.
 * Поэтому схема сделана под реальный редакционный поток, а не «на будущее».
 *
 * Два отличия от старого сайта:
 *  • категория обязательна — там она была одна на всё («Новини»),
 *    и лента не фильтровалась ничем;
 *  • есть привязка к практике: статья про ВЛК должна показываться
 *    на странице практики ВЛК, а не только в общей ленте.
 */
export const post = defineType({
  name: 'post',
  title: 'Новини',
  type: 'document',
  groups: [
    { name: 'content', title: 'Контент', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Заголовок', type: 'localeString', group: 'content', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title.ua', maxLength: 96 },
      validation: (r) => r.required(),
      description:
        'Зберігайте slug зі старого сайта, якщо для статті ставимо 301 — інакше втрачаємо накопичені позиції.',
    }),
    defineField({
      name: 'category',
      title: 'Рубрика',
      type: 'string',
      group: 'content',
      initialValue: 'news',
      options: {
        list: [
          { value: 'news', title: 'Новини законодавства' },
          { value: 'court', title: 'Позиції судів' },
          { value: 'case', title: 'Кейс-рев’ю' },
          { value: 'guide', title: 'Розбір для бізнесу' },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'practices',
      title: 'Повʼязані практики',
      type: 'array',
      group: 'content',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'practice' }] })],
      description: 'Стаття зʼявиться на сторінках цих практик. Стаття про ВЛК має вести на практику ВЛК.',
    }),
    defineField({
      name: 'author',
      title: 'Автор',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      group: 'content',
      description:
        'Конкретний адвокат, а не «адміністратор». На старому сайті під усім стояв керуючий партнер.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Дата публікації',
      type: 'datetime',
      group: 'content',
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Анонс',
      type: 'localeText',
      group: 'content',
      description: 'Два рядки на картці й у мета-описі. До 400 знаків.',
      /* max живе в custom, бо localeText — обʼєкт: див. localeMax. */
      validation: (r) => r.required().custom(localeMax(400)),
    }),
    defineField({
      name: 'cover',
      title: 'Обкладинка',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt', type: 'string' })],
    }),
    defineField({ name: 'body', title: 'Текст', type: 'localeBlock', group: 'content' }),
    defineField({
      name: 'seoTitle',
      title: 'Title',
      type: 'localeString',
      group: 'seo',
      /* Попередження, а не помилка: занадто довгий title Google просто
         обріже, і це не привід забороняти публікацію статті. */
      validation: (r) => r.custom(localeMax(70)).warning(),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Meta description',
      type: 'localeText',
      group: 'seo',
      validation: (r) => r.custom(localeMax(180)).warning(),
    }),
    defineField({
      name: 'legacyPaths',
      title: 'Старі URL для 301',
      type: 'array',
      group: 'seo',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Напр. /yak-mozhna-vtratyty-nerukhomist-pislya-pokupky/ — статті лежали в корені сайта.',
    }),
  ],

  orderings: [
    { name: 'byDate', title: 'Спочатку нові', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],

  preview: {
    select: { title: 'title.ua', cat: 'category', date: 'publishedAt', media: 'cover' },
    prepare({ title, cat, date, media }) {
      const labels: Record<string, string> = {
        news: 'Новини законодавства',
        court: 'Позиції судів',
        case: 'Кейс-рев’ю',
        guide: 'Розбір для бізнесу',
      }
      const d = date ? new Date(date).toLocaleDateString('uk-UA') : 'без дати'
      return { title, subtitle: `${labels[cat] ?? cat} · ${d}`, media }
    },
  },
})
