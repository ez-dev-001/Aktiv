import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

/**
 * Знак «АКТИВ» для першого екрана сайту: розімкнене кільце, у ньому
 * кадр, і стріла, що пробиває кільце наскрізь.
 *
 * Сцена (30 fps, 4.5 с):
 *   0–48   кільце промальовується, попереду світиться «комета»
 *   16–64  кадр відкривається ірисом з легкого наближення, у дуотоні
 *   58–86  стріла вилітає з-за кільця зліва, зі шлейфом
 *   ~74    удар: спалах у розриві кільця і хвиля від кільця
 *   86–125 відблиск ковзає по кільцю, світіння осідає
 *   125+   статичний фінальний кадр (він же постер на сайті)
 *
 * Краї кадру — рівно колір фону першого екрана (#140b33), тож на сайті
 * відео зливається з секцією, а маска по краях ховає дрібні розбіжності
 * кольору після стиснення.
 */

export const BG = "#140b33";
const ACCENT = "#fa2163";

/* Координати знака — ті самі, що в Logo.tsx (viewBox 0 0 250 183).
   Полотно 1500×1100, масштаб 5, знак по центру. */
const S = 5;
const OX = 26.5;
const OY = 19.5;
const px = (x: number) => (x + OX) * S;
const py = (y: number) => (y + OY) * S;

const CX = 87.5;
const CY = 90.5;
const R = 72;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** Кільце: від +20° за годинниковою стрілкою до +340° (розрив праворуч). */
const ringPoint = (t: number) => {
  const a = ((20 + 320 * t) * Math.PI) / 180;
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
};

