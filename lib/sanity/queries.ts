import { groq } from 'next-sanity'

/**
 * GROQ-запросы.
 *
 * ВАЖНО: локализованные поля (localeString) — это объекты
 * { _type, ua, en }. Проецировать их целиком нельзя: наружу уедет
 * объект, а компонент ждёт строку, и React упадёт с «Objects are not
 * valid as a React child». Поэтому — через coalesce.
 *
 * coalesce(field[$lang], field.ua) — правило локализации всего сайта:
 * если перевода нет, показываем украинский, а не пустоту. Именно поэтому
 * в схеме обязателен только ua: релиз не ждёт переводчика.
 */

export const CATEGORIES_QUERY = groq`
*[_type == "practiceCategory"] | order(order asc) {
  "slug": slug.current,
  "title": coalesce(title[$lang], title.ua),
  "excerpt": coalesce(excerpt[$lang], excerpt.ua),
  "seoTitle": coalesce(seoTitle[$lang], seoTitle.ua),
  "seoDescription": coalesce(seoDescription[$lang], seoDescription.ua),
  icon,
  order,
  "photo": photo{
    asset, crop, hotspot, alt,
    "lqip": asset->metadata.lqip,
    "ratio": asset->metadata.dimensions.aspectRatio
  },
  "practices": *[_type == "practice" && references(^._id)] | order(order asc) {
    "slug": slug.current,
    "title": coalesce(title[$lang], title.ua),
    "excerpt": coalesce(excerpt[$lang], excerpt.ua),
    "legacyPath": legacyPaths[0]
  }
}`

/** Диагностика: сколько документов каждого типа лежит в датасете. */
export const COUNTS_QUERY = groq`{
  "practiceCategory": count(*[_type == "practiceCategory"]),
  "practice":         count(*[_type == "practice"]),
  "withoutCategory":  count(*[_type == "practice" && !defined(category)])
}`

/**
 * Время последней правки в датасете.
 *
 * Нужен, чтобы измерить отставание кеша числом, а не на глаз: один и
 * тот же запрос идёт через CDN и в обход него, и разница во времени —
 * это ровно то, на сколько сайт отстал от студии.
 */
export const FRESHNESS_QUERY = groq`*[!(_id in path("drafts.**"))] | order(_updatedAt desc)[0]._updatedAt`

/** Самый дешёвый возможный запрос — проверка, что датасет вообще отвечает. */
export const PING_QUERY = groq`count(*[!(_id in path("drafts.**"))])`

/**
 * Опубликованное против черновиков.
 *
 * Клиент сайта ходит с perspective: 'published', то есть черновиков
 * не видит вовсе. Документ, созданный в студии и НЕ опубликованный,
 * с точки зрения сайта не существует — и это вторая по частоте
 * причина «сайт не берёт контент». Запрос считает и то и другое,
 * поэтому разницу видно числом.
 *
 * Черновики видны только с токеном: без него drafts всегда 0.
 */
export const DRAFTS_QUERY = groq`{
  "published": count(*[!(_id in path("drafts.**")) && _type in ["practiceCategory","practice","post","teamMember","siteSettings","homePage","aboutPage","teamPage"]]),
  "drafts":    count(*[_id in path("drafts.**") && _type in ["practiceCategory","practice","post","teamMember","siteSettings","homePage","aboutPage","teamPage"]]),
  "byType": {
    "practiceCategory": count(*[_type == "practiceCategory" && !(_id in path("drafts.**"))]),
    "practice":         count(*[_type == "practice" && !(_id in path("drafts.**"))]),
    "post":             count(*[_type == "post" && !(_id in path("drafts.**"))]),
    "teamMember":       count(*[_type == "teamMember" && !(_id in path("drafts.**"))]),
    "siteSettings":     count(*[_type == "siteSettings" && !(_id in path("drafts.**"))]),
    "homePage":         count(*[_type == "homePage" && !(_id in path("drafts.**"))]),
    "aboutPage":        count(*[_type == "aboutPage" && !(_id in path("drafts.**"))]),
    "teamPage":         count(*[_type == "teamPage" && !(_id in path("drafts.**"))])
  }
}`

