"use client";

/**
 * Logo Vacantia (SVG inline por defecto).
 *
 * Si quieres usar PNGs personalizados, ponlos en /public/ con estos nombres
 * y cambia la constante USE_PNG a true:
 *   - /public/logo.png       → versión horizontal (texto + isotipo)
 *   - /public/logo-mark.png  → solo isotipo cuadrado
 */
const USE_PNG = false;

const PRIMARY = "#062E73";
const ACCENT = "#17C7C8";
const ACCENT_LIGHT = "#63E0DA";

function MarkSVG({ size = 36 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vacantia"
    >
      <defs>
        <linearGradient id={`vac-ring-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ACCENT_LIGHT} />
          <stop offset="100%" stopColor={ACCENT} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="none" stroke={`url(#vac-ring-${size})`} strokeWidth="3" />
      <path d="M14 40 Q32 56 50 40" stroke={ACCENT} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M18 18 L32 46 L46 18" stroke={PRIMARY} strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <g transform="translate(38 16)">
        <path d="M0 0 C 1 5 1 10 0 16" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M0 0 C -4 -2 -7 -2 -8 0" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M0 0 C 4 -2 7 -2 8 0" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M0 0 C 2 -4 4 -6 6 -7" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M0 0 C -2 -4 -4 -6 -6 -7" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function HorizontalSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 70"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vacantia"
    >
      <defs>
        <linearGradient id="vac-ring-h" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ACCENT_LIGHT} />
          <stop offset="100%" stopColor={ACCENT} />
        </linearGradient>
      </defs>
      <g transform="translate(0 3)">
        <circle cx="32" cy="32" r="28" fill="none" stroke="url(#vac-ring-h)" strokeWidth="3" />
        <path d="M14 40 Q32 56 50 40" stroke={ACCENT} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M18 18 L32 46 L46 18" stroke={PRIMARY} strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <g transform="translate(38 16)">
          <path d="M0 0 C 1 5 1 10 0 16" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M0 0 C -4 -2 -7 -2 -8 0" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M0 0 C 4 -2 7 -2 8 0" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M0 0 C 2 -4 4 -6 6 -7" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M0 0 C -2 -4 -4 -6 -6 -7" stroke={ACCENT} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      </g>
      <text x="78" y="40" fontFamily="ui-sans-serif, -apple-system, 'Segoe UI', Arial, sans-serif"
        fontSize="34" fontWeight="700" letterSpacing="-1" fill={PRIMARY}>vacantia</text>
      <text x="79" y="58" fontFamily="ui-sans-serif, -apple-system, 'Segoe UI', Arial, sans-serif"
        fontSize="7" letterSpacing="2.5" fontWeight="600" fill={ACCENT}>
        VACACIONES · DESCANSOS · BIENESTAR
      </text>
    </svg>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  if (USE_PNG) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/logo-mark.png" alt="Vacantia" width={size} height={size} style={{ display: "block" }} />
    );
  }
  return <MarkSVG size={size} />;
}

export function LogoHorizontal({ className = "" }: { className?: string }) {
  if (USE_PNG) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/logo.png" alt="Vacantia" className={className} style={{ maxWidth: "100%", height: "auto" }} />
    );
  }
  return <HorizontalSVG className={className} />;
}
