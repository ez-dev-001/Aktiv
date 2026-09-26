import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

/** Документы, которых на сайте существует ровно по одному. */
const SINGLETONS = ['siteSettings', 'homePage', 'aboutPage', 'teamPage', 'careerPage'] as const

/**
 * Один конфиг на две среды: студию (`npm run studio`) и будущий
 * клиент на сайте. Поэтому projectId читается из обеих переменных —
 * SANITY_STUDIO_* видит CLI студии, NEXT_PUBLIC_* видит Next.
 */
const projectId =
  process.env.SANITY_STUDIO_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset =
  process.env.SANITY_STUDIO_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export default defineConfig({
  name: 'aktiv',
  title: 'ЮК «АКТИВ»',
  projectId,
  dataset,
  plugins: [
    structureTool({
      /* ── Своё дерево вместо алфавитного списка типов ──
         По умолчанию студия показывает все типы одним списком, и
         «Головна сторінка» встаёт между «Блог» и «Команда» как
         обычная коллекция — с кнопкой «создать», хотя создавать
         второй экземпляр нечего. Здесь синглтоны открываются сразу
         документом, а не списком из одного элемента. */
      structure: (S) =>
        S.list()
          .title('Контент')
          .items([
            S.listItem()
              .title('Головна сторінка')
              .id('homePage')
              .child(S.document().schemaType('homePage').documentId('homePage')),
            S.listItem()
              .title('Сторінка «Про компанію»')
              .id('aboutPage')
              .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
            S.listItem()
              .title('Сторінка «Команда»')
              .id('teamPage')
              .child(S.document().schemaType('teamPage').documentId('teamPage')),
            S.listItem()
              .title('Сторінка «Карʼєра»')
              .id('careerPage')
              .child(S.document().schemaType('careerPage').documentId('careerPage')),
            S.listItem()
              .title('Налаштування сайту')
              .id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            S.documentTypeListItem('practiceCategory').title('Напрями'),
            S.documentTypeListItem('practice').title('Практики'),
            S.documentTypeListItem('teamMember').title('Команда'),
            S.documentTypeListItem('vacancy').title('Вакансії'),
            S.documentTypeListItem('post').title('Блог'),
          ]),
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },

  document: {
    /* Синглтоны нельзя создавать из меню «+»: второй siteSettings или
       второй homePage GROQ просто не увидит — запросы берут [0], и
       редактор потом полдня ищет, почему правки не доезжают. */
    newDocumentOptions: (prev) =>
      prev.filter((t) => !(SINGLETONS as readonly string[]).includes(t.templateId)),

    /* И удалять их тоже незачем: страница без документа падает на
       статику, но редактор увидит это как «мои тексты исчезли». */
    actions: (prev, { schemaType }) =>
      (SINGLETONS as readonly string[]).includes(schemaType)
        ? prev.filter(({ action }) => action !== 'delete' && action !== 'duplicate')
        : prev,
  },
})
