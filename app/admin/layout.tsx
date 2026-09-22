import type { Metadata } from 'next'
import { Logo } from '@/components/site/Logo'
import { leadStore } from '@/lib/leads/store'

/**
 * Оболочка CRM. Отдельная от сайта: без шапки с меню практик, без
 * линии дела, без cookie-баннера. Это рабочий инструмент, не страница.
 *
 * Из поиска закрыта трижды: robots.txt, мета noindex и отсутствие
 * в карте сайта.
 *
 * TODO(этап 4): вход через Firebase Auth. До него здесь только демо:
 * на Netlify хранилище не сохраняет заявки с формы (см. lib/leads/store.ts),
 * поэтому открытый /admin показывает лишь выдуманные записи.
 */

export const metadata: Metadata = {
  title: { default: 'Звернення', template: '%s — CRM «АКТИВ»' },
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const store = leadStore()
  return (
    <div className="min-h-svh bg-paper">
      <header className="sticky top-0 z-40 border-b border-hair-soft bg-paper/90 backdrop-blur-[12px]">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-5 px-[clamp(14px,3vw,32px)]">
          {/* Навигации по воронкам здесь нет намеренно: на списке она уже
              стоит крупными вкладками «Консультації / Заявки на послуги»,
              а в карточке есть ссылка назад в нужную воронку. Две строки
              одних и тех же слов подряд — шум. */}
          <a href="/admin" className="flex items-center gap-3" aria-label="CRM, до консультацій">
            <Logo />
            <span className="border-l border-hair pl-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-2">CRM</span>
          </a>
          <div className="ml-auto flex items-center gap-3">
            {store.kind === 'demo' && (
              <span
                className="hidden items-center gap-2 rounded-full bg-[#fbf3e3] px-3 py-1 text-[12px] text-[#8a5a0b] min-[720px]:inline-flex"
                title={
                  store.persistsSubmissions
                    ? 'Заявки з форми зберігаються в памʼяті до перезапуску сервера'
                    : 'На тестовому сайті заявки з форми не зберігаються — лише вигадані демо-записи'
                }
              >
                <span className="size-1.5 rounded-full bg-[#e0a33a]" />
                Демо · {store.persistsSubmissions ? 'памʼять сервера' : 'без збереження'}
              </span>
            )}
            <a href="/" className="text-[13px] text-slate hover:text-ink">
              На сайт ↗
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1320px] px-[clamp(14px,3vw,32px)] pb-20 pt-[clamp(20px,3vw,32px)]">{children}</main>
    </div>
  )
}
