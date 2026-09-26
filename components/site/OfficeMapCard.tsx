'use client'

import type { Contacts } from '@/lib/sanity/content'
import { CopyAddress } from './CopyAddress'
import { Icon } from './Icon'
import { OfficeMap } from './OfficeMap'

/**
 * Офис на карте — нижняя часть блока «Консультація».
 *
 * Одна тёмная плитка, внутри — две части: слева адрес, справа карта в
 * «окне» со скруглением и отступом от края. Карта не лежит под
 * текстом и ничем не перекрыта: адрес читается на ровном тёмном фоне.
 * Как карта стала тёмной без вспышек при прокрутке — см. OfficeMap.
 *
 *   ┌───────────────────────────────────────────────┐
 *   │  ОФІС · КИЇВ         ┌──────────────────────┐ │
 *   │                      │                      │ │
 *   │  вул. Ділова, 6      │          ●           │ │
 *   │  [офіс 25] як знайти │                      │ │
 *   │                      │                      │ │
 *   │  (Маршрут) (Maps) ⧉  └──────────────────────┘ │
 *   └───────────────────────────────────────────────┘
 *
 * На телефоне карта сверху, адрес под ней.
 * Адрес частями и «як знайти» — Sanity, «Налаштування сайту → Контакти».
 */
export function OfficeMapCard({ contacts }: { contacts: Contacts }) {
  const { street, unit, city } = contacts.office
  /* Номер офиса карте только мешает: Google ищет здание, а не кабинет. */
  const query = contacts.mapQuery || [street, city].filter(Boolean).join(', ')
  const q = encodeURIComponent(query)

  return (
    <figure className="m-0 grid gap-2 rounded-[22px] bg-ink-2 p-2 shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)] min-[800px]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <figcaption className="order-2 flex flex-col p-[clamp(18px,2.6vw,30px)] min-[800px]:order-1">
        <p className="m-0 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-soft">
          <span aria-hidden="true" className="h-px w-5 bg-accent" />
          Офіс{city ? ` · ${city}` : ''}
        </p>

        <div className="my-auto py-6 min-[800px]:py-8">
          <p className="m-0 font-serif text-[clamp(26px,3.2vw,38px)] font-semibold leading-[1.08] tracking-[-0.01em] text-white">
            <span className="sr-only">Адреса: </span>
            {street}
          </p>
          {(unit || contacts.officeHint) && (
            <p className="m-0 mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[14px] leading-snug text-on-dark">
              {unit && (
                <span className="rounded-full px-2.5 py-0.5 text-[13px] font-medium text-white shadow-[inset_0_0_0_1px_var(--color-on-dark-hair)]">
                  {unit}
                </span>
              )}
              {contacts.officeHint && <span>{contacts.officeHint}</span>}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${q}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-[14px] font-medium text-white transition-colors hover:bg-accent-ink"
          >
            Маршрут
            <Icon name="arrow" className="size-[14px]" />
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${q}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center rounded-full px-4 text-[13px] text-on-dark transition-colors hover:text-white"
          >
            Google Maps ↗
          </a>
          <CopyAddress text={contacts.address} dark />
        </div>
      </figcaption>

      <div className="relative order-1 h-[260px] overflow-hidden rounded-[16px] bg-ink-2 min-[480px]:h-[320px] min-[800px]:order-2 min-[800px]:h-[clamp(340px,32vw,400px)]">
        <OfficeMap query={query} title={`Офіс «АКТИВ» на карті: ${contacts.address}`} />
      </div>
    </figure>
  )
}
