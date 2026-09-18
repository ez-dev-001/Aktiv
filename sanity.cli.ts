import { defineCliConfig } from 'sanity/cli'

/**
 * Конфиг для команд `sanity dev` / `sanity build`.
 *
 * Переменные читаются из .env.local — Sanity CLI следует соглашению Vite
 * и подхватывает тот же файл, что и Next. Префикс SANITY_STUDIO_ обязателен:
 * только такие переменные попадают в браузерный бандл студии, NEXT_PUBLIC_
 * для неё ничего не значит.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  },
  studioHost: 'aktiv-alb',
})
