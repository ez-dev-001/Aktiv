import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PageShell } from '@/components/site/PageShell'
import { HeroChips, PageHero } from '@/components/site/PageHero'
import { CookieSettingsLink } from '@/components/site/CookieConsent'
import { CONSENT_COOKIE, CONSENT_DAYS } from '@/lib/consent'
import { getContacts } from '@/lib/sanity/content'
import { isLiveSite } from '@/lib/site'

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

export const metadata: Metadata = {
  title: 'Політика конфіденційності',
  description:
    'Як юридична компанія «АКТИВ» обробляє персональні дані з форм на сайті та які cookie використовує.',
}

const UPDATED = '8 жовтня 2026 р.'

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const prefix = lang === 'ua' ? '' : `/${lang}`
  const { data: c } = await getContacts(lang)
  const draft = !isLiveSite()

  const toc = [
    ['who', 'Хто обробляє дані'],
    ['what', 'Які дані ми отримуємо'],
    ['why', 'Навіщо'],
    ['basis', 'Правові підстави'],
    ['cookies', 'Cookie'],
    ['share', 'Кому передаємо'],
    ['keep', 'Скільки зберігаємо'],
    ['rights', 'Ваші права'],
    ['safety', 'Як захищаємо'],
    ['changes', 'Зміни політики'],
  ] as const

  return (
    <PageShell lang={lang} overDark form={false}>
      <PageHero
        compact
        small
        crumbs={[{ label: 'Головна', href: prefix || '/' }, { label: 'Політика конфіденційності' }]}
        title="Політика"
        accent="конфіденційності"
        lede="Коротко: ми просимо лише те, що потрібно, щоб звʼязатися з вами у справі. Статистику й рекламу вмикаємо тільки з вашої згоди. Усе, що ви розповідаєте про справу, захищене адвокатською таємницею."
      >
        <HeroChips items={[...(draft ? ['Чернетка для перевірки фірмою'] : []), `Оновлено ${UPDATED}`]} />
      </PageHero>

      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="shell inner grid items-start gap-[clamp(28px,4vw,64px)] min-[960px]:grid-cols-[260px_minmax(0,1fr)]">
          {/* Ліва колонка: на компʼютері липне збоку, на телефоні — звичайні картки над текстом. */}
          <aside className="grid gap-3 min-[960px]:sticky min-[960px]:top-[calc(var(--hdr)+24px)]">
            <nav aria-label="Зміст" className="rounded-[22px] bg-white p-6 shadow-[inset_0_0_0_1px_var(--color-hair)]">
              <p className="m-0 mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-slate">Розділи</p>
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
              <p className="m-0 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-on-dark-2">Питання щодо даних</p>
              <p className="m-0 mt-3 text-[14.5px] leading-[1.6] text-on-dark">Напишіть — відповімо протягом 30 календарних днів.</p>
              <a
                href={`mailto:${c.email}`}
                className="mt-[18px] flex min-h-[50px] w-full items-center justify-center rounded-full bg-accent-btn px-5 text-[15px] font-semibold text-white transition-colors hover:bg-accent-btn-hover"
              >
                {c.email}
              </a>
            </div>
          </aside>

          <article className="min-w-0 max-w-[76ch]">
            {draft && (
              <p className="m-0 mb-8 rounded-[12px] bg-[#fbf3e3] px-4 py-3 text-[13.5px] leading-relaxed text-[#8a5a0b]">
                <b className="font-semibold">Чернетка для перевірки фірмою.</b> Уточніть повну назву юрособи, код ЄДРПОУ
                та строки зберігання. На бойовому сайті цієї позначки немає.
              </p>
            )}

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
                Оновлено {UPDATED}
              </p>
            </Part>
          </article>
        </div>
      </section>
    </PageShell>
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

function Row({ cat, what, term }: { cat: string; what: ReactNode; term: string }) {
  return (
    <tr className="align-top max-[600px]:block max-[600px]:border-b max-[600px]:border-hair max-[600px]:py-3">
      <td className="border-b border-hair px-3 py-3.5 font-semibold text-ink max-[600px]:block max-[600px]:border-0 max-[600px]:px-0 max-[600px]:py-[3px]">
        {cat}
      </td>
      <td className="border-b border-hair px-3 py-3.5 leading-[1.55] max-[600px]:block max-[600px]:border-0 max-[600px]:px-0 max-[600px]:py-[3px]">
        {what}
      </td>
      <td className="whitespace-nowrap border-b border-hair px-3 py-3.5 max-[600px]:block max-[600px]:border-0 max-[600px]:px-0 max-[600px]:py-[3px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate min-[601px]:hidden">Строк · </span>
        {term}
      </td>
    </tr>
  )
}
