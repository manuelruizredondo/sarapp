"use client";
import { useState } from "react";

/**
 * Logo Vacantia.
 *
 * Por defecto se renderiza como SVG inline (no depende de archivos), pero
 * si pones `logo.png` o `logo-mark.png` en /public/ se usarán esos en su lugar.
 */

const PRIMARY = "#062E73";
const ACCENT = "#17C7C8";
const ACCENT_LIGHT = "#63E0DA";

function VacantiaMarkSVG({ size = 36 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vacantia"
    >
      <defs>
        <linearGradient id="vac-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ACCENT_LIGHT} />
          <stop offset="100%" stopColor={ACCENT} />
        </linearGradient>
      </defs>
      {/* círculo turquesa */}
      <circle cx="32" cy="32" r="28" fill="none" stroke="url(#vac-ring)" strokeWidth="3" />
      {/* hamaca / sonrisa abajo */}
      <path d="M14 40 Q32 56 50 40" stroke={ACCENT} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* V */}
      <path d="M18 18 L32 46 L46 18" stroke={PRIMARY} strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {/* palmera (tronco + hojas) */}
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

function VacantiaHorizontalSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 70"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Vacantia"
    >
      {/* mark a la izquierda */}
      <g transform="translate(0 3)">
        <VacantiaMarkInner />
      </g>
      {/* wordmark */}
      <text
        x="78"
        y="40"
        fontFamily="ui-sans-serif, -apple-system, 'Segoe UI', Arial, sans-serif"
        fontSize="34"
        fontWeight="700"
        letterSpacing="-1"
        fill={PRIMARY}
      >
        vacantia
      </text>
      <text
        x="79"
        y="58"
        fontFamily="ui-sans-serif, -apple-system, 'Segoe UI', Arial, sans-serif"
        fontSize="7"
        letterSpacing="2.5"
        fontWeight="600"
        fill={ACCENT}
      >
        VACACIONES · DESCANSOS · BIENESTAR
      </text>
    </svg>
  );
}

// Versión interna sin <svg> wrap, para componer dentro del horizontal
function VacantiaMarkInner() {
  return (
    <g>
      <defs>
        <linearGradient id="vac-ring-h" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={ACCENT_LIGHT} />
          <stop offset="100%" stopColor={ACCENT} />
        </linearGradient>
      </defs>
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
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  const [pngOk, setPngOk] = useState(true);
  return (
    <span style={{ display: "inline-block", width: size, height: size }}>
      {pngOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo-mark.png"
          alt="Vacantia"
          width={size}
          height={size}
          style={{ display: "block" }}
          onError={() => setPngOk(false)}
        />
      ) : (
        <VacantiaMarkSVG size={size} />
      )}
    </span>
  );
}

export function LogoHorizontal({ className = "" }: { className?: string }) {
  const [pngOk, setPngOk] = useState(true);
  if (pngOk) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo.png"
        alt="Vacantia"
        className={className}
        style={{ maxWidth: "100%", height: "auto" }}
        onError={() => setPngOk(false)}
      />
    );
  }
  return <VacantiaHorizontalSVG className={className} />;
}
