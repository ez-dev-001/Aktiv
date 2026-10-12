import type { ReactNode } from 'react'
import type { PhotoName, PhotoSource } from '@/lib/photos'
import { getCategories, getContacts } from '@/lib/sanity/content'
import { toMenu } from '@/lib/menu'
import { ScrollProgress } from './CaseLine'
import { FloatingActions } from './FloatingActions'
import { MobileDock } from './MobileDock'
import { LeadSection } from '@/components/home/LeadSection'
import { Header } from './Header'
import { Photo } from './Photo'
import { Footer } from '@/components/home/Sections'
import { Eyebrow } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Каркас внутренней страницы.
 *
 * Линия дела идёт через весь сайт, а не только по главной — иначе
 * приём разваливается на второй же странице. Станции у каждой страницы
 * свои: они собираются из её разделов и передаются сюда.
 *
 * Шапка, футер и плавающий блок связи одни и те же везде.
 */

export interface Station {
  id: string
  label: string
}

export async function PageShell({
  lang,
  overDark = false,
  form = true,
  children,
}: {
  lang: string
  stations?: Station[]
  /** у страницы тёмный первый экран — шапка стартует прозрачной */
  overDark?: boolean
  /** форма заявки внизу страницы (як на головній). Без неї — карʼєра,
      політика, «Дякуємо»: там своя форма або її щойно надіслали. */
  form?: boolean
  children: ReactNode
}) {
  /* Контакты читаются здесь, а не в каждой странице: шапка, футер и
     плавающие кнопки есть на всех, и один запрос на страницу лучше,
     чем три одинаковых пропа, протянутых сквозь маршруты. */
  const [{ data: contacts }, { data: cats }] = await Promise.all([getContacts(lang), getCategories(lang)])

  return (
    <>
      <ScrollProgress />
      <Header lang={lang} overDark={overDark} contacts={contacts} categories={toMenu(cats)} />
      <main id="top" className="relative">
        {children}
        {/* Форма — та сама, що на головній, без змін. Кнопки «Отримати
            консультацію» на сторінці ведуть сюди (#contact), а
            ?practice=… у посиланні заздалегідь обирає напрям. */}
        {form && <LeadSection contacts={contacts} categories={cats} />}
      </main>
      <Footer contacts={contacts} categories={cats} />
      {/* З формою: на телефоні — липка панель «консультація + дзвінок»,
          кругла кнопка лишається лише на компʼютері (як на головній). */}
      <FloatingActions contacts={contacts} desktopOnly={form} />
      {form && <MobileDock contacts={contacts} />}
    </>
  )
}

/**
 * Шапка внутренней страницы — два режима.
 *
 * С `photo` — тёмный первый экран с кадром во всю ширину, как на
 * главной: внутренние страницы иначе выглядят как другой сайт.
 * Без `photo` — прежняя типографическая шапка на бумаге; она остаётся
 * для страниц, где кадр был бы декорацией (статья, рубрика блога).
 *
 * Высота специально меньше героя главной: это не первый экран сайта,
 * и держать посетителя на картинке целый экран здесь не за что.
 */
export function PageHead({
  eyebrow,
  title,
  lede,
  aside,
  photo,
}: {
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  aside?: ReactNode
  photo?: PhotoName | PhotoSource
}) {
  if (photo) {
    return (
      <section
        id="head"
        className="on-dark relative isolate mt-[calc(-1*(var(--hdr)+env(safe-area-inset-top,0px)))] overflow-hidden bg-ink text-on-dark"
      >
        <Photo name={photo} fill priority tone="deep" sizes="100vw" imgClassName="object-[50%_38%]" />
        <div className="shell inner relative z-[2] flex min-h-[clamp(360px,52svh,560px)] flex-col justify-end pb-[clamp(34px,5vw,64px)] pt-[clamp(84px,15vw,150px)]">
          <Eyebrow>{eyebrow}</Eyebrow>
          <div className="grid items-end gap-[clamp(24px,3.5vw,52px)] min-[900px]:grid-cols-[1.25fr_0.75fr]">
            <div>
              <Reveal as="h1" className="max-w-[18ch] text-[clamp(30px,6vw,58px)] leading-[1.05] !text-white">
                {title}
              </Reveal>
              {lede && <p className="lede mt-5 max-w-[52ch] text-white/75">{lede}</p>}
            </div>
            {aside}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="head" className="py-[clamp(48px,7vw,104px)]">
      <div className="shell inner">
        <Eyebrow>{eyebrow}</Eyebrow>
        <div className="grid items-end gap-[clamp(28px,4vw,56px)] min-[900px]:grid-cols-[1.25fr_0.75fr]">
          <div>
            <Reveal as="h1" className="max-w-[18ch] text-[clamp(30px,6vw,58px)] leading-[1.05]">
              {title}
            </Reveal>
            {lede && <p className="lede mt-6 max-w-[52ch] text-slate">{lede}</p>}
          </div>
          {aside}
        </div>
      </div>
    </section>
  )
}

/** Заголовок раздела внутри страницы — один и тот же ритм везде. */
export function SectionHead({
  eyebrow,
  title,
  lede,
  dark,
}: {
  eyebrow: string
  title: string
  lede?: ReactNode
  dark?: boolean
}) {
  return (
    <div className="mb-[clamp(30px,4.5vw,52px)] max-w-[58ch]">
      <Eyebrow>{eyebrow}</Eyebrow>
      <Reveal className={`text-[clamp(24px,4.2vw,40px)] leading-[1.1] ${dark ? '!text-white' : ''}`}>
        {title}
      </Reveal>
      {lede && <p className={`lede mt-5 max-w-[52ch] ${dark ? 'text-on-dark' : 'text-slate'}`}>{lede}</p>}
    </div>
  )
}
