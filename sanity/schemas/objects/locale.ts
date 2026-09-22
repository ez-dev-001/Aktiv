import { defineField, defineType } from 'sanity'

/**
 * Локализация ua / en.
 *
 * Старый сайт был трёхъязычным через отдельные WP-записи на каждый язык —
 * отсюда 103 URL практик на 37 сущностей и расхождение цифр между версиями
 * (UA обещает 400 процессов, EN — 15 500). Здесь язык это поле, а не документ,
 * поэтому число живёт в одном месте и не может разойтись между локалями.
 *
 * Обязателен только украинский: релиз не должен ждать переводов.
 * Переводы схлопнуты в collapsed-fieldset, чтобы не мешать в студии.
 */
export const LANGS = [
  { id: 'ua', title: 'Українська', isDefault: true },
  { id: 'en', title: 'English', isDefault: false },
] as const

/* ── Куда делся русский ──
   Русская версия сайта убрана, и поле ru убрано вслед за ней: иначе
   редактор продолжал бы видеть и заполнять перевод, который сайт больше
   нигде не показывает.

   Если в каком-то документе ru уже было заполнено, студия покажет у
   поля пометку «Unknown field» с кнопкой удалить. Это не ошибка и
   публикацию не блокирует: данные просто лежат без дела. Сайт их не
   читает — запросы берут [$lang] с откатом на ua, а $lang теперь
   бывает только ua или en. */

export type Lang = (typeof LANGS)[number]['id']

export const DEFAULT_LANG: Lang = 'ua'

/**
 * Ограничение длины для локализованного поля.
 *
 * Почему нельзя просто `.max(70)`. localeString и localeText — это
 * ОБЪЕКТЫ с полями ua/en, а не строки. У объекта в Sanity нет
 * валидатора max, и студия падает с «Validator for flag "max" not
 * found for type "Object"» — причём падает на публикации, то есть
 * документ вообще нельзя сохранить в опубликованные.
 *
 * Здесь длина проверяется у каждого языка отдельно, и сообщение
 * называет, какой именно перебрал: «en — 84 знаки» полезнее, чем
 * «задовго».
 */
export const localeMax =
  (limit: number) =>
  (value: unknown): true | string => {
    if (!value || typeof value !== 'object') return true
    const v = value as Record<string, unknown>
    const over = LANGS.map((l) => l.id)
      .map((id) => ({ id, len: typeof v[id] === 'string' ? (v[id] as string).length : 0 }))
      .filter((x) => x.len > limit)
    if (over.length === 0) return true
    return `Задовго (максимум ${limit}): ${over.map((x) => `${x.id} — ${x.len}`).join(', ')}`
  }

const fieldsets = [
  { name: 'translations', title: 'Переклади', options: { collapsible: true, collapsed: true } },
]

export const localeString = defineType({
  name: 'localeString',
  title: 'Рядок',
  type: 'object',
  fieldsets,
  fields: LANGS.map((l) =>
    defineField({
      name: l.id,
      title: l.title,
      type: 'string',
      validation: l.isDefault ? (rule) => rule.required() : undefined,
      fieldset: l.isDefault ? undefined : 'translations',
    }),
  ),
  preview: { select: { title: 'ua' } },
})

export const localeText = defineType({
  name: 'localeText',
  title: 'Текст',
  type: 'object',
  fieldsets,
  fields: LANGS.map((l) =>
    defineField({
      name: l.id,
      title: l.title,
      type: 'text',
      rows: 3,
      validation: l.isDefault ? (rule) => rule.required() : undefined,
      fieldset: l.isDefault ? undefined : 'translations',
    }),
  ),
  preview: { select: { title: 'ua' } },
})

export const localeBlock = defineType({
  name: 'localeBlock',
  title: 'Контент',
  type: 'object',
  fieldsets,
  fields: LANGS.map((l) =>
    defineField({
      name: l.id,
      title: l.title,
      type: 'array',
      of: [{ type: 'block' }],
      fieldset: l.isDefault ? undefined : 'translations',
    }),
  ),
})