/*
 * Обложка статьи (cover) во всех трёх запросах блога.
 *
 * Поле «Обкладинка» в схеме было с самого начала, редактор мог
 * загружать картинку — но ни один запрос её не забирал, и на сайте она
 * не появлялась нигде. Та же история, что с заголовком «Нам довіряють»:
 * поле, которое выглядит подключённым, но никем не читается.
 *
 * Берётся не asset->url, а сам объект картинки: ссылка на файл, кадр и
 * точка фокуса. По ним lib/sanity/image.ts строит адрес нужного размера
 * с правильным кадрированием. lqip — крошечное размытое превью, которое
 * Sanity считает при загрузке: оно лежит под фото, пока то грузится.
 */
export const POSTS_QUERY = groq`
*[_type == "post" && defined(slug.current)] | order(publishedAt desc) [0...$limit] {
  "slug": slug.current,
  "title": coalesce(title[$lang], title.ua),
  "excerpt": coalesce(excerpt[$lang], excerpt.ua),
  category,
  publishedAt,
  "cover": cover{ asset, crop, hotspot, alt, "lqip": asset->metadata.lqip },
  "author": author->name.ua
}`

/**
 * Команда.
 *
 * photo.asset->url отдаёт оригинал; параметры кадрирования вешаются
 * в JS, потому что размер зависит от места — карточка на главной
 * и крупный блок на /team просят разные ширины.
 *
 * areas — категории практик человека из двух мест: его поле
 * «Практики» и практики, где он стоит «відповідальним адвокатом».
 * Дубли и пустые убирает сайт (lib/sanity/content.ts, practiceLine).
 * Названия категорий — на украинском: подпись короткая, а в EN-версии
 * категории всё равно пока не переведены.
 */
export const TEAM_QUERY = groq`
*[_type == "teamMember"] | order(order asc) {
  "slug": slug.current,
  "name": coalesce(name[$lang], name.ua),
  "role": coalesce(role[$lang], role.ua),
  kind,
  highlight,
  phone,
  email,
  "bio": coalesce(bio[$lang], bio.ua),
  "photoUrl": photo.asset->url,
  "practiceNote": coalesce(practiceNote[$lang], practiceNote.ua),
  "areas": array::unique(
    (practices[]->category->title.ua) +
    (*[_type == "practice" && references(^._id)].category->title.ua)
  ),
  "practiceList": *[_type == "practice" && defined(slug.current) && (_id in ^.practices[]._ref || references(^._id))] | order(order asc) {
    "slug": slug.current,
    "title": coalesce(title[$lang], title.ua),
    "cat": category->slug.current
  }
}`

/** Контакты: один документ настроек на весь сайт. */
export const CONTACTS_QUERY = groq`
*[_type == "siteSettings"][0] {
  phone,
  email,
  "address": coalesce(address[$lang], address.ua),
  "street":  coalesce(street[$lang], street.ua),
  "unit":    coalesce(unit[$lang], unit.ua),
  "city":    coalesce(city[$lang], city.ua),
  "hours":   coalesce(hours[$lang], hours.ua),
  mapQuery,
  "officeHint": coalesce(officeHint[$lang], officeHint.ua),
  "messengers": messengers[]{ channel, href }
}`

/** Три цифры счётчиков — одно поле на все локали, см. siteSettings. */
export const FIGURES_QUERY = groq`
*[_type == "siteSettings"][0].figures[] {
  value,
  suffix,
  "unit":  coalesce(unit[$lang], unit.ua),
  "label": coalesce(label[$lang], label.ua)
}`

