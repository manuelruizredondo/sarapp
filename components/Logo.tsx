"use client";

/**
 * Logo Vacantia.
 * Pon en /public/:
 *   - logo.png       → versión horizontal (texto + isotipo)
 *   - logo-mark.png  → solo isotipo cuadrado (para el sidebar / favicon)
 */
export function LogoHorizontal({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Vacantia"
      className={className}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark.png"
      alt="Vacantia"
      width={size}
      height={size}
      style={{ display: "block" }}
    />
  );
}
