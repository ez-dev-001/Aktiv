import { ButtonLink } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-[var(--gut)] py-24">
      <div className="max-w-[46ch]">
        <p className="eyebrow">404</p>
        <h1 className="text-[clamp(28px,5vw,44px)] leading-[1.08]">Такої сторінки немає</h1>
        <p className="lede mt-5 text-slate">
          Можливо, адреса змінилася при переїзді сайту. Практики та статті на місці — вони просто
          переїхали в нові розділи.
        </p>
        <div className="mt-8 flex flex-wrap gap-2.5">
          <ButtonLink href="/" arrow>На головну</ButtonLink>
          <ButtonLink href="/#practices" variant="ghost">Усі практики</ButtonLink>
        </div>
      </div>
    </main>
  )
}