/**
 * Блок «Нам довіряють» целиком: текст, цифры и лента одним запросом.
 *
 * Раньше запрос брал только clients, а заголовок, вступный абзац и
 * шесть цифр жили в коде — при этом поля trustHeading и trustIntro
 * в схеме БЫЛИ. Редактор их правил, и не менялось ничего: их никто
 * не читал. Худший вид неподключённости — тот, который выглядит
 * подключённым.
 *
 * Логотипы и названия клиентов отдаются ТОЛЬКО с подтверждённым
 * разрешением: фильтр стоит здесь, в GROQ, а не в компоненте, —
 * запись без галочки не доезжает до кода вообще.
 *
 * introDefined отличает «поле никогда не заводили» от «поле очистили
 * намеренно». Без этого признака пустой trustIntro выглядел бы
 * одинаково в двух совершенно разных случаях, и выбрать между
 * «подставь статику» и «абзаца не должно быть» было бы нечем.
 *
 * ── Почему комментариев нет ВНУТРИ запроса ──
 * GROQ не понимает ни блочных комментариев, ни строчных, ни #.
 * Комментарий внутри обратных
 * кавычек уезжает на сервер как часть запроса, тот отвечает parse
 * error, sanityFetch возвращает null — и блок молча падает на
 * статику. Выглядит это как «Sanity не подключён», хотя подключено
 * всё. Ровно так и случилось здесь. Сторож: npm run check:schema.
 */
export const TRUST_QUERY = groq`
*[_type == "siteSettings"][0] {
  "eyebrow": coalesce(trustEyebrow[$lang], trustEyebrow.ua),
  "heading": coalesce(trustHeading[$lang], trustHeading.ua),
  "text": coalesce(trustText[$lang], trustText.ua),
  "facts": trustFacts[] {
    value,
    "label": coalesce(label[$lang], label.ua)
  },
  "clients": clients[permission == true] {
    name,
    url,
    "logoUrl": logo.asset->url,
    "note": coalesce(note[$lang], note.ua)
  }
}`

/** Одна практика со всей структурой услуги. */
export const PRACTICE_QUERY = groq`
*[_type == "practice" && slug.current == $slug][0] {
  "slug": slug.current,
  "title": coalesce(title[$lang], title.ua),
  "excerpt": coalesce(excerpt[$lang], excerpt.ua),
  "seoTitle": coalesce(seoTitle[$lang], seoTitle.ua),
  "seoDescription": coalesce(seoDescription[$lang], seoDescription.ua),
  icon,
  "body": coalesce(body[$lang], body.ua),
  "includes": includes[]{ "text": coalesce(@[$lang], @.ua) }.text,
  "packages": packages[]{
    "name": coalesce(name[$lang], name.ua),
    "audience": audience[]{ "text": coalesce(@[$lang], @.ua) }.text,
    "includes": includes[]{ "text": coalesce(@[$lang], @.ua) }.text,
    "note": coalesce(note[$lang], note.ua)
  },
  "stages": stages[]{
    "title":    coalesce(title[$lang], title.ua),
    "text":     coalesce(text[$lang], text.ua),
    "duration": coalesce(duration[$lang], duration.ua)
  },
  "faq": faq[]{
    "q": coalesce(q[$lang], q.ua),
    "a": coalesce(a[$lang], a.ua)
  },
  "lawyers": lawyers[]->{
    "name": coalesce(name[$lang], name.ua),
    "role": coalesce(role[$lang], role.ua),
    kind
  },
  "category": category->{
    "slug": slug.current,
    "title": coalesce(title[$lang], title.ua)
  },
  "related": *[_type == "post" && references(^._id)] | order(publishedAt desc)[0...3] {
    "slug": slug.current,
    "title": coalesce(title[$lang], title.ua),
    category, publishedAt
  }
}`

/** Лента блога с фильтром по рубрике. $cat = "" означает «все». */
export const BLOG_QUERY = groq`
*[_type == "post" && defined(slug.current) && ($cat == "" || category == $cat)]
  | order(publishedAt desc) [0...$limit] {
  "slug": slug.current,
  "title": coalesce(title[$lang], title.ua),
  "excerpt": coalesce(excerpt[$lang], excerpt.ua),
  category, publishedAt,
  "cover": cover{ asset, crop, hotspot, alt, "lqip": asset->metadata.lqip },
  "author": author->name.ua
}`

