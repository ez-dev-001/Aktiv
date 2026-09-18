import { defineArrayMember, defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'

/**
 * siteSettings — единственный документ на весь сайт.
 *
 * Здесь живут три цифры счётчиков. Это не бюрократия, а прямое лечение
 * находки первого этапа: на старом сайте они лежали в переводах как текст
 * и разошлись — украинская версия обещала 400 процессов и 300 ликвидаций,
 * английская 15 500 и «more than two hundred». Одно поле на три локали
 * делает такое расхождение невозможным.
 *
 * Здесь же блок «Нам довіряють» — бегущая лента клиентов на главной.
 * Порядок в массиве = порядок в ленте, скорость подстраивается под длину
 * списка сама. Логотип не обязателен: если файла нет, в ленте встанет
 * название, набранное шрифтом сайта, — так блок можно заполнить сразу,
 * не дожидаясь, пока клиенты пришлют SVG.
 *
 * Галочка разрешения остаётся обязательной и для логотипа, и для одного
 * названия: и то и другое публично называет клиента. Половина дел фирмы —
 * ликвидация, ВЛК и семейные споры, где анонимность входит в услугу.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Налаштування сайту',
  type: 'document',
  groups: [
    { name: 'figures', title: 'Цифри', default: true },
    { name: 'trust', title: 'Нам довіряють' },
    { name: 'contacts', title: 'Контакти' },
  ],
  fields: [
    /* ── цифры ── */
    defineField({
      name: 'figures',
      title: 'Цифри на головній',
      type: 'array',
      group: 'figures',
      validation: (r) => r.max(3).error('На головній три цифри — четверта ламає сітку'),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'figure',
          fields: [
            defineField({ name: 'value', title: 'Число', type: 'number', validation: (r) => r.required() }),
            defineField({ name: 'suffix', title: 'Після числа', type: 'string', description: 'Напр. «+»' }),
            defineField({ name: 'unit', title: 'Одиниця', type: 'localeString', description: 'Напр. «млн ₴»' }),
            defineField({ name: 'label', title: 'Підпис', type: 'localeString', validation: (r) => r.required() }),
          ],
          preview: {
            select: { v: 'value', s: 'suffix', l: 'label.ua' },
            prepare: ({ v, s, l }) => ({ title: `${v ?? '—'}${s ?? ''}`, subtitle: l }),
          },
        }),
      ],
    }),

    /* ── доверие ──
       Весь текст блока, а не только лента. Заголовок, вступ и шість
       цифр раніше лежали в коді: поля trustHeading і trustIntro тут
       були, але жоден запит їх не читав, тому правка в студії нічого
       не змінювала. Тепер читаються всі. */
    defineField({
      name: 'trustEyebrow',
      title: 'Надзаголовок',
      type: 'localeString',
      group: 'trust',
      description: 'Дрібний рядок над заголовком.',
      initialValue: { _type: 'localeString', ua: 'Нам довіряють' },
    }),
    defineField({
      name: 'trustHeading',
      title: 'Заголовок блоку',
      type: 'localeString',
      group: 'trust',
      description:
        'Раніше сайт сам перемикав заголовок залежно від кількості клієнтів у стрічці. ' +
        'Тепер поле редагується, і підміна зайва: пишіть те, що має стояти. ' +
        'Коли логотипів набереться достатньо, тут доречно «Компанії, які довіряють нам свої справи».',
      validation: (r) => r.custom(localeMax(120)),
    }),
    defineField({
      name: 'trustIntro',
      title: 'Вступний текст',
      type: 'localeText',
      group: 'trust',
      description:
        'Абзац під заголовком. **Жирним** виділяються частини всередині. ' +
        'Якщо поле заповнити й потім очистити — абзацу на сайті не буде: ' +
        'це навмисно, щоб текст «ми не показуємо клієнтів без їхньої згоди» ' +
        'можна було зняти, коли логотипів набереться достатньо.',
    }),
    defineField({
      name: 'trustFacts',
      title: 'Цифри, які можна перевірити',
      type: 'array',
      group: 'trust',
      description:
        'Сітка під стрічкою. Шість записів заповнюють її рівно; більше й менше теж працюють, ' +
        'сітка підлаштується. Порожньо — і сітки не буде, залишиться стрічка й фотографія.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'fact',
          fields: [
            /* value НЕ локализовано намеренно. На старом сайте цифры
               лежали в переводах как текст и разошлись: українська
               обіцяла 400 процесів, англійська — 15 500. Одне поле на
               всі локалі робить таке розходження неможливим. Одиниця
               («млн ₴») набирається тут же: вона частина числа, а не
               окреме слово, яке треба узгоджувати. */
            defineField({
              name: 'value',
              title: 'Число',
              type: 'string',
              description:
                'Одне значення на всі мови — напр. «2007», «300+», «150 млн ₴». ' +
                'Не перекладається: саме роздільні переклади чисел і розійшлися на старому сайті.',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'label',
              title: 'Підпис',
              type: 'localeString',
              description: 'Що це за число. Напр. «ліквідованих підприємств».',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'note',
              title: 'Уточнення',
              type: 'localeString',
              description: 'Дрібним під підписом. Напр. «Основна практика фірми».',
            }),
          ],
          preview: {
            select: { title: 'value', subtitle: 'label.ua' },
          },
        }),
      ],
    }),
    defineField({
      name: 'clients',
      title: 'Клієнти в стрічці',
      type: 'array',
      group: 'trust',
      description:
        'Рухомий рядок на головній, на «Про компанію» і на сторінках напрямів — один список ' +
        'на всі три. Порядок тут = порядок у стрічці, швидкість підлаштовується під довжину ' +
        'списку сама. Порожньо — і стрічки не буде, залишаться перевірювані факти нижче; ' +
        'це нормальний і безпечний стан. До чотирьох записів між ними стає ромб-такт, ' +
        'щоб повтори читались як орнамент, а не як збій.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'client',
          fields: [
            defineField({ name: 'name', title: 'Назва компанії', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'logo',
              title: 'Логотип',
              type: 'image',
              description:
                'Не обовʼязково. SVG або PNG на прозорому тлі, висотою від 80 px. ' +
                'Якщо файлу немає — у стрічці стане назва, набрана шрифтом сайта.',
            }),
            defineField({
              name: 'url',
              title: 'Сайт клієнта',
              type: 'url',
              description: 'Не обовʼязково. Якщо вказано, запис у стрічці стає посиланням.',
            }),
            defineField({
              name: 'permission',
              title: 'Клієнт дозволив згадувати його публічно',
              type: 'boolean',
              initialValue: false,
              description:
                'Без цієї галочки запис на сайт НЕ потрапляє — ні логотип, ні сама назва. ' +
                'Публічна згадка клієнта юридичної фірми потребує його згоди, а чужа торгова ' +
                'марка без дозволу власника — це претензія, а не соціальний доказ.',
              validation: (r) =>
                r.custom((v) => (v === true ? true : 'Поки дозволу немає, запис не буде показаний на сайті')).warning(),
            }),
            defineField({ name: 'note', title: 'Що робили для клієнта', type: 'localeString' }),
          ],
          preview: {
            select: { title: 'name', media: 'logo', ok: 'permission', note: 'note.ua' },
            prepare: ({ title, media, ok, note }) => ({
              title: ok ? title : `${title} — без дозволу, не показується`,
              subtitle: note,
              media,
            }),
          },
        }),
      ],
    }),

    /* ── контакты ── */
    defineField({ name: 'phone', title: 'Телефон', type: 'string', group: 'contacts' }),
    defineField({ name: 'email', title: 'Пошта', type: 'string', group: 'contacts' }),
    defineField({ name: 'address', title: 'Адреса', type: 'localeString', group: 'contacts' }),
    defineField({ name: 'hours', title: 'Години роботи', type: 'localeString', group: 'contacts' }),
    defineField({
      name: 'messengers',
      title: 'Месенджери',
      type: 'array',
      group: 'contacts',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'messenger',
          fields: [
            defineField({
              name: 'channel',
              title: 'Канал',
              type: 'string',
              options: { list: ['telegram', 'viber', 'whatsapp'] },
              validation: (r) => r.required(),
            }),
            defineField({ name: 'href', title: 'Посилання', type: 'url', validation: (r) => r.required() }),
          ],
          preview: { select: { title: 'channel', subtitle: 'href' } },
        }),
      ],
    }),
  ],

  preview: { prepare: () => ({ title: 'Налаштування сайту' }) },
})