export const HeroMark: React.FC = () => {
  const f = useCurrentFrame();

  // ── кільце ──
  const draw = interpolate(f, [3, 48], [0, 1], { ...clamp, easing: easeInOut });
  const head = ringPoint(draw);
  const cometOpacity = interpolate(f, [3, 8, 44, 54], [0, 1, 1, 0], clamp);

  // ── кадр ──
  const iris = interpolate(f, [16, 64], [0, 61], { ...clamp, easing: easeOut });
  const photoScale = interpolate(f, [16, 110], [1.32, 1.04], { ...clamp, easing: easeOut });
  const photoBright = interpolate(f, [16, 70], [0.35, 1], { ...clamp, easing: easeOut });

  // ── стріла ──
  // Пружний виліт: швидко, з ледь помітним перельотом і поверненням.
  const shoot = interpolate(f, [58, 84], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.2, 1.25, 0.32, 1),
  });
  const arrowX = (1 - shoot) * -245;
  const speed = Math.abs(
    interpolate(f, [58, 84], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 1.25, 0.32, 1) }) -
      interpolate(f - 1, [58, 84], [0, 1], { ...clamp, easing: Easing.bezier(0.2, 1.25, 0.32, 1) }),
  );
  const streak = Math.min(1, speed * 9);

  // ── удар ──
  const hit = 74;
  const flash = interpolate(f, [hit - 2, hit + 1, hit + 22], [0, 1, 0], clamp);
  const ripple = interpolate(f, [hit, hit + 36], [0, 1], { ...clamp, easing: easeOut });
  const pulse = interpolate(f, [hit - 1, hit + 3, hit + 20], [1, 1.018, 1], clamp);

  // ── відблиск по кільцю ──
  const sheen = interpolate(f, [86, 124], [-0.2, 1.2], { ...clamp, easing: easeInOut });

  // ── світіння ──
  const glow = interpolate(f, [0, 40, hit, hit + 12, 125], [0, 0.55, 0.7, 1, 0.78], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      {/* Світіння за знаком. Гасне до кольору фону задовго до краю кадру. */}
      <AbsoluteFill
        style={{
          opacity: glow,
          background: `radial-gradient(circle at ${px(CX + 18)}px ${py(CY)}px, rgba(250,33,99,0.30) 0px, rgba(120,40,140,0.16) 300px, rgba(60,34,120,0.10) 480px, rgba(20,11,51,0) 640px)`,
        }}
      />

      {/* Дуотон для кадру: тіні в колір фону, світло — у блідо-рожевий. */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="duo" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0 0 0 1 0"
          />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.078 0.40 0.90" />
            <feFuncG type="table" tableValues="0.043 0.16 0.70" />
            <feFuncB type="table" tableValues="0.20 0.42 0.84" />
          </feComponentTransfer>
        </filter>
      </svg>

      <AbsoluteFill style={{ scale: String(pulse), transformOrigin: `${px(CX)}px ${py(CY)}px` }}>
        {/* ── кадр у кільці, ірисом ── */}
        <div
          style={{
            position: "absolute",
            left: px(CX - 61),
            top: py(CY - 61),
            width: 122 * S,
            height: 122 * S,
            clipPath: `circle(${iris * S}px at 50% 50%)`,
            overflow: "hidden",
          }}
        >
          <Img
            src={staticFile("tower.jpg")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 40%",
              scale: String(photoScale),
              filter: `url(#duo) brightness(${photoBright}) contrast(1.06)`,
            }}
          />
          {/* Тінь донизу і рожевий відсвіт від стріли. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(20,11,51,0) 35%, rgba(20,11,51,0.55) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: interpolate(f, [hit - 4, hit + 6, 125], [0, 0.55, 0.22], clamp),
              background: `radial-gradient(circle at 92% 50%, rgba(250,33,99,0.55), rgba(250,33,99,0) 60%)`,
            }}
          />
        </div>

        <svg
          viewBox={`${-OX} ${-OY} 300 220`}
          width={1500}
          height={1100}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          <defs>
            <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.2" />
            </filter>
            <filter id="softer" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
            <linearGradient id="streak" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={ACCENT} stopOpacity="0" />
              <stop offset="1" stopColor="#ff7aa3" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient
              id="sheen"
              gradientUnits="userSpaceOnUse"
              x1={CX - 90 + sheen * 180}
              y1={CY - 90}
              x2={CX - 50 + sheen * 180}
              y2={CY + 90}
            >
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.75" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            {/* Стріла виходить «з-за» кільця: усе лівіше x=6 сховано. */}
            <clipPath id="arrowClip">
              <rect x="6" y="40" width="300" height="100" />
            </clipPath>
          </defs>

          {/* хвиля від кільця після удару */}
          <circle
            cx={CX}
            cy={CY}
            r={R + ripple * 34}
            fill="none"
            stroke={ACCENT}
            strokeWidth={interpolate(ripple, [0, 1], [5, 0.4])}
            opacity={interpolate(ripple, [0, 0.05, 1], [0, 0.55, 0], clamp)}
          />

          {/* тонка орбіта навколо знака: креслиться слідом за кільцем */}
          <circle
            cx={CX}
            cy={CY}
            r={88}
            fill="none"
            stroke="#fff"
            strokeOpacity={0.09}
            strokeWidth={0.45}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={interpolate(f, [26, 96], [1, 0], { ...clamp, easing: easeInOut })}
            transform={`rotate(200 ${CX} ${CY})`}
          />
          {[0, 90, 180, 270].map((deg) => (
            <circle
              key={deg}
              cx={CX + 88 * Math.cos((deg * Math.PI) / 180)}
              cy={CY + 88 * Math.sin((deg * Math.PI) / 180)}
              r={0.9}
              fill="#fff"
              opacity={interpolate(f, [70 + deg / 15, 86 + deg / 15], [0, 0.35], clamp)}
            />
          ))}

          {/* тонке внутрішнє кільце-обрамлення кадру */}
          <circle
            cx={CX}
            cy={CY}
            r={61.5}
            fill="none"
            stroke="#fff"
            strokeOpacity={interpolate(f, [40, 70], [0, 0.14], clamp)}
            strokeWidth={0.5}
          />

          {/* кільце: розмите підсвічування + саме кільце */}
          <path
            d="M155.2 115.1 A 72 72 0 1 1 155.2 65.9"
            fill="none"
            stroke={ACCENT}
            strokeWidth={13}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - draw}
            filter="url(#soft)"
            opacity={0.55}
          />
          <path
            d="M155.2 115.1 A 72 72 0 1 1 155.2 65.9"
            fill="none"
            stroke={ACCENT}
            strokeWidth={11}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - draw}
          />
          {/* відблиск, що пробігає по кільцю */}
          <path
            d="M155.2 115.1 A 72 72 0 1 1 155.2 65.9"
            fill="none"
            stroke="url(#sheen)"
            strokeWidth={11}
            opacity={interpolate(f, [86, 92, 118, 126], [0, 0.6, 0.6, 0], clamp)}
            style={{ mixBlendMode: "screen" }}
          />

          {/* комета на кінчику кільця */}
          <g opacity={cometOpacity}>
            {[0.06, 0.045, 0.03, 0.015].map((d, i) => {
              const p = ringPoint(Math.max(0, draw - d));
              return <circle key={i} cx={p.x} cy={p.y} r={4 + i} fill="#ff8fb1" opacity={0.12 + i * 0.08} filter="url(#soft)" />;
            })}
            <circle cx={head.x} cy={head.y} r={10} fill={ACCENT} filter="url(#soft)" opacity={0.9} />
            <circle cx={head.x} cy={head.y} r={4.2} fill="#ffe3ec" filter="url(#softer)" />
          </g>

          {/* стріла */}
          <g clipPath="url(#arrowClip)">
            {/* шлейф швидкості */}
            <rect
              x={15 + arrowX - 120 * streak}
              y={84.5}
              width={172 + 120 * streak}
              height={8}
              fill="url(#streak)"
              opacity={streak * 0.85}
              filter="url(#softer)"
            />
            {[3, 2, 1].map((k) => (
              <path
                key={k}
                d="M15 84.5 H187 L180.5 66 L237 88.5 L180.5 111 L187 92.5 H15 Z"
                fill={ACCENT}
                opacity={0.12 * streak}
                transform={`translate(${arrowX - k * 14 * streak} 0)`}
              />
            ))}
            <path
              d="M15 84.5 H187 L180.5 66 L237 88.5 L180.5 111 L187 92.5 H15 Z"
              fill={ACCENT}
              filter="url(#soft)"
              opacity={0.5}
              transform={`translate(${arrowX} 0)`}
            />
            <path
              d="M15 84.5 H187 L180.5 66 L237 88.5 L180.5 111 L187 92.5 H15 Z"
              fill={ACCENT}
              transform={`translate(${arrowX} 0)`}
            />
          </g>

          {/* спалах у розриві кільця */}
          <g opacity={flash}>
            <circle cx={158} cy={CY} r={26} fill={ACCENT} filter="url(#soft)" opacity={0.7} />
            <circle cx={158} cy={CY} r={11} fill="#fff" filter="url(#soft)" />
            <ellipse cx={158} cy={CY} rx={46} ry={1.6} fill="#fff" filter="url(#softer)" />
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