export const POST_QUERY = groq`
*[_type == "post" && slug.current == $slug][0] {
  "slug": slug.current,
  "title": coalesce(title[$lang], title.ua),
  "excerpt": coalesce(excerpt[$lang], excerpt.ua),
  "seoTitle": coalesce(seoTitle[$lang], seoTitle.ua),
  "seoDescription": coalesce(seoDescription[$lang], seoDescription.ua),
  "body": coalesce(body[$lang], body.ua),
  category, publishedAt,
  "cover": cover{ asset, crop, hotspot, alt, "lqip": asset->metadata.lqip },
  "author": author->{ "name": coalesce(name[$lang], name.ua), "role": coalesce(role[$lang], role.ua) },
  "practices": practices[]->{ "slug": slug.current, "title": coalesce(title[$lang], title.ua), "category": category->slug.current }
}`

export const POST_SLUGS_QUERY = groq`*[_type == "post" && defined(slug.current)].slug.current`

/**
 * Текст главной страницы.
 *
 * Все поля опциональные и проецируются по одному. Это сознательно:
 * заполненный герой при пустом кредо — рабочее состояние, а не
 * половина страницы. Собирать блоки в объекты (`hero { ... }`) было бы
 * короче, но тогда пустой объект пришёл бы как `null`, и фолбэк
 * срабатывал бы на весь блок целиком вместо отдельного поля.
 *
 * Внутри каждого блока порядок массива = порядок на экране, нумерация
 * (правила кредо, станции пути) считается на отрисовке.
 */
export const HOME_QUERY = groq`
*[_type == "homePage"][0] {
  "heroEyebrow":      coalesce(heroEyebrow[$lang], heroEyebrow.ua),
  "heroTitle":        coalesce(heroTitle[$lang], heroTitle.ua),
  "heroTitleAccent":  coalesce(heroTitleAccent[$lang], heroTitleAccent.ua),
  "heroCtaPrimary":   coalesce(heroCtaPrimary[$lang], heroCtaPrimary.ua),
  "heroCtaSecondary": coalesce(heroCtaSecondary[$lang], heroCtaSecondary.ua),

  "heroHeading":      coalesce(heroHeading[$lang], heroHeading.ua),
  "heroHeadingAccent": coalesce(heroHeadingAccent[$lang], heroHeadingAccent.ua),
  "heroLede":         coalesce(heroLede[$lang], heroLede.ua),

  "credo": credo[] {
    "title": coalesce(title[$lang], title.ua)
  },

  "teamTitle": coalesce(teamTitle[$lang], teamTitle.ua),
  "teamQuote": coalesce(teamQuote[$lang], teamQuote.ua),
  "teamText": coalesce(teamText[$lang], teamText.ua),
  "practicesText": coalesce(practicesText[$lang], practicesText.ua),
  "teamQuoteAuthor": teamQuoteAuthor-> {
    "name": coalesce(name[$lang], name.ua),
    "role": coalesce(role[$lang], role.ua),
    "photoUrl": photo.asset->url
  }
}`

/**
 * Текст страницы «Про компанію».
 *
 * Поля проецируются по одному, как и у главной: заполненный первый
 * экран при пустых принципах — рабочее состояние, а не половина
 * страницы. Собирать блоки в объекты было бы короче, но пустой объект
 * приходит как null, и фолбэк срабатывал бы на весь блок целиком
 * вместо отдельного поля.
 *
 * Цифр-счётчиков и блока довіри здесь нет: они общие и берутся из
 * siteSettings. Второе место для одной и той же цифры — это гарантия,
 * что однажды они разойдутся.
 *
 * Внутри запроса комментариев быть не может — GROQ их не понимает.
 * Сторож: npm run check:groq.
 */
