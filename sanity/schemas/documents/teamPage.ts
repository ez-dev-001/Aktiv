import { defineField, defineType } from 'sanity'
import { localeMax } from '../objects/locale'

/**
 * teamPage — текст страницы «Команда». Один документ на весь сайт.
 *
 * ── Что здесь и чего здесь НЕТ ──
 * Здесь только обрамление: заголовки, вступления, блок о выделенном
 * сотруднике, призыв в конце. Самих людей тут нет — они
 * живут в отдельном типе «Команда» (teamMember), и правильно, что
 * отдельно: специалиста заводят, переводят и убирают независимо от
 * того, как написан заголовок страницы.
 *
 * ── Подстановки в фигурных скобках ──
 * Три места на этой странице обязаны совпадать с реальными данными,
 * и отдавать их на ручной ввод нельзя — они протухнут молча:
 *
 *   {n}    — сколько специалистов в Sanity прямо сейчас
 *   {name} — имя выделенного сотрудника
 *   {role} — его должность, строчными буквами
 *
 * Редактор пишет обычный текст и ставит скобку там, где нужна
 * величина. «Команда · {n} фахівців» останется верным и после того,
 * как в команду добавят одиннадцатого человека, а «Команда · 10
 * фахівців» — нет.
 *
 * Скобка, для которой нет значения, остаётся видимой как есть. Это
 * намеренно: молча стереть её означало бы выпустить на сайт фразу с
 * дырой посередине, а так ошибка заметна с первого взгляда.
 *
 * ── Блок «Виділений співробітник» ──
 * Раньше он назывался «Приватний виконавець» и был про одного человека.
 * Теперь это блок о любом сотруднике, которого нужно показать отдельно:
 * исполнитель, управляющий партнёр, новый адвокат по военному праву.
 * Кого показать — решает галочка «Виділений співробітник» в карточке
 * человека в «Команді»; имя и должность подставляются сами.
 *
 * Внутренние имена полей (executorKicker, executorTitle, executorText)
 * остались прежними НАМЕРЕННО. Переименование поля в схеме не переносит
 * данные: уже набранный в студии текст остался бы под старым именем,
 * студия показала бы его как «Unknown field», а на сайте блок откатился
 * бы к тексту из кода. Имя поля видит только разработчик, редактор
 * видит заголовок — его и поменяли.
 */
export const teamPage = defineType({
  name: 'teamPage',
  title: 'Сторінка «Команда»',
  type: 'document',
  groups: [
    { name: 'head', title: 'Перший екран', default: true },
    { name: 'executor', title: 'Виділений співробітник' },
    { name: 'people', title: 'Список фахівців' },
    { name: 'cta', title: 'Заклик у кінці' },
  ],

  fields: [
    /* ═══════════ ПЕРВЫЙ ЭКРАН ═══════════ */
    defineField({
      name: 'headEyebrow',
      title: 'Надзаголовок',
      type: 'localeString',
      group: 'head',
      description:
        '{n} підставить кількість фахівців із Sanity. Напр. «Команда · {n} фахівців» — ' +
        'рядок залишиться правильним і після того, як команда зміниться.',
      validation: (r) => r.custom(localeMax(70)),
    }),
    defineField({
      name: 'headTitle',
      title: 'Заголовок — перша частина',
      type: 'localeString',
      group: 'head',
      validation: (r) => r.custom(localeMax(90)),
    }),
    defineField({
      name: 'headTitleAccent',
      title: 'Заголовок — акцентна частина',
      type: 'localeString',
      group: 'head',
      description: 'Курсивом в акцентному кольорі. Окреме поле, бо курсив тут — прийом.',
      validation: (r) => r.custom(localeMax(70)),
    }),
    defineField({
      name: 'headLede',
      title: 'Підзаголовок',
      type: 'localeText',
      group: 'head',
      description: '**Жирним** виділяються частини всередині.',
      validation: (r) => r.custom(localeMax(280)),
    }),

    /* ═══════════ ВИДІЛЕНИЙ СПІВРОБІТНИК ═══════════ */
    defineField({
      name: 'executorKicker',
      title: 'Надзаголовок',
      type: 'localeString',
      group: 'executor',
      description:
        'Дрібний рядок над блоком — навіщо ця людина показана окремо. ' +
        'Напр. «Чому доводимо до кінця» для виконавця або «Хто веде військові справи» для адвоката.',
      validation: (r) => r.custom(localeMax(50)),
    }),
    defineField({
      name: 'executorTitle',
      title: 'Заголовок',
      type: 'localeString',
      group: 'executor',
      description:
        '{name} і {role} підставляться з картки того співробітника, у якого в «Команді» ' +
        'стоїть галочка «Виділений співробітник». Напр. «{name} — {role} у штаті». ' +
        'Змінили людину — заголовок зміниться сам.',
      validation: (r) => r.custom(localeMax(90)),
    }),
    defineField({
      name: 'executorText',
      title: 'Текст',
      type: 'localeText',
      group: 'executor',
      description:
        'Чому саме ця людина важлива для клієнта. **Жирним** виділяються частини всередині. ' +
        'Змінюючи співробітника, не забудьте переписати й цей текст — він про конкретну людину. ' +
        'Блок цілком зникає зі сторінки, якщо нікого не виділено.',
      validation: (r) => r.custom(localeMax(420)),
    }),

    /* ═══════════ СПИСОК ФАХІВЦІВ ═══════════ */
    defineField({ name: 'peopleEyebrow', title: 'Надзаголовок', type: 'localeString', group: 'people' }),
    defineField({
      name: 'peopleTitle',
      title: 'Заголовок блоку',
      type: 'localeString',
      group: 'people',
      validation: (r) => r.custom(localeMax(120)),
    }),
    defineField({ name: 'peopleLede', title: 'Вступний текст', type: 'localeText', group: 'people' }),
    defineField({
      name: 'noPhotoNote',
      title: 'Примітка про відсутні фото',
      type: 'localeText',
      group: 'people',
      description:
        'Показується, лише поки хоч у когось із команди немає фото, і зникає сама, ' +
        'коли фотографії завантажать. Порожньо — примітки не буде взагалі.',
      validation: (r) => r.custom(localeMax(300)),
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
      validation: (r) => r.custom(localeMax(220)),
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
      description: 'Веде на сторінку «Про компанію».',
      validation: (r) => r.custom(localeMax(34)),
    }),
  ],

  preview: { prepare: () => ({ title: 'Сторінка «Команда»' }) },
})
