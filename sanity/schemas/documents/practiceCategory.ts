import { defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'
import { iconField } from '../objects/icon'

/**
 * practiceCategory — четыре блока с главной, ставшие настоящими разделами.
 *
 * На старом сайте это были просто заголовки над списками ссылок: у блока не было
 * ни своей страницы, ни URL, ни описания. Здесь у категории есть всё, включая
 * свой калькулятор — поэтому «Ліквідація та банкрутство» считает вилку в гривнях,
 * а «Судова практика» умеет переключаться на гонорар успіху.
 */
export const practiceCategory = defineType({
  name: 'practiceCategory',
  title: 'Категорія практик',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Назва', type: 'localeString', validation: (r) => r.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title.ua', maxLength: 60 },
      validation: (r) => r.required(),
      description: 'Живёт в URL: /practices/<slug>/<practice>/',
    }),
    iconField({
      required: true,
      description: 'Лежить на фото в куті картки на головній.',
    }),
    defineField({
      name: 'photo',
      title: 'Фото на картці',
      type: 'image',
      options: { hotspot: true },
      description:
        'Фон картки на головній і першого екрана сторінки напряму. Горизонтальне фото від 2000 px ' +
        'завширшки. Після завантаження поставте точку фокуса (кружечок) на головне в кадрі — ' +
        'картка вузька й широка, і без точки кадр ріжеться по центру. Текст лежить поверх ' +
        'затемнення, тож фото не мусить бути темним. Без фото картка матиме темну плашку з іконкою.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt — що на фото',
          type: 'string',
          description: 'Коротко, для незрячих і пошуку по картинках. Напр. «Будівля суду з колонами».',
          validation: (r) => r.max(120),
        }),
      ],
    }),
    defineField({
      name: 'excerpt', title: 'Опис на картці', type: 'localeText',
      description: 'Два-три рядки на головній. До 400 знаків.',
      validation: (r) => r.required().custom(localeMax(400)),
    }),
    defineField({ name: 'intro', title: 'Вступ на сторінці категорії', type: 'localeBlock' }),
    defineField({
      name: 'quiz', title: 'Калькулятор категорії', type: 'reference', to: [{ type: 'quiz' }],
      description: 'Береться для всіх практик категорії, якщо практика не має свого.',
    }),
    defineField({
      name: 'order', title: 'Порядок на головній', type: 'number', initialValue: 100,
      description:
        'Ліквідація першою: це основна практика фірми (300 закритих підприємств) ' +
        'і єдина з відкритою ціною на вході.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'seoTitle', title: 'Title', type: 'localeString',
      validation: (r) => r.custom(localeMax(70)).warning(),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Meta description',
      type: 'localeText',
      validation: (r) => r.custom(localeMax(180)).warning(),
    }),
  ],
  orderings: [{ name: 'byOrder', title: 'За порядком', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title.ua', slug: 'slug.current', order: 'order' },
    prepare: ({ title, slug, order }) => ({ title, subtitle: `${order} · /practices/${slug ?? '—'}/` }),
  },
})