export const ABOUT_QUERY = groq`
*[_type == "aboutPage"][0] {
  "headEyebrow":     coalesce(headEyebrow[$lang], headEyebrow.ua),
  "headTitle":       coalesce(headTitle[$lang], headTitle.ua),
  "headTitleAccent": coalesce(headTitleAccent[$lang], headTitleAccent.ua),
  "headLede":        coalesce(headLede[$lang], headLede.ua),
  "headFacts": headFacts[] {
    "kicker": coalesce(kicker[$lang], kicker.ua),
    "value":  coalesce(value[$lang], value.ua),
    "note":   coalesce(note[$lang], note.ua)
  },

  "mission": mission {
    "eyebrow":   coalesce(eyebrow[$lang], eyebrow.ua),
    "statement": coalesce(statement[$lang], statement.ua),
    "text":      coalesce(text[$lang], text.ua)
  },
  "vision": vision {
    "eyebrow":   coalesce(eyebrow[$lang], eyebrow.ua),
    "statement": coalesce(statement[$lang], statement.ua),
    "text":      coalesce(text[$lang], text.ua)
  },

  "valuesEyebrow": coalesce(valuesEyebrow[$lang], valuesEyebrow.ua),
  "valuesTitle":   coalesce(valuesTitle[$lang], valuesTitle.ua),
  "valuesLede":    coalesce(valuesLede[$lang], valuesLede.ua),
  "values": values[] {
    "title": coalesce(title[$lang], title.ua),
    "text":  coalesce(text[$lang], text.ua),
    icon
  },

  "principlesEyebrow": coalesce(principlesEyebrow[$lang], principlesEyebrow.ua),
  "principlesTitle":   coalesce(principlesTitle[$lang], principlesTitle.ua),
  "principlesLede":    coalesce(principlesLede[$lang], principlesLede.ua),
  "principles": principles[] {
    "title": coalesce(title[$lang], title.ua),
    "text":  coalesce(text[$lang], text.ua),
    icon
  },
  "bridgeKicker": coalesce(bridgeKicker[$lang], bridgeKicker.ua),
  "bridgeText":   coalesce(bridgeText[$lang], bridgeText.ua),
  "bridgeLink":   coalesce(bridgeLink[$lang], bridgeLink.ua),

  "ctaTitle":     coalesce(ctaTitle[$lang], ctaTitle.ua),
  "ctaText":      coalesce(ctaText[$lang], ctaText.ua),
  "ctaPrimary":   coalesce(ctaPrimary[$lang], ctaPrimary.ua),
  "ctaSecondary": coalesce(ctaSecondary[$lang], ctaSecondary.ua)
}`

/**
 * Текст страницы «Команда».
 *
 * Самих людей здесь нет — они приходят TEAM_QUERY из типа teamMember.
 * Это обрамление: заголовки, объяснение про приватного исполнителя,
 * призыв в конце.
 *
 * В трёх полях допускаются подстановки {n}, {name}, {role} — их
 * раскрывает getTeamPage уже по живым данным, см. там же, почему
 * нераскрытая скобка остаётся видимой.
 *
 * Внутри запроса комментариев быть не может — GROQ их не понимает.
 * Сторож: npm run check:groq.
 */
export const TEAM_PAGE_QUERY = groq`
*[_type == "teamPage"][0] {
  "headEyebrow":     coalesce(headEyebrow[$lang], headEyebrow.ua),
  "headTitle":       coalesce(headTitle[$lang], headTitle.ua),
  "headTitleAccent": coalesce(headTitleAccent[$lang], headTitleAccent.ua),
  "headLede":        coalesce(headLede[$lang], headLede.ua),

  "executorKicker": coalesce(executorKicker[$lang], executorKicker.ua),
  "executorTitle":  coalesce(executorTitle[$lang], executorTitle.ua),
  "executorText":   coalesce(executorText[$lang], executorText.ua),

  "peopleEyebrow": coalesce(peopleEyebrow[$lang], peopleEyebrow.ua),
  "peopleTitle":   coalesce(peopleTitle[$lang], peopleTitle.ua),
  "peopleLede":    coalesce(peopleLede[$lang], peopleLede.ua),
  "noPhotoNote":   coalesce(noPhotoNote[$lang], noPhotoNote.ua),
  "noPhotoNoteDefined": defined(noPhotoNote),

  "ctaTitle":     coalesce(ctaTitle[$lang], ctaTitle.ua),
  "ctaText":      coalesce(ctaText[$lang], ctaText.ua),
  "ctaPrimary":   coalesce(ctaPrimary[$lang], ctaPrimary.ua),
  "ctaSecondary": coalesce(ctaSecondary[$lang], ctaSecondary.ua)
}`

/**
 * Тексты баннера cookie. Кнопки и названия категорий в коде — почему,
 * сказано в схеме siteSettings у группы «Cookie».
 */
