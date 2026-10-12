import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import type { ReactNode } from 'react'
import { PageShell } from '@/components/site/PageShell'
import { HeroChips, PageHero } from '@/components/site/PageHero'
import { CookieSettingsLink } from '@/components/site/CookieConsent'
import { CONSENT_COOKIE, CONSENT_DAYS } from '@/lib/consent'
import { getContacts, type Contacts } from '@/lib/sanity/content'
import { localeHref } from '@/lib/i18n'
import { ui } from '@/lib/ui'

/**
 * Політика конфіденційності — /privacy.
 *
 * ── Звідки текст ──
 * Описано те, що сайт робить насправді (див. код):
 *   • форма консультації — LeadSection: імʼя, телефон, пошта (необовʼязково),
 *     напрям, суть справи, а також звідки людина прийшла (UTM, сторінка
 *     входу, сайт-джерело — lib/leads/client.ts);
 *   • форма резюме — CvForm: те саме плюс позиція і файл резюме;
 *   • сповіщення юристам у Telegram — lib/leads/notify.ts;
 *   • cookie згоди aktiv_consent і дві категорії за згодою: статистика
 *     (GA4) і реклама (Google Ads, Meta Pixel) — lib/consent.ts.
 * Якщо щось із цього зміниться (база заявок, нові сервіси аналітики),
 * текст треба оновити тут же і змінити дату внизу.
 *
 * ── Що має перевірити фірма ──
 * Повну назву юрособи й код ЄДРПОУ (зараз «Юридична компанія «АКТИВ»)
 * і строки зберігання. На тестовому сайті над текстом стоїть позначка
 * «чернетка», на бойовому її немає.
 *
 * Контакти беруться з Sanity (Налаштування сайту), як і всюди.
 */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  const t = ui(lang).meta
  return {
    ...pageMeta(lang, '/privacy'),
    title: t.privacyTitle,
    description: t.privacyDescription,
  }
}

