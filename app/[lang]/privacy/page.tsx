import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { PageHead, PageShell } from '@/components/site/PageShell'
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

const STATIONS = [{ id: 'head', label: 'Політика' }]

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
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
    <PageShell lang={lang} stations={STATIONS}>
      <PageHead
        eyebrow="Документи"
        title="Політика конфіденційності"
        lede="Коротко: ми просимо лише те, що потрібно, щоб звʼязатися з вами у справі. Статистику й рекламу вмикаємо тільки з вашої згоди. Усе, що ви розповідаєте про справу, захищене адвокатською таємницею."
      />

      <section className="pb-[clamp(64px,9vw,128px)]">
        <div className="shell inner grid gap-[clamp(32px,5vw,72px)] min-[1000px]:grid-cols-[minmax(0,0.32fr)_minmax(0,1fr)]">
          {/* Зміст: на десктопі липне збоку, на телефоні — звичайний список. */}
          <nav aria-label="Зміст" className="min-[1000px]:sticky min-[1000px]:top-[calc(var(--hdr)+24px)] min-[1000px]:self-start">
            <p className="m-0 mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-2">Зміст</p>
            <ol className="m-0 grid list-none gap-0.5 border-l border-hair p-0">
              {toc.map(([id, label], i) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="-ml-px flex min-h-9 items-center gap-3 border-l border-transparent pl-4 text-[14px] text-slate transition-colors hover:border-accent hover:text-ink"
                  >
                    <span className="font-mono text-[10.5px] text-slate-2">{String(i + 1).padStart(2, '0')}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="min-w-0 max-w-[72ch]">
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
              <div className="my-6 overflow-x-auto rounded-[14px] shadow-[inset_0_0_0_1px_var(--color-hair)]">
                <table className="w-full min-w-[560px] border-collapse text-left text-[14px] leading-snug">
                  <thead>
                    <tr className="bg-paper-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-slate-2">
                      <th className="px-4 py-3 font-normal">Категорія</th>
                      <th className="px-4 py-3 font-normal">Що це</th>
                      <th className="px-4 py-3 font-normal">Строк</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate">
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
    <section id={id} className="scroll-mt-[calc(var(--hdr)+24px)] border-t border-hair pt-[clamp(26px,3.4vw,40px)] pb-2 first-of-type:border-t-0 first-of-type:pt-0">
      <p className="m-0 mb-2 font-mono text-[11px] tracking-[0.12em] text-accent-ink">{String(n).padStart(2, '0')}</p>
      <h2 className="mb-5 mt-0 text-[clamp(22px,3vw,30px)] leading-[1.15]">{title}</h2>
      {children}
    </section>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="mb-5 mt-0 text-[16.5px] leading-[1.68] text-slate">{children}</p>
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
    <ul className="mb-6 mt-0 grid list-none gap-3 p-0">
      {items.map((it, i) => (
        <li key={i} className="grid grid-cols-[16px_1fr] gap-3 text-[16px] leading-[1.6] text-slate [&_b]:font-medium [&_b]:text-ink">
          <span className="mt-[0.62em] size-[5px] rounded-full bg-accent" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

function Row({ cat, what, term }: { cat: string; what: ReactNode; term: string }) {
  return (
    <tr className="border-t border-hair-soft align-top">
      <td className="px-4 py-3.5 font-medium text-ink">{cat}</td>
      <td className="px-4 py-3.5">{what}</td>
      <td className="whitespace-nowrap px-4 py-3.5">{term}</td>
    </tr>
  )
}
