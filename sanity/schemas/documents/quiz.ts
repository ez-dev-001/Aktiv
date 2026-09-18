import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * quiz — калькулятор вилки. Вопросы, варианты и ВЕСА живут здесь,
 * а не в коде: менеджер меняет коэффициенты без деплоя.
 *
 * Отдельный документ на ликвидацию/банкротство и на судебную практику.
 * Привязывается к practiceCategory, оттуда попадает на страницы практик.
 *
 * Порядок применения внутри одного шага: base → factor → add.
 * Первый шаг задаёт base, остальные его гнут.
 */
export const quiz = defineType({
  name: 'quiz',
  title: 'Калькулятор',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Назва (для студії)', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 60 },
      validation: (r) => r.required(),
      description: 'Идёт в dataLayer как quiz_id. Менять после запуска нельзя — сломается склейка событий.',
    }),
    defineField({
      name: 'category', title: 'Категорія практики', type: 'reference',
      to: [{ type: 'practiceCategory' }], validation: (r) => r.required(),
    }),
    defineField({ name: 'heading', title: 'Заголовок', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'intro', title: 'Вступний текст', type: 'localeText' }),

    defineField({
      name: 'steps', title: 'Питання', type: 'array',
      validation: (r) => r.required().min(3).max(4).error('Квіз має 3–4 питання: більше — і його не доходять до кінця'),
      of: [
        defineArrayMember({
          type: 'object', name: 'step',
          fields: [
            defineField({
              name: 'id', title: 'ID питання', type: 'slug',
              options: { maxLength: 40 }, validation: (r) => r.required(),
              description: 'Идёт в dataLayer как quiz_step_id. Латиницей, не менять после запуска.',
            }),
            defineField({ name: 'question', title: 'Питання', type: 'localeString', validation: (r) => r.required() }),
            defineField({ name: 'hint', title: 'Підказка під питанням', type: 'localeString' }),
            defineField({
              name: 'options', title: 'Варіанти', type: 'array',
              validation: (r) => r.required().min(2),
              of: [
                defineArrayMember({
                  type: 'object', name: 'option',
                  fields: [
                    defineField({ name: 'id', title: 'ID варіанта', type: 'slug', options: { maxLength: 40 }, validation: (r) => r.required() }),
                    defineField({ name: 'label', title: 'Текст варіанта', type: 'localeString', validation: (r) => r.required() }),
                    defineField({
                      name: 'base', title: 'База, ₴', type: 'number',
                      description: 'Задаёт базу расчёта. Заполняется в первом вопросе.',
                    }),
                    defineField({
                      name: 'factor', title: 'Множник', type: 'number',
                      description: '1 — не влияет. 1.6 — дороже на 60 %.',
                      validation: (r) => r.min(0.1).max(20),
                    }),
                    defineField({ name: 'add', title: 'Надбавка, ₴', type: 'number' }),
                    defineField({
                      name: 'successFeePercent', title: 'Перевести в гонорар успіху, %', type: 'number',
                      description:
                        'Если заполнено — результат перестаёт быть вилкой и становится процентом. ' +
                        'Для «є рішення, потрібне виконання»: там работает приватный исполнитель, ' +
                        'и цена считается от суммы взыскания, а не от объёма работы.',
                      validation: (r) => r.min(1).max(100),
                    }),
                    defineField({
                      name: 'reason', title: 'Чому сума така', type: 'localeString',
                      description: 'Строка в разборе результата. Без неё вилка выглядит как выдумка.',
                    }),
                  ],
                  preview: {
                    select: { t: 'label.ua', b: 'base', f: 'factor', a: 'add', p: 'successFeePercent' },
                    prepare({ t, b, f, a, p }) {
                      const bits = [
                        typeof b === 'number' ? `база ${b}` : null,
                        typeof f === 'number' ? `×${f}` : null,
                        typeof a === 'number' ? `+${a}` : null,
                        typeof p === 'number' ? `→ ${p} %` : null,
                      ].filter(Boolean)
                      return { title: t || 'Без назви', subtitle: bits.join('  ') || 'не впливає на розрахунок' }
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { t: 'question.ua', n: 'options' },
            prepare: ({ t, n }) => ({ title: t || 'Питання', subtitle: `${n?.length ?? 0} варіантів` }),
          },
        }),
      ],
    }),

    defineField({
      name: 'spreadLow', title: 'Нижня межа вилки', type: 'number', initialValue: 0.85,
      description: 'Множник розрахункової суми. 0.85 = мінус 15 %.',
      validation: (r) => r.required().min(0.3).max(1),
    }),
    defineField({
      name: 'spreadHigh', title: 'Верхня межа вилки', type: 'number', initialValue: 1.3,
      validation: (r) => r.required().min(1).max(3),
    }),
    defineField({
      name: 'roundTo', title: 'Округлювати до, ₴', type: 'number', initialValue: 1000,
      description: 'Вилка «28 000 – 46 000» читається як оцінка. «27 413 – 45 892» — як помилка.',
    }),
    defineField({
      name: 'floor', title: 'Мінімальна сума, ₴', type: 'number', initialValue: 8000,
      description: 'Нижче не опускаємось, навіть якщо коефіцієнти дали менше.',
    }),
    defineField({
      name: 'resultNote', title: 'Дисклеймер під результатом', type: 'localeText',
      description: 'Обовʼязково: вилка — оцінка, а не оферта. Точна сума — після ознайомлення з документами.',
      validation: (r) => r.required(),
    }),
  ],
  preview: {
    select: { title: 'title', cat: 'category.title.ua', n: 'steps' },
    prepare: ({ title, cat, n }) => ({ title, subtitle: `${cat ?? '—'} · ${n?.length ?? 0} питань` }),
  },
})
