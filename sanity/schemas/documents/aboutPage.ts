import { defineArrayMember, defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'

/**
 * aboutPage — страница «Про компанію». Один документ на весь сайт.
 *
 * ── Что здесь и почему именно это ──
 * Місія, візія, чотири цінності, принципи роботи и переход к кредо
 * лежали в lib/content.ts. Для юридической фирмы это ровно тот текст,
 * который переписывают: формулировку миссии правят после каждого
 * обсуждения стратегии, а список ценностей — когда меняется состав
 * практик. Держать его в коде значит звать разработчика на правку
 * одного абзаца.
 *
 * ── Чего здесь НЕТ ──
 * Цифр-счётчиков: они уже в «Налаштування сайту» и одни на весь сайт,
 * второе место для них создало бы расхождение — ровно то, от которого
 * страдал старый сайт.
 * Блока «Нам довіряють»: он тоже общий, из настроек.
 * Заголовков и подписей станций линии дела: это навигация, привязанная
 * к id разделов вёрстки, а не текст страницы.
 *
 * ── Структура одного типа на два блока ──
 * «Цінності» и «Принципи» выглядят по-разному (плитки с иконкой против
 * нумерованных строк), но данные у них одной формы: заголовок плюс
 * абзац. Поэтому массив один и тот же тип `tenet`, и иконка в нём
 * опциональная — принципам она не нужна, нумерация считается от
 * порядка в списке.
 *
 * Документ можно не создавать: каждый блок падает на статику из
 * lib/content.ts, причём поле за полем.
 */
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'Сторінка «Про компанію»',
  type: 'document',
  groups: [
    { name: 'head', title: 'Перший екран', default: true },
    { name: 'mission', title: 'Місія і візія' },
    { name: 'values', title: 'Цінності' },
    { name: 'principles', title: 'Принципи' },
    { name: 'cta', title: 'Заклик у кінці' },
  ],

  fields: [
    /* ═══════════ ПЕРВЫЙ ЭКРАН ═══════════ */
    defineField({
      name: 'headEyebrow',
      title: 'Надзаголовок',
      type: 'localeString',
      group: 'head',
      validation: (r) => r.custom(localeMax(90)),
    }),
    defineField({
      name: 'headTitle',
      title: 'Заголовок — перша частина',
      type: 'localeString',
      group: 'head',
      description: 'Набирається звичайним накресленням, білим.',
      validation: (r) => r.custom(localeMax(90)),
    }),
    defineField({
      name: 'headTitleAccent',
      title: 'Заголовок — акцентна частина',
      type: 'localeString',
      group: 'head',
      description:
        'Продовження заголовка курсивом в акцентному кольорі. Окреме поле, ' +
        'бо курсив тут — прийом, а не розмітка всередині рядка.',
      validation: (r) => r.custom(localeMax(60)),
    }),
    defineField({
      name: 'headLede',
      title: 'Підзаголовок',
      type: 'localeText',
      group: 'head',
      description: '**Жирним** виділяються частини всередині.',
      validation: (r) => r.custom(localeMax(260)),
    }),
    defineField({
      name: 'headFacts',
      title: 'Три факти збоку',
      type: 'array',
      group: 'head',
      description:
        'Колонка праворуч на першому екрані. Рівно три — четвертий не влізе ' +
        'у висоту кадру, два залишать дірку.',
      validation: (r) => r.max(3).warning('Колонка розрахована на три факти'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'headFact',
          fields: [
            defineField({
              name: 'kicker',
              title: 'Про що',
              type: 'localeString',
              description: 'Напр. «Практик», «Команда», «Мова роботи».',
            }),
            defineField({
              name: 'value',
              title: 'Значення',
              type: 'localeString',
              description: 'Напр. «36 напрямів». Коротко — набирається великим кеглем.',
              validation: (r) => r.custom(localeMax(40)),
            }),
            defineField({ name: 'note', title: 'Уточнення', type: 'localeString' }),
          ],
          preview: { select: { title: 'value.ua', subtitle: 'kicker.ua' } },
        }),
      ],
    }),

    /* ═══════════ МІСІЯ І ВІЗІЯ ═══════════ */
    defineField({
      name: 'mission',
      title: 'Місія',
      type: 'tenetBlock',
      group: 'mission',
    }),
    defineField({
      name: 'vision',
      title: 'Візія',
      type: 'tenetBlock',
      group: 'mission',
    }),

    /* ═══════════ ЦІННОСТІ ═══════════ */
    defineField({ name: 'valuesEyebrow', title: 'Надзаголовок', type: 'localeString', group: 'values' }),
    defineField({
      name: 'valuesTitle',
      title: 'Заголовок блоку',
      type: 'localeString',
      group: 'values',
      validation: (r) => r.custom(localeMax(120)),
    }),
    defineField({ name: 'valuesLede', title: 'Вступний текст', type: 'localeText', group: 'values' }),
    defineField({
      name: 'values',
      title: 'Цінності',
      type: 'array',
      group: 'values',
      description:
        'Сітка у дві колонки — парна кількість лягає рівно, непарна залишає ' +
        'половину останнього рядка порожньою.',
      of: [defineArrayMember({ type: 'tenet' })],
    }),

    /* ═══════════ ПРИНЦИПИ ═══════════ */
    defineField({ name: 'principlesEyebrow', title: 'Надзаголовок', type: 'localeString', group: 'principles' }),
    defineField({
      name: 'principlesTitle',
      title: 'Заголовок блоку',
      type: 'localeString',
      group: 'principles',
      validation: (r) => r.custom(localeMax(120)),
    }),
    defineField({ name: 'principlesLede', title: 'Вступний текст', type: 'localeText', group: 'principles' }),
    defineField({
      name: 'principles',
      title: 'Принципи',
      type: 'array',
      group: 'principles',
      description: 'Нумерація рахується від порядку в списку. Іконки тут не показуються.',
      of: [defineArrayMember({ type: 'tenet' })],
    }),
    defineField({
      name: 'bridgeKicker',
      title: 'Перехід до кредо — надпис',
      type: 'localeString',
      group: 'principles',
      description: 'Напр. «Як це перевірити».',
      validation: (r) => r.custom(localeMax(40)),
    }),
    defineField({
      name: 'bridgeText',
      title: 'Перехід до кредо — текст',
      type: 'localeText',
      group: 'principles',
      description: 'Абзац у кінці блоку принципів, звідки йде посилання на пʼять правил кредо.',
      validation: (r) => r.custom(localeMax(300)),
    }),
    defineField({
      name: 'bridgeLink',
      title: 'Перехід до кредо — підпис посилання',
      type: 'localeString',
      group: 'principles',
      validation: (r) => r.custom(localeMax(40)),
    }),

    /* ═══════════ ЗАКЛИК У КІНЦІ ═══════════ */
    defineField({
      name: 'ctaTitle',
      title: 'Заголовок',
      type: 'localeString',
      group: 'cta',
      validation: (r) => r.custom(localeMax(100)),
    }),
    defineField({
      name: 'ctaText',
      title: 'Текст під заголовком',
      type: 'localeText',
      group: 'cta',
      validation: (r) => r.custom(localeMax(200)),
    }),
    defineField({
      name: 'ctaPrimary',
      title: 'Головна кнопка',
      type: 'localeString',
      group: 'cta',
      description: 'Веде до форми заявки на головній.',
      validation: (r) => r.custom(localeMax(34)),
    }),
    defineField({
      name: 'ctaSecondary',
      title: 'Друга кнопка',
      type: 'localeString',
      group: 'cta',
      description: 'Веде на сторінку команди.',
      validation: (r) => r.custom(localeMax(34)),
    }),
  ],

  preview: { prepare: () => ({ title: 'Сторінка «Про компанію»' }) },
})
