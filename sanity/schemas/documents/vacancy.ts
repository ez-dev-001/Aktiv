import { defineArrayMember, defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'

/**
 * vacancy — одна вакансия на странице «Карʼєра».
 *
 * Устроена как у armada.law/career: заголовок и короткие метки
 * (досвід, формат, зайнятість) видны сразу, а «Кого шукаємо»,
 * «Обовʼязки» и «Що пропонуємо» раскрываются по клику. Списки —
 * пунктами, а не простынёй текста: так их читают глазами за 20 секунд.
 *
 * Закрыли вакансию — снимите галочку «Відкрита», а не удаляйте
 * документ: весной её можно будет открыть снова теми же словами.
 */

const list = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: 'array',
    description,
    of: [defineArrayMember({ type: 'localeString', name: 'item' })],
    validation: (r) => r.max(10).warning('Більше 10 пунктів не дочитують'),
  })

export const vacancy = defineType({
  name: 'vacancy',
  title: 'Вакансія',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Посада',
      type: 'localeString',
      description: 'Як у пошуку роботи: «Юрист (Middle)», «Помічник адвоката», «Менеджер з роботи з клієнтами».',
      validation: (r) => r.required().custom(localeMax(70)),
    }),
    defineField({
      name: 'active',
      title: 'Відкрита',
      type: 'boolean',
      initialValue: true,
      description: 'Зняли галочку — вакансія зникає з сайту, але лишається тут.',
    }),
    defineField({
      name: 'example',
      title: 'Приклад (заглушка)',
      type: 'boolean',
      initialValue: false,
      description:
        'Стоїть у вакансій, які створив сид як зразок. Такі вакансії показуються на тестовому сайті з ' +
        'позначкою «приклад», а на справжньому домені — ніколи. Заповнили справжні дані — зніміть галочку.',
    }),
    defineField({
      name: 'department',
      title: 'Напрям',
      type: 'string',
      initialValue: 'legal',
      options: {
        list: [
          { value: 'legal', title: 'Юридичний' },
          { value: 'business', title: 'Робота з клієнтами' },
          { value: 'office', title: 'Офіс' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      description: 'Групує вакансії на сторінці й дає фільтр над списком.',
    }),
    defineField({
      name: 'experience',
      title: 'Досвід',
      type: 'localeString',
      description: 'Коротко: «від 2 років», «без досвіду», «від 5 років, свідоцтво адвоката».',
      validation: (r) => r.custom(localeMax(40)),
    }),
    defineField({
      name: 'format',
      title: 'Формат',
      type: 'string',
      initialValue: 'office',
      options: {
        list: [
          { value: 'office', title: 'Офіс' },
          { value: 'hybrid', title: 'Гібрид' },
          { value: 'remote', title: 'Віддалено' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'employment',
      title: 'Зайнятість',
      type: 'string',
      initialValue: 'full',
      options: {
        list: [
          { value: 'full', title: 'Повна' },
          { value: 'part', title: 'Часткова' },
          { value: 'intern', title: 'Стажування' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'summary',
      title: 'Коротко про роль',
      type: 'localeText',
      description: 'Два речення зверху розкритої вакансії: чим людина займатиметься і з ким.',
      validation: (r) => r.custom(localeMax(320)),
    }),
    list('weSeek', 'Кого шукаємо', 'Вимоги: досвід, освіта, навички.'),
    list('duties', 'Обовʼязки', 'Що людина робитиме щодня.'),
    list('weOffer', 'Що пропонуємо', 'Умови саме цієї посади. Загальні переваги — на сторінці «Карʼєра».'),
    defineField({ name: 'order', title: 'Порядок', type: 'number', initialValue: 100 }),
  ],
  orderings: [{ name: 'byOrder', title: 'За порядком', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'title.ua', active: 'active', exp: 'experience.ua', example: 'example' },
    prepare: ({ title, active, exp, example }) => ({
      title,
      subtitle: `${example ? '✎ заглушка · ' : ''}${active === false ? '⏸ закрита' : '● відкрита'}${exp ? ` · ${exp}` : ''}`,
    }),
  },
})
