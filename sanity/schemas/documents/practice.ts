import { defineArrayMember, defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'
import { iconField } from '../objects/icon'

/**
 * practice — одно направление. 37 документов на украинском (см. разведку этапа 1).
 *
 * Отличия от старого сайта, где практика была обычным постом:
 *   • есть категория — три блока с главной стали настоящими разделами;
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
    { name: 'variants', title: 'Варіанти послуги' },
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
    iconField({ required: true, group: 'content' }),
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

    /* ── ВАРІАНТИ ПОСЛУГИ ──
       Цен на сайте нет: стоимость называют после консультации. Поля
       цены убраны из схемы. Если в старых документах они остались,
       их стирает `npm run cleanup:prices` (см. scripts/cleanup-prices.mjs). */
    defineField({
      name: 'packages', title: 'Варіанти послуги', type: 'array', group: 'variants',
      description:
        'Якщо послуга має кілька варіантів — напр. «Резидент» і «З нерезидентом» ' +
        'в альтернативній ліквідації: кому підходить і що входить. Цін на сайті немає.',
      of: [
        defineArrayMember({
          type: 'object', name: 'package',
          fields: [
            defineField({ name: 'name', title: 'Назва варіанта', type: 'localeString', validation: (r) => r.required() }),
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
          preview: { select: { title: 'name.ua', subtitle: 'note.ua' } },
        }),
      ],
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
    defineField({ name: 'order', title: 'Порядок у категорії', type: 'number', group: 'content', initialValue: 100 }),
  ],

  orderings: [
    { name: 'byOrder', title: 'За порядком', by: [{ field: 'order', direction: 'asc' }] },
    { name: 'byCategory', title: 'За категорією', by: [{ field: 'category.title.ua', direction: 'asc' }, { field: 'order', direction: 'asc' }] },
  ],

  preview: {
    select: { title: 'title.ua', subtitle: 'category.title.ua' },
    prepare: ({ title, subtitle }) => ({ title, subtitle: subtitle ?? 'без категорії' }),
  },
})
