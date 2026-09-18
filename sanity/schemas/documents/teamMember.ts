import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * teamMember — 10 специалистов фирмы.
 *
 * Почему это не просто «фото и должность»: на старом сайте под КАЖДОЙ
 * из 37 практик стоял один и тот же автор — керуючий партнер Шайко,
 * включая семейные споры и ВЛК. Здесь у практики есть поле lawyers,
 * и валидация не даёт сохранить практику без хотя бы одного адвоката.
 *
 * Отдельно про приватного исполнителя: он в штате, и это единственная
 * причина, по которой четвёртое правило кредо («доводимо до виконання,
 * а не до рішення») вообще выполнимо. Поэтому у него свой kind
 * и флаг highlight, который выносит его карточку в тёмную на главной.
 */
export const teamMember = defineType({
  name: 'teamMember',
  title: 'Команда',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Імʼя',
      type: 'localeString',
      description: 'Прізвище та імʼя. Локалізується, бо транслітерація різна: Шайко / Shayko.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name.ua', maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Роль у фірмі',
      type: 'string',
      initialValue: 'advocate',
      options: {
        layout: 'radio',
        list: [
          { value: 'managing', title: 'Керуючий партнер' },
          { value: 'partner', title: 'Партнер' },
          { value: 'advocate', title: 'Адвокат' },
          { value: 'executor', title: 'Приватний виконавець' },
          { value: 'military', title: 'Військовий юрист' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Підпис під імʼям',
      type: 'localeString',
      description: 'Напр. «Керуючий партнер, адвокат». Показується на картці.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Фото',
      type: 'image',
      options: { hotspot: true },
      description:
        'Мінімум 800×800 для retina. Поки фото немає — на сайті показується монограма з ініціалів, і це виглядає краще за фотосток.',
      fields: [defineField({ name: 'alt', title: 'Alt', type: 'string' })],
    }),
    defineField({
      name: 'practices',
      title: 'Практики',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'practice' }] })],
      description: 'За якими напрямами веде справи. Звідси будується блок «хто веде» на сторінці практики.',
    }),
    defineField({ name: 'bio', title: 'Про спеціаліста', type: 'localeText' }),
    defineField({
      name: 'phone',
      title: 'Прямий телефон',
      type: 'string',
      description: 'Необовʼязково. Клієнт має знати імʼя людини, яка веде його справу, і мати її контакт.',
    }),
    defineField({ name: 'email', title: 'Пошта', type: 'string' }),
    defineField({
      name: 'highlight',
      title: 'Виділяти на головній',
      type: 'boolean',
      initialValue: false,
      description:
        'Картка стає темною. Вмикати тільки приватному виконавцю: він доказ четвертого правила кредо, а не просто ще один співробітник.',
    }),
    defineField({
      name: 'order',
      title: 'Порядок',
      type: 'number',
      initialValue: 100,
      validation: (rule) => rule.required(),
    }),
  ],

  orderings: [{ name: 'byOrder', title: 'За порядком', by: [{ field: 'order', direction: 'asc' }] }],

  preview: {
    select: { title: 'name.ua', role: 'role.ua', media: 'photo', highlight: 'highlight' },
    prepare: ({ title, role, media, highlight }) => ({
      title: highlight ? `★ ${title}` : title,
      subtitle: role,
      media,
    }),
  },
})
