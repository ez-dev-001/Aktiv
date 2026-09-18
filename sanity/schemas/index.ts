import { localeString, localeText, localeBlock } from './objects/locale'
import { priceSpec } from './objects/priceSpec'
import { tenet, tenetBlock } from './objects/tenet'
import { practice } from './documents/practice'
import { practiceCategory } from './documents/practiceCategory'
import { quiz } from './documents/quiz'
import { teamMember } from './documents/teamMember'
import { post } from './documents/post'
import { siteSettings } from './documents/siteSettings'
import { homePage } from './documents/homePage'
import { aboutPage } from './documents/aboutPage'
import { teamPage } from './documents/teamPage'

/**
 * Регистрация схем. Каждый тип, на который где-либо есть ссылка,
 * обязан быть в этом массиве — иначе студия падает на старте
 * с «Unknown type», а TypeScript этого не ловит: для него
 * `to: [{ type: 'teamMember' }]` просто строка.
 *
 * Сторож: `npm run check:schema` — проверяет соответствие статически.
 *
 * siteSettings держит три цифры счётчиков одним источником на три
 * локали — на старом сайте они разошлись (UA: 400 процессов, EN: 15 500),
 * потому что лежали в переводах как текст.
 *
 * Ещё не написан: page (произвольные страницы) — понадобится, когда
 * появятся «Кар'єра» и юридические тексты.
 */
export const schemaTypes = [
  /* объекты */
  localeString,
  localeText,
  localeBlock,
  priceSpec,
  /* Пункт «заголовок + абзац» и блок «надзаголовок + твердження +
     абзац». Общие для цінностей, принципів, місії и візії — один тип
     вместо четырёх почти одинаковых. */
  tenet,
  tenetBlock,
  /* документы */
  practiceCategory,
  practice,
  teamMember,
  quiz,
  post,
  siteSettings,
  /* homePage — текст самой главной. Отдельно от siteSettings: там
     настройки на весь сайт, здесь текст одной страницы, и правят их
     в разные моменты. */
  homePage,
  /* aboutPage — «Про компанію»: місія, візія, цінності, принципи.
     Цифры и блок довіри сюда не дублируются: они общие и живут в
     siteSettings. */
  aboutPage,
  /* teamPage — обрамление страницы «Команда»: заголовки, блок про
     приватного исполнителя, призыв. Сами люди — в teamMember: их
     заводят и убирают независимо от того, как написан заголовок. */
  teamPage,
]