export const COOKIE_QUERY = groq`
*[_type == "siteSettings"][0] {
  "title":      coalesce(cookieTitle[$lang], cookieTitle.ua),
  "text":       coalesce(cookieText[$lang], cookieText.ua),
  "privacyUrl": privacyUrl
}`

/**
 * Всё, что нужно карте сайта: адреса и даты правок.
 *
 * Отдельный запрос, а не CATEGORIES_QUERY: карте не нужны ни цены, ни
 * описания, зато нужен _updatedAt — дата, когда документ последний раз
 * меняли в студии. Google берёт её за lastmod и решает, какие страницы
 * перечитать в первую очередь.
 *
 * Практика без категории отбрасывается прямо в запросе: адрес практики
 * строится как /practices/<категория>/<практика>, и без категории у неё
 * нет страницы. Ссылка в карте на несуществующий адрес — это 404 в
 * отчёте Search Console, и таких отчётов лучше не плодить.
 */
export const SITEMAP_QUERY = groq`{
  "categories": *[_type == "practiceCategory" && defined(slug.current)] {
    "slug": slug.current,
    _updatedAt
  },
  "practices": *[_type == "practice" && defined(slug.current) && defined(category->slug.current)] {
    "slug": slug.current,
    "category": category->slug.current,
    _updatedAt
  },
  "posts": *[_type == "post" && defined(slug.current)] {
    "slug": slug.current,
    _updatedAt
  },
  "home":  *[_type == "homePage"][0]._updatedAt,
  "about": *[_type == "aboutPage"][0]._updatedAt,
  "team":  *[_type == "teamPage"][0]._updatedAt,
  "career": *[_type in ["careerPage", "vacancy"]] | order(_updatedAt desc)[0]._updatedAt
}`

/** «Карʼєра»: текст страницы. Цитата — только если есть и текст, и автор. */
export const CAREER_QUERY = groq`
*[_type == "careerPage"][0] {
  "headEyebrow":     coalesce(headEyebrow[$lang], headEyebrow.ua),
  "headTitle":       coalesce(headTitle[$lang], headTitle.ua),
  "headTitleAccent": coalesce(headTitleAccent[$lang], headTitleAccent.ua),
  "headLede":        coalesce(headLede[$lang], headLede.ua),
  "benefitsTitle":   coalesce(benefitsTitle[$lang], benefitsTitle.ua),
  "benefits": benefits[]{
    icon,
    "title": coalesce(title[$lang], title.ua),
    "text":  coalesce(text[$lang], text.ua)
  },
  "steps": steps[]{
    "title":    coalesce(title[$lang], title.ua),
    "text":     coalesce(text[$lang], text.ua),
    "duration": coalesce(duration[$lang], duration.ua)
  },
  "quoteText": coalesce(quoteText[$lang], quoteText.ua),
  "quoteAuthor": quoteAuthor->{
    "name": coalesce(name[$lang], name.ua),
    "role": coalesce(role[$lang], role.ua),
    "photoUrl": photo.asset->url
  },
  "faq": faq[]{
    "q": coalesce(q[$lang], q.ua),
    "a": coalesce(a[$lang], a.ua)
  },
  "cvTitle": coalesce(cvTitle[$lang], cvTitle.ua),
  "cvText":  coalesce(cvText[$lang], cvText.ua)
}`

/** Открытые вакансии. Снятая галочка «Відкрита» — вакансии на сайте нет. */
export const VACANCIES_QUERY = groq`
*[_type == "vacancy" && active != false] | order(order asc, _createdAt asc) {
  "slug": _id,
  "title": coalesce(title[$lang], title.ua),
  department, format, employment, example,
  "experience": coalesce(experience[$lang], experience.ua),
  "summary":    coalesce(summary[$lang], summary.ua),
  "weSeek":  weSeek[]{ "t": coalesce(@[$lang], @.ua) }.t,
  "duties":  duties[]{ "t": coalesce(@[$lang], @.ua) }.t,
  "weOffer": weOffer[]{ "t": coalesce(@[$lang], @.ua) }.t
}`
