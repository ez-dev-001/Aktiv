# Анімація знака «АКТИВ» для першого екрана

Сцена зроблена в [Remotion](https://remotion.dev): `src/HeroMark.tsx`.
Тут її зручно дивитися й правити по кадрах (`npx remotion studio`).

**На сайті відео більше не використовується.** Та сама сцена з тими
самими таймінгами перенесена в SVG + CSS (`components/home/HeroMark.tsx`
і блок «HeroMark» у `app/globals.css`): вона стартує з першою
відмальовкою, не чекає завантаження файлу й не залежить від кодеків.
Якщо змінюєте рух тут — перенесіть таймінги туди (кадр ÷ 30 = секунди).
Файли в `../public/hero/` можна видалити.

Ця папка не входить у збірку сайту (виключена в `tsconfig.json`),
Netlify її не чіпає.

## Перерендерити (наприклад, після заміни фото в кільці)

Фото — `public/tower.jpg`. Замініть файл (або змініть назву в
`src/HeroMark.tsx`), потім:

```bash
cd hero-video
npm i
npx remotion studio            # перегляд у браузері, необов'язково

npx remotion render HeroMark out/hero-mark.mp4  --codec=h264 --crf=23 --scale=0.8
# webm — через ffmpeg (VP9 від Remotion падав у Chrome на Windows з помилкою декодування)
ffmpeg -i out/hero-mark.mp4 -c:v libvpx-vp9 -b:v 0 -crf 36 -pix_fmt yuv420p -row-mt 1 -an out/hero-mark.webm
```

Далі: `ffmpeg -i out/hero-mark.mp4 -c copy -movflags +faststart out/fs.mp4`
(щоб відео стартувало до повного завантаження) і покласти обидва файли
в `../public/hero/` з тими самими назвами. mp4 ≈ 0,49 МБ, webm ≈ 0,22 МБ, 1200×880. Сайт бере mp4, webm — запасний.

Якщо відео не завантажилось, сайт малює статичний знак кодом
(`StaticMark` у `components/home/HeroMark.tsx`). Фото там береться з
`lib/photos.ts` (PHOTOS.tower) — при заміні фото поміняйте і там.

Файли `hero-mark.webp` / `hero-mark.jpg` у `public/hero/` більше не
використовуються, їх можна видалити.

Краї кадру мають лишатися кольору `#140b33` — це фон першого екрана.
