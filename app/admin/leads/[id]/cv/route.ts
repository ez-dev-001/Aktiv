import { leadStore } from '@/lib/leads/store'

/**
 * Файл резюме из CRM. Отдаётся вложением, а не открывается в браузере:
 * PDF из чужих рук не должен исполняться на домене сайта.
 *
 * TODO: проверка входа, когда появится вход в админку.
 */
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const file = await leadStore().getFile(id)
  if (!file) return new Response('Файл не знайдено', { status: 404 })
  const name = encodeURIComponent(file.name)
  return new Response(file.data as BodyInit, {
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': `attachment; filename*=UTF-8''${name}`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex',
    },
  })
}
