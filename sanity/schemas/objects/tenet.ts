import { defineField, defineType } from 'sanity'
import { localeMax } from './locale'

/** Набор иконок — тот же, что у практик. Один список на проект. */
export const ICON_NAMES = [
  'court',
  'liquidation',
  'bankruptcy',
  'assets',
  'debt',
  'registration',
  'deed',
  'realestate',
  'land',
  'construction',
  'tax',
  'labour',
  'family',
  'military',
  'ip',
  'energy',
  'retainer',
] as const

/**
 * tenet — «пункт со заголовком и абзацем».
 *
 * Один тип на два блока «Про компанію»: цінності и принципи. Выглядят
 * они по-разному — плитки с иконкой против нумерованных строк, — но
 * данные одной формы, и разводить два почти одинаковых типа значило бы
 * дважды править одно и то же при каждом изменении.
 *
 * Иконка опциональная: принципам она не нужна, там роль знака играет
 * номер, который считается от порядка в списке.
 */
export const tenet = defineType({
  name: 'tenet',
  title: 'Пункт',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Заголовок',
      type: 'localeString',
      validation: (r) => r.custom(localeMax(80)),
    }),
    defineField({
      name: 'text',
      title: 'Текст',
      type: 'localeText',
      validation: (r) => r.custom(localeMax(420)),
    }),
    defineField({
      name: 'icon',
      title: 'Іконка',
      type: 'string',
      description:
        'Не обовʼязково. Показується лише в блоці «Цінності»; у принципах ' +
        'замість неї стоїть номер, який рахується від порядку в списку.',
      options: { list: ICON_NAMES.map((v) => ({ value: v, title: v })) },
    }),
  ],
  preview: { select: { title: 'title.ua', subtitle: 'text.ua' } },
})

/**
 * tenetBlock — місія и візія: надзаголовок, одно утверждение крупным
 * кеглем и абзац под ним.
 *
 * Отдельно от tenet потому, что тут три поля, а не два, и утверждение
 * набирается засечным шрифтом в 30px — то есть у него свой предел
 * длины. Один тип на оба блока: они стоят рядом в две колонки и
 * обязаны быть одинаковой формы, иначе колонки разъезжаются.
 */
export const tenetBlock = defineType({
  name: 'tenetBlock',
  title: 'Блок',
  type: 'object',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Надзаголовок',
      type: 'localeString',
      description: 'Напр. «Наша місія».',
      validation: (r) => r.custom(localeMax(40)),
    }),
    defineField({
      name: 'statement',
      title: 'Твердження',
      type: 'localeText',
      description:
        'Одне речення великим кеглем. Довше двох рядків — і воно перестає ' +
        'читатись як твердження, стає абзацем.',
      validation: (r) => r.custom(localeMax(160)),
    }),
    defineField({
      name: 'text',
      title: 'Текст під ним',
      type: 'localeText',
      validation: (r) => r.custom(localeMax(520)),
    }),
  ],
  preview: { select: { title: 'eyebrow.ua', subtitle: 'statement.ua' } },
})
