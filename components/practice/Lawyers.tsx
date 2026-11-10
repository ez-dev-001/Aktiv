import { RingAvatar } from '@/components/site/Blocks'
import { teamPhoto } from '@/lib/sanity/content'
import { portraitUrl } from './Parts'
import type { PracticePerson } from './data'

/**
 * «Хто веде справу» на сторінці послуги — як блок команди на старому
 * сайті: портрет, імʼя, посада і практики, які людина веде. Практики
 * беруться з привʼязок у Sanity (practice.lawyers / teamMember.practices),
 * тому список «Також веде» завжди правдивий. Окремих сторінок юристів
 * немає, тож і посилання «Про юриста» немає.
 *
 * До двох людей — широкі горизонтальні картки, від трьох — сітка.
 */

export interface LawyerLink {
  href: string
  label: string
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')

function Portrait({ m, className }: { m: PracticePerson; className: string }) {
  return (
    <div className={`relative overflow-hidden bg-paper-2 ${className}`}>
      {m.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={portraitUrl(m.photoUrl)}
          alt={m.name}
          loading="lazy"
          decoding="async"
          className="size-full object-cover object-top transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
        />
      ) : (
        <span className="grid size-full place-items-center font-serif text-[44px] font-semibold text-ink">{initials(m.name)}</span>
      )}
      {/* малиновий кут — як у портреті на головній */}
      <span aria-hidden="true" className="absolute bottom-0 left-0 h-[34%] w-[6px] bg-accent" />
    </div>
  )
}

export function LawyerCards({
  people,
  also,
  label,
}: {
  people: PracticePerson[]
  /** інші практики людини — посилання */
  also: (m: PracticePerson) => LawyerLink[]
  label: string
}) {
  const wide = people.length <= 2
  return (
    <ul
      className={`m-0 grid list-none gap-[clamp(14px,1.8vw,22px)] p-0 ${
        wide ? (people.length === 2 ? 'min-[1000px]:grid-cols-2' : 'max-w-[860px]') : 'min-[640px]:grid-cols-2 min-[1000px]:grid-cols-3'
      }`}
    >
      {people.map((m) => {
        const links = also(m).slice(0, 4)
        /* Телефон: фото в кружку з кільцем поруч з іменем (як у команді на
           головній), портрет — від ширини, де картка вміщує його збоку. */
        const big = wide ? 'max-[559px]:hidden' : 'max-[639px]:hidden'
        const small = wide ? 'min-[560px]:hidden' : 'min-[640px]:hidden'
        return (
          <li
            key={m.slug ?? m.name}
            className={`group grid overflow-hidden rounded-[24px] bg-white shadow-[inset_0_0_0_1px_var(--color-hair)] ${
              wide ? 'min-[560px]:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]' : ''
            }`}
          >
            <Portrait m={m} className={`${big} ${wide ? 'min-h-[340px]' : 'aspect-[4/5]'}`} />
            <div className="flex flex-col p-5 min-[560px]:p-[clamp(22px,2.6vw,32px)]">
              <div className="flex items-center gap-4">
                <RingAvatar src={teamPhoto(m.photoUrl, 200)} name={m.name} className={`size-[76px] ${small}`} />
                <div className="min-w-0">
                  <h3 className="m-0 font-serif text-[clamp(22px,2.2vw,28px)] font-normal leading-[1.15] tracking-[-0.01em] text-ink">{m.name}</h3>
                  {m.role && <p className="m-0 mt-1.5 text-[14px] leading-snug text-accent-ink">{m.role}</p>}
                </div>
              </div>
              {links.length > 0 && (
                <div className="mt-5 pb-1">
                  <p className="m-0 mb-2.5 text-[13px] text-slate-2">{label}</p>
                  <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                    {links.map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          className="inline-flex min-h-[32px] items-center rounded-[16px] px-3 py-1 text-[12.5px] leading-[1.3] font-medium text-ink no-underline shadow-[inset_0_0_0_1px_var(--color-hair)] transition-colors hover:bg-ink hover:text-white hover:shadow-none"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Обличчя «стосом» для першого екрана. */
export function FaceStack({ people }: { people: PracticePerson[] }) {
  return (
    <span className="flex">
      {people.slice(0, 4).map((m, i) => (
        <span key={m.slug ?? m.name} className={i ? '-ml-3' : ''}>
          <RingAvatar src={teamPhoto(m.photoUrl, 160)} name={m.name} className="size-[52px]" />
        </span>
      ))}
    </span>
  )
}
