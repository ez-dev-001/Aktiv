import { defineField, defineType } from 'sanity'

/**
 * priceSpec — цена услуги.
 *
 * Разведка старого сайта показала, что одного числового поля priceFrom не хватает:
 * на /stoymost-uslug-2/ из девяти услуг две не числовые —
 *   «Стягнення заборгованості — от 15% суммы долга»  → percent
 *   «Реєстрація права власності — договорная»        → onRequest
 * Поэтому цена это объект с режимом, а не number.
 *
 * Правка цен = правка контента. Ни одно значение не попадает в код.
 */
export const priceSpec = defineType({
  name: 'priceSpec',
  title: 'Вартість',
  type: 'object',
  fields: [
    defineField({
      name: 'mode',
      title: 'Тип вартості',
      type: 'string',
      initialValue: 'fixed',
      options: {
        layout: 'radio',
        list: [
          { value: 'fixed', title: 'Від суми — «від 10 000 ₴»' },
          { value: 'percent', title: 'Відсоток — «15 % від суми стягнення»' },
          { value: 'onRequest', title: 'Договірна — «за запитом»' },
        ],
      },
      validation: (r) => r.required(),
    }),

    defineField({
      name: 'amount',
      title: 'Сума, ₴',
      description: 'Нижня межа. Показується як «від N ₴».',
      type: 'number',
      hidden: ({ parent }) => parent?.mode !== 'fixed',
      validation: (r) =>
        r.custom((v, ctx) => {
          const mode = (ctx.parent as { mode?: string })?.mode
          if (mode !== 'fixed') return true
          if (typeof v !== 'number') return 'Вкажіть суму'
          if (v <= 0) return 'Сума має бути більшою за нуль'
          return true
        }),
    }),

    defineField({
      name: 'amountMax',
      title: 'Верхня межа, ₴',
      description:
        'Необовʼязково. Якщо заповнено — на сторінці показується вилка «10 000 – 18 000 ₴», ' +
        'і ця ж вилка йде в лід як очікувана сума угоди без калькулятора.',
      type: 'number',
      hidden: ({ parent }) => parent?.mode !== 'fixed',
      validation: (r) =>
        r.custom((v, ctx) => {
          const p = ctx.parent as { mode?: string; amount?: number }
          if (p?.mode !== 'fixed' || typeof v !== 'number') return true
          if (typeof p.amount === 'number' && v < p.amount)
            return 'Верхня межа не може бути меншою за нижню'
          return true
        }),
    }),

    defineField({
      name: 'percent',
      title: 'Відсоток, %',
      description: 'Гонорар успіху. Наприклад 15 — «15 % від суми стягнення».',
      type: 'number',
      hidden: ({ parent }) => parent?.mode !== 'percent',
      validation: (r) =>
        r.custom((v, ctx) => {
          const mode = (ctx.parent as { mode?: string })?.mode
          if (mode !== 'percent') return true
          if (typeof v !== 'number') return 'Вкажіть відсоток'
          if (v <= 0 || v > 100) return 'Відсоток має бути в межах 1–100'
          return true
        }),
    }),

    defineField({
      name: 'percentBase',
      title: 'Від чого відсоток',
      type: 'localeString',
      description: 'Наприклад: «від суми стягнення», «від вартості майна».',
      hidden: ({ parent }) => parent?.mode !== 'percent',
    }),

    defineField({
      name: 'unit',
      title: 'Періодичність',
      type: 'string',
      initialValue: 'once',
      options: {
        layout: 'radio',
        list: [
          { value: 'once', title: 'Разово' },
          { value: 'month', title: 'За місяць — для абонентського обслуговування' },
          { value: 'hour', title: 'За годину' },
          { value: 'instance', title: 'За інстанцію' },
        ],
      },
      hidden: ({ parent }) => parent?.mode === 'onRequest',
    }),

    defineField({
      name: 'note',
      title: 'Примітка до ціни',
      description:
        'Один короткий рядок під ціною. Наприклад «без судового збору» або «за одну інстанцію».',
      type: 'localeString',
    }),

    defineField({
      name: 'showInPriceList',
      title: 'Показувати на сторінці «Вартість»',
      type: 'boolean',
      initialValue: true,
    }),
  ],

  preview: {
    select: { mode: 'mode', amount: 'amount', amountMax: 'amountMax', percent: 'percent', unit: 'unit' },
    prepare({ mode, amount, amountMax, percent, unit }) {
      const suffix = unit === 'month' ? '/міс' : unit === 'hour' ? '/год' : unit === 'instance' ? '/інстанція' : ''
      const uah = (n: number) => new Intl.NumberFormat('uk-UA').format(n)
      if (mode === 'onRequest') return { title: 'за запитом', subtitle: 'договірна' }
      if (mode === 'percent') return { title: `${percent ?? '—'} %`, subtitle: 'гонорар успіху' }
      if (typeof amountMax === 'number' && typeof amount === 'number')
        return { title: `${uah(amount)} – ${uah(amountMax)} ₴${suffix}`, subtitle: 'вилка' }
      return { title: `від ${amount ? uah(amount) : '—'} ₴${suffix}`, subtitle: 'нижня межа' }
    },
  },
})
