import { defineArrayMember, defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'

/**
 * practice — одно направление. 37 документов на украинском (см. разведку этапа 1).
 *
 * Отличия от старого сайта, где практика была обычным постом:
 *   • есть категория — три блока с главной стали настоящими разделами;
 *   • есть цена (priceSpec), и она правится в студии;
 *   • есть «що входить», етапи и FAQ — структура услуги, а не простыня текста;
 *   • есть ответственный адвокат — на старом сайте под каждой практикой
 *     стоял Шайко, включая военные и семейные дела.
 */
export const practice = defineType({
  name: 'practice',
  title: 'Практика',
  type: 'document',
  groups: [
    { name: 'content', title: 'Контент', default: true },
    { name: 'price', title: 'Вартість' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'title', title: 'Назва', type: 'localeString', group: 'content', validation: (r) => r.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug', group: 'content',
      options: { source: 'title.ua', maxLength: 90 },
      validation: (r) => r.required(),
      description:
        'Зберігаємо slug зі старого сайта, якщо для нього ставимо 301 — інакше втрачаємо позиції. ' +
        'Наприклад bankrutstvo, alternative-liquidation, oskarzhennya-rishen-vijskovo-likarskoyi-komisiyi-vlk.',
    }),
    defineField({
      name: 'category', title: 'Категорія', type: 'reference', to: [{ type: 'practiceCategory' }],
      group: 'content', validation: (r) => r.required(),
    }),
    defineField({
      name: 'icon', title: 'Іконка', type: 'string', group: 'content',
      options: {
        list: [
          'court', 'liquidation', 'bankruptcy', 'assets', 'debt', 'registration', 'deed',
          'realestate', 'land', 'construction', 'tax', 'labour', 'family', 'military', 'ip', 'energy', 'retainer',
        ].map((v) => ({ value: v, title: v })),
      },
      description: 'Зі власного набору 17 іконок. Файл: components/icons/sprite.tsx',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'excerpt', title: 'Короткий опис', type: 'localeText', group: 'content',
      description: 'Два рядки на картці практики й у мета-описі. До 180 знаків.',
      /* Предупреждение, а не ошибка. Описание нужно — оно идёт на
         карточку и в meta description, — но 36 направлений заполняются
         постепенно, и запрет публиковать практику без описания
         означал бы, что 30 из них вообще нельзя завести в Sanity.
         Сайт отсутствие описания переживает: блок условный. */
      validation: (r) => r.required().warning(),
    }),
    defineField({ name: 'body', title: 'Текст', type: 'localeBlock', group: 'content' }),

    defineField({
      name: 'includes', title: 'Що входить', type: 'array', group: 'content',
      of: [defineArrayMember({ type: 'localeString', name: 'item' })],
      description: 'Список робіт. Те, чого на старому сайті не було ні на одній із 37 сторінок.',
    }),
    defineField({
      name: 'stages', title: 'Етапи роботи', type: 'array', group: 'content',
      of: [
        defineArrayMember({
          type: 'object', name: 'stage',
          fields: [
            defineField({ name: 'title', title: 'Етап', type: 'localeString' }),
            defineField({ name: 'text', title: 'Опис', type: 'localeText' }),
            defineField({ name: 'duration', title: 'Строк', type: 'localeString', description: 'Напр. «5–10 робочих днів»' }),
          ],
          preview: { select: { title: 'title.ua', subtitle: 'duration.ua' } },
        }),
      ],
    }),
    defineField({
      name: 'faq', title: 'Питання та відповіді', type: 'array', group: 'content',
      of: [
        defineArrayMember({
          type: 'object', name: 'qa',
          fields: [
            defineField({ name: 'q', title: 'Питання', type: 'localeString' }),
            defineField({ name: 'a', title: 'Відповідь', type: 'localeText' }),
          ],
          preview: { select: { title: 'q.ua' } },
        }),
      ],
      description: 'Йде в розмітку FAQPage. Старий сайт FAQ не мав узагалі.',
    }),
    defineField({
      name: 'lawyers', title: 'Відповідальні адвокати', type: 'array', group: 'content',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'teamMember' }] })],
      /* Тоже предупреждение. Правило верное — на старом сайте под всеми
         37 практиками стоял один керуючий партнер, — но запрет на
         публикацию заставил бы проставить адвокатов наугад при первом
         же заполнении. Пустое поле, которое просит заполнить, честнее
         подставленной фамилии. */
      validation: (r) =>
        r.min(1).warning('Під практикою має стояти конкретний адвокат, а не керуючий партнер за замовчуванням'),
    }),

    /* ── ВАРТІСТЬ ── */
    defineField({
      name: 'packages', title: 'Тарифні пакети', type: 'array', group: 'price',
      description:
        'Якщо послуга має кілька варіантів — напр. «Резидент» і «З нерезидентом» ' +
        'в альтернативній ліквідації. Коли пакети є, на сторінці зʼявляється окремий блок, ' +
        'а поле «Вартість» лишається нижньою межею для картки й прайсу.',
      of: [
        defineArrayMember({
          type: 'object', name: 'package',
          fields: [
            defineField({ name: 'name', title: 'Назва пакета', type: 'localeString', validation: (r) => r.required() }),
            defineField({ name: 'price', title: 'Ціна, ₴', type: 'number', validation: (r) => r.required() }),
            defineField({
              name: 'audience', title: 'Кому підходить', type: 'array',
              of: [defineArrayMember({ type: 'localeString', name: 'item' })],
            }),
            defineField({
              name: 'includes', title: 'Що входить', type: 'array',
              of: [defineArrayMember({ type: 'localeString', name: 'item' })],
            }),
            defineField({ name: 'note', title: 'Примітка', type: 'localeString' }),
          ],
          preview: {
            select: { title: 'name.ua', subtitle: 'price' },
            prepare: ({ title, subtitle }) => ({ title, subtitle: subtitle ? `${subtitle} ₴` : '' }),
          },
        }),
      ],
    }),
    defineField({
      name: 'price', title: 'Вартість', type: 'priceSpec', group: 'price',
      description: 'Показується на сторінці практики й на /prices/. Нічого не хардкодиться.',
    }),
    defineField({
      name: 'quiz', title: 'Калькулятор', type: 'reference', to: [{ type: 'quiz' }], group: 'price',
      description:
        'Необовʼязково. Якщо не заповнено — береться калькулятор категорії. ' +
        'Заповнюйте, лише коли практиці потрібен свій набір питань.',
    }),

    /* ── SEO ── */
    defineField({
      name: 'seoTitle', title: 'Title', type: 'localeString', group: 'seo',
      description:
        'Без HTML-ентіті. На старому сайті в title потрапляло ЮК &quot;АКТИВ&quot; — так у видачі й показувалось.',
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
      name: 'legacyPaths', title: 'Старі URL для 301', type: 'array', group: 'seo',
      of: [defineArrayMember({ type: 'string' })],
      description: 'Напр. /practice/bankrutstvo/. Звідси генерується таблиця редиректів для Netlify.',
    }),
    defineField({
      name: 'featured', title: 'Показувати на головній', type: 'boolean', group: 'content', initialValue: false,
    }),
    defineField({ name: 'order', title: 'Порядок у категорії', type: 'number', group: 'content', initialValue: 100 }),
  ],

  orderings: [
    { name: 'byOrder', title: 'За порядком', by: [{ field: 'order', direction: 'asc' }] },
    { name: 'byCategory', title: 'За категорією', by: [{ field: 'category.title.ua', direction: 'asc' }, { field: 'order', direction: 'asc' }] },
  ],

  preview: {
    select: { title: 'title.ua', cat: 'category.title.ua', mode: 'price.mode', amount: 'price.amount', pct: 'price.percent' },
    prepare({ title, cat, mode, amount, pct }) {
      const price =
        mode === 'onRequest' ? 'за запитом'
        : mode === 'percent' ? `${pct ?? '—'} %`
        : typeof amount === 'number' ? `від ${new Intl.NumberFormat('uk-UA').format(amount)} ₴`
        : 'ціну не вказано'
      return { title, subtitle: `${cat ?? 'без категорії'} · ${price}` }
    },
  },
})