/* Дата редакції — lib/ui.ts → privacy.updated (обидві мови разом). */

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const { data: c } = await getContacts(lang)
  const T = ui(lang)
  const P_ = T.privacy

  const toc = (['who', 'what', 'why', 'basis', 'cookies', 'share', 'keep', 'rights', 'safety', 'changes'] as const).map(
    (id) => [id, P_.toc[id]] as const,
  )

  return (
    <PageShell lang={lang} overDark form={false}>
      <PageHero
        compact
        small
        crumbs={[{ label: T.common.home, href: localeHref(lang, '/') }, { label: T.common.privacy }]}
        lang={lang}
        title={P_.title}
        accent={P_.accent}
        lede={P_.lede}
      >
        <HeroChips items={[`${P_.updatedLabel} ${P_.updated}`]} />
      </PageHero>

      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="shell inner grid items-start gap-[clamp(28px,4vw,64px)] min-[960px]:grid-cols-[260px_minmax(0,1fr)]">
          {/* Ліва колонка: на компʼютері липне збоку, на телефоні — звичайні картки над текстом. */}
          <aside className="grid gap-3 min-[960px]:sticky min-[960px]:top-[calc(var(--hdr)+24px)]">
            <nav aria-label={P_.tocAria} className="rounded-[22px] bg-white p-6 shadow-[inset_0_0_0_1px_var(--color-hair)]">
              <p className="m-0 mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate">{P_.sections}</p>
              <ol className="m-0 grid list-none gap-0.5 p-0">
                {toc.map(([id, label], i) => (
                  <li key={id}>
                    <a href={`#${id}`} className="group flex gap-2.5 py-2 text-[14.5px] leading-[1.4] text-slate transition-colors hover:text-ink">
                      <span className="font-mono text-[11px] font-medium leading-[1.9] text-slate-2 transition-colors group-hover:text-accent-ink">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="on-dark rounded-[22px] bg-ink p-6 text-white">
              <p className="m-0 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-on-dark-2">{P_.questions}</p>
              <p className="m-0 mt-3 text-[14.5px] leading-[1.6] text-on-dark">{P_.questionsText}</p>
              <a
                href={`mailto:${c.email}`}
                className="mt-[18px] flex min-h-[50px] w-full items-center justify-center rounded-full bg-accent-btn px-5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-btn-hover"
              >
                {c.email}
              </a>
            </div>
          </aside>

          {lang === 'en' ? <BodyEn c={c} /> : <BodyUa c={c} />}
        </div>
      </section>
    </PageShell>
  )
}


/* ── Текст політики українською ── (дослівно як був; англійська — BodyEn) */
function BodyUa({ c }: { c: Contacts }) {
  return (
    <article className="min-w-0 max-w-[76ch]">
      <Part id="who" n={1} title="Хто обробляє дані">
        <P>
          Володілець персональних даних — Юридична компанія «АКТИВ» (далі — «ми»). Адреса: {c.address}. З усіх
          питань щодо ваших даних пишіть на{' '}
          <A href={`mailto:${c.email}`}>{c.email}</A> або телефонуйте {' '}
          <A href={c.phoneHref}>{c.phone}</A>.
        </P>
        <P>
          Ця політика стосується сайту aktiv-alb.com: форм, через які ви звертаєтеся до нас, і cookie. Вона не
          замінює договору про надання правової допомоги — якщо ми почнемо працювати над вашою справою, умови
          обробки даних будуть і в договорі.
        </P>
      </Part>

      <Part id="what" n={2} title="Які дані ми отримуємо">
        <Ul
          items={[
            <>
              <b>Заявка на консультацію:</b> імʼя, телефон, пошта (якщо вкажете), напрям практики і те, що ви
              напишете про справу.
            </>,
            <>
              <b>Резюме:</b> імʼя, телефон, пошта, бажана позиція, файл резюме і супровідний текст.
            </>,
            <>
              <b>Звідки ви прийшли:</b> сторінка, з якої почався візит, сайт-джерело та рекламні мітки (UTM), якщо
              вони були в посиланні. Їх ми додаємо до заявки, щоб розуміти, яка реклама працює. Поки заявку не
              надіслано, ці відомості лежать лише у вашому браузері й зникають, коли ви закриваєте вкладку.
            </>,
            <>
              <b>Технічні дані через cookie</b> — лише в межах, на які ви погодилися (див. розділ «Cookie»).
            </>,
          ]}
        />
        <P>
          Ми не просимо паспортних даних, ідентифікаційного коду чи документів через сайт. Якщо вони знадобляться
          для справи, юрист попросить їх окремо.
        </P>
      </Part>

      <Part id="why" n={3} title="Навіщо">
        <Ul
          items={[
            'Щоб звʼязатися з вами, зрозуміти суть справи й підготувати консультацію.',
            'Щоб розглянути вашу кандидатуру на вакансію.',
            'Щоб рахувати відвідування й покращувати сайт — тільки якщо ви ввімкнули «Статистику».',
            'Щоб показувати рекламу тим, хто вже був на сайті, і рахувати заявки з неї — тільки якщо ви ввімкнули «Рекламу».',
          ]}
        />
      </Part>

      <Part id="basis" n={4} title="Правові підстави">
        <P>
          Ми обробляємо дані відповідно до Закону України «Про захист персональних даних». Підстави — ваша згода,
          яку ви даєте, надсилаючи форму або обираючи налаштування cookie, а також дії, потрібні на ваш запит до
          укладення договору. Для відвідувачів з ЄС ті самі підстави відповідають пунктам (a) і (b) частини 1
          статті 6 GDPR.
        </P>
        <P>
          Усе, що ви повідомляєте нам про свою справу, становить адвокатську таємницю (стаття 22 Закону України
          «Про адвокатуру та адвокатську діяльність») і розголошенню не підлягає.
        </P>
      </Part>

      <Part id="cookies" n={5} title="Cookie">
        <P>
          Cookie — невеликі файли, які сайт зберігає у вашому браузері. Необхідні працюють завжди, решта — лише після
          вашої згоди в банері. Змінити вибір можна будь-коли:{' '}
          <CookieSettingsLink className="cursor-pointer text-accent-ink underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent" />
          .
        </P>
        {/* На телефоні таблиця стає картками: рядок — блок, заголовки колонок
            ховаються, а «Строк» отримує власний підпис. */}
        <div className="my-6">
          <table className="w-full border-collapse text-left text-[14.5px] max-[600px]:block">
            <thead className="max-[600px]:hidden">
              <tr>
                <th className="border-b border-hair px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate">Категорія</th>
                <th className="border-b border-hair px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate">Що це</th>
                <th className="border-b border-hair px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate">Строк</th>
              </tr>
            </thead>
            <tbody className="text-[#3b3450] max-[600px]:block">
              <Row
                cat="Необхідні"
                what={
                  <>
                    <code className="font-mono text-[12.5px] text-ink">{CONSENT_COOKIE}</code> — памʼятає ваш вибір у
                    банері cookie. Вимкнути не можна: без неї банер зʼявлявся б на кожній сторінці.
                  </>
                }
                term={`${CONSENT_DAYS} днів`}
              />
              <Row
                cat="Статистика"
                what="Google Analytics 4 (через Google Tag Manager): знеособлено рахує відвідування, переходи між сторінками й надіслані заявки."
                term="до 2 років"
              />
              <Row
                cat="Реклама"
                what="Google Ads і Meta Pixel: показ реклами тим, хто вже був на сайті, і підрахунок заявок із реклами."
                term="до 2 років"
              />
            </tbody>
          </table>
        </div>
        <P>
          Поки ви не дали згоди, Google отримує сигнал «заборонено» і не зберігає cookie статистики й реклами.
        </P>
      </Part>

      <Part id="share" n={6} title="Кому передаємо">
        <P>Ми не продаємо й не передаємо ваші дані для чужої реклами. Доступ мають лише:</P>
        <Ul
          items={[
            'юристи й адміністратор фірми, які опрацьовують звернення;',
            'Netlify — хостинг сайту, через сервери якого проходить форма;',
            'Telegram — через нього юристи миттєво отримують повідомлення про нову заявку;',
            'Google і Meta — лише дані статистики й реклами і лише з вашої згоди.',
          ]}
        />
        <P>
          Частина цих сервісів зберігає дані за межами України. Ми користуємося ними на умовах, що передбачають захист
          персональних даних. Органам влади дані передаються лише у випадках, прямо передбачених законом, з
          урахуванням адвокатської таємниці.
        </P>
      </Part>

      <Part id="keep" n={7} title="Скільки зберігаємо">
        <Ul
          items={[
            'Заявку — поки триває робота з вашим зверненням. Якщо договір не укладено, видаляємо її протягом 12 місяців.',
            'Резюме — до завершення відбору. Довше — лише якщо ви погодилися, щоб ми розглядали вас і на майбутні вакансії.',
            'Дані за договором — стільки, скільки вимагають закон і правила адвокатської етики.',
          ]}
        />
        <P>Видалити свої дані раніше можна будь-коли — напишіть нам.</P>
      </Part>

      <Part id="rights" n={8} title="Ваші права">
        <P>Відповідно до статті 8 Закону України «Про захист персональних даних» ви можете:</P>
        <Ul
          items={[
            'дізнатися, які ваші дані ми маємо, де вони зберігаються і хто має до них доступ;',
            'вимагати виправити неточні дані або видалити їх;',
            'відкликати згоду — на обробку даних або на cookie — у будь-який момент;',
            'заперечити проти обробки даних;',
            'поскаржитися Уповноваженому Верховної Ради України з прав людини або до суду.',
          ]}
        />
        <P>
          Напишіть на <A href={`mailto:${c.email}`}>{c.email}</A> — відповімо протягом 30 календарних днів.
        </P>
      </Part>

      <Part id="safety" n={9} title="Як захищаємо">
        <P>
          Сайт працює лише через захищене зʼєднання (HTTPS). Доступ до заявок мають тільки працівники фірми з
          особистими обліковими записами. Працівники зобовʼязані зберігати адвокатську таємницю й конфіденційність
          персональних даних.
        </P>
      </Part>

      <Part id="changes" n={10} title="Зміни політики">
        <P>
          Якщо ми змінимо, які дані збираємо або як їх використовуємо, оновимо цю сторінку. Якщо зміниться перелік
          cookie, банер згоди зʼявиться знову, і ви зможете обрати заново.
        </P>
        <p className="m-0 mt-8 border-t border-hair pt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-2">
          Оновлено {ui('ua').privacy.updated}
        </p>
      </Part>
    </article>
  )
}

/* ── English text of the policy ──
   Те саме, що BodyUa, англійською: ті самі факти, розділи й якорі.
   Назви законів — офіційними англійськими відповідниками. */
function BodyEn({ c }: { c: Contacts }) {
  const t = ui('en').privacy
  return (
    <article className="min-w-0 max-w-[76ch]">
      <Part id="who" n={1} title={t.toc.who}>
        <P>
          The controller of your personal data is AKTIV Law Firm (Юридична компанія «АКТИВ»; “we”). Address: {c.address}. For
          any questions about your data, write to <A href={`mailto:${c.email}`}>{c.email}</A> or call{' '}
          <A href={c.phoneHref}>{c.phone}</A>.
        </P>
        <P>
          This policy covers the aktiv-alb.com website: the forms you use to contact us, and cookies. It does not replace an
          agreement for legal assistance — if we start working on your case, the data processing terms will also be set out
          in that agreement.
        </P>
      </Part>

      <Part id="what" n={2} title={t.toc.what}>
        <Ul
          items={[
            <>
              <b>Consultation request:</b> your name, phone number, email (if you provide it), practice area and whatever you
              write about your case.
            </>,
            <>
              <b>CV:</b> your name, phone number, email, desired position, CV file and cover text.
            </>,
            <>
              <b>Where you came from:</b> the page your visit started on, the referring website and advertising tags (UTM) if
              they were in the link. We attach them to your request to understand which advertising works. Until the request
              is sent, this information stays only in your browser and disappears when you close the tab.
            </>,
            <>
              <b>Technical data via cookies</b> — only to the extent you have agreed to (see the “Cookies” section).
            </>,
          ]}
        />
        <P>
          We do not ask for passport details, tax identification numbers or documents through the website. If they are needed
          for your case, a lawyer will request them separately.
        </P>
      </Part>

      <Part id="why" n={3} title={t.toc.why}>
        <Ul
          items={[
            'To contact you, understand your case and prepare the consultation.',
            'To consider your application for a vacancy.',
            'To count visits and improve the website — only if you have enabled “Analytics”.',
            'To show ads to people who have already visited the website and count the requests they bring — only if you have enabled “Advertising”.',
          ]}
        />
      </Part>

      <Part id="basis" n={4} title={t.toc.basis}>
        <P>
          We process data in accordance with the Law of Ukraine “On Personal Data Protection”. The grounds are your consent,
          which you give by submitting a form or choosing cookie settings, and steps taken at your request before entering
          into an agreement. For visitors from the EU, the same grounds correspond to points (a) and (b) of Article 6(1) of
          the GDPR.
        </P>
        <P>
          Everything you tell us about your case is protected by attorney–client privilege (Article 22 of the Law of Ukraine
          “On the Bar and Practice of Law”) and may not be disclosed.
        </P>
      </Part>

      <Part id="cookies" n={5} title={t.toc.cookies}>
        <P>
          Cookies are small files that a website stores in your browser. Necessary cookies always work; the rest only after
          you consent in the banner. You can change your choice at any time:{' '}
          <CookieSettingsLink className="cursor-pointer text-accent-ink underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent" />
          .
        </P>
        <div className="my-6">
          <table className="w-full border-collapse text-left text-[14.5px] max-[600px]:block">
            <thead className="max-[600px]:hidden">
              <tr>
                <th className="border-b border-hair px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate">{t.category}</th>
                <th className="border-b border-hair px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate">{t.what}</th>
                <th className="border-b border-hair px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-slate">{t.term}</th>
              </tr>
            </thead>
            <tbody className="text-[#3b3450] max-[600px]:block">
              <Row
                cat="Necessary"
                what={
                  <>
                    <code className="font-mono text-[12.5px] text-ink">{CONSENT_COOKIE}</code> — remembers your choice in the
                    cookie banner. Cannot be turned off: without it, the banner would appear on every page.
                  </>
                }
                term={`${CONSENT_DAYS} days`}
                termLabel={t.term}
              />
              <Row
                cat="Analytics"
                what="Google Analytics 4 (via Google Tag Manager): anonymously counts visits, navigation between pages and submitted requests."
                term="up to 2 years"
                termLabel={t.term}
              />
              <Row
                cat="Advertising"
                what="Google Ads and Meta Pixel: showing ads to people who have already visited the website and counting requests that come from ads."
                term="up to 2 years"
                termLabel={t.term}
              />
            </tbody>
          </table>
        </div>
        <P>Until you give consent, Google receives a “denied” signal and does not store analytics or advertising cookies.</P>
      </Part>

      <Part id="share" n={6} title={t.toc.share}>
        <P>We do not sell your data or share it for third-party advertising. Access is limited to:</P>
        <Ul
          items={[
            'the firm’s lawyers and administrator who handle requests;',
            'Netlify — the website host whose servers the form passes through;',
            'Telegram — which our lawyers use to receive instant notifications of new requests;',
            'Google and Meta — only analytics and advertising data, and only with your consent.',
          ]}
        />
        <P>
          Some of these services store data outside Ukraine. We use them on terms that provide for the protection of personal
          data. Data is disclosed to public authorities only in cases expressly provided for by law, subject to attorney–client
          privilege.
        </P>
      </Part>

      <Part id="keep" n={7} title={t.toc.keep}>
        <Ul
          items={[
            'Requests — for as long as we are working on your enquiry. If no agreement is concluded, we delete them within 12 months.',
            'CVs — until the selection process is over. Longer only if you have agreed that we may also consider you for future vacancies.',
            'Data under an agreement — for as long as required by law and the rules of professional conduct for attorneys.',
          ]}
        />
        <P>You can have your data deleted earlier at any time — just write to us.</P>
      </Part>

      <Part id="rights" n={8} title={t.toc.rights}>
        <P>Under Article 8 of the Law of Ukraine “On Personal Data Protection”, you may:</P>
        <Ul
          items={[
            'find out what data of yours we hold, where it is stored and who has access to it;',
            'request that inaccurate data be corrected or deleted;',
            'withdraw your consent — to data processing or to cookies — at any time;',
            'object to the processing of your data;',
            'lodge a complaint with the Ukrainian Parliament Commissioner for Human Rights or with a court.',
          ]}
        />
        <P>
          Write to <A href={`mailto:${c.email}`}>{c.email}</A> — we will reply within 30 calendar days.
        </P>
      </Part>

      <Part id="safety" n={9} title={t.toc.safety}>
        <P>
          The website works only over a secure connection (HTTPS). Only the firm’s staff with personal accounts have access to
          requests. Staff are obliged to keep attorney–client privilege and the confidentiality of personal data.
        </P>
      </Part>

      <Part id="changes" n={10} title={t.toc.changes}>
        <P>
          If we change what data we collect or how we use it, we will update this page. If the list of cookies changes, the
          consent banner will appear again so you can choose anew.
        </P>
        <p className="m-0 mt-8 border-t border-hair pt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-slate-2">
          {t.updatedLabel} {t.updated}
        </p>
      </Part>
    </article>
  )
}

/* ── дрібні будівельні блоки тексту ── */

function Part({ id, n, title, children }: { id: string; n: number; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mb-[30px] scroll-mt-[calc(var(--hdr)+24px)] border-b border-hair pb-[30px] last:mb-0 last:border-b-0 last:pb-0">
      <h2 className="m-0 mb-3.5 flex gap-3.5 font-serif text-[clamp(24px,2.6vw,30px)] font-normal leading-[1.2] text-ink">
        <span className="font-mono text-[12px] font-medium leading-[2.6] text-accent-ink">{String(n).padStart(2, '0')}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="mb-4 mt-0 text-[16px] leading-[1.7] text-[#3b3450]">{children}</p>
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="whitespace-nowrap text-accent-ink underline decoration-accent/40 underline-offset-[3px] hover:decoration-accent">
      {children}
    </a>
  )
}

function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mb-5 mt-0 grid list-none gap-2.5 p-0">
      {items.map((it, i) => (
        <li key={i} className="grid grid-cols-[14px_1fr] gap-2.5 text-[16px] leading-[1.7] text-[#3b3450] [&_b]:font-semibold [&_b]:text-ink">
          <span aria-hidden="true" className="mt-[0.72em] size-[5px] rounded-full bg-accent" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

function Row({ cat, what, term, termLabel = 'Строк' }: { cat: string; what: ReactNode; term: string; termLabel?: string }) {
  return (
    <tr className="align-top max-[600px]:block max-[600px]:border-b max-[600px]:border-hair max-[600px]:py-3">
      <td className="border-b border-hair px-3 py-3.5 font-semibold text-ink max-[600px]:block max-[600px]:border-0 max-[600px]:px-0 max-[600px]:py-[3px]">
        {cat}
      </td>
      <td className="border-b border-hair px-3 py-3.5 leading-[1.55] max-[600px]:block max-[600px]:border-0 max-[600px]:px-0 max-[600px]:py-[3px]">
        {what}
      </td>
      <td className="whitespace-nowrap border-b border-hair px-3 py-3.5 max-[600px]:block max-[600px]:border-0 max-[600px]:px-0 max-[600px]:py-[3px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate min-[601px]:hidden">{termLabel} · </span>
        {term}
      </td>
    </tr>
  )
}
