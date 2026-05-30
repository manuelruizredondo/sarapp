"use client";

/**
 * Spinner de bolas que orbitan en círculo (efecto cometa por la opacidad
 * graduada). Usa `animate-spin` de Tailwind para rotar todo el conjunto.
 */
export default function Spinner({
  size = 48,
  color = "#17C7C8",
}: {
  size?: number;
  color?: string;
}) {
  const dots = 8;
  const radius = size / 2 - size * 0.08;
  const dotSize = size * 0.16;

  return (
    <div
      className="relative animate-spin"
      style={{ height: size, width: size, animationDuration: "0.9s" }}
      role="status"
      aria-label="Cargando"
    >
      {Array.from({ length: dots }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            height: dotSize,
            width: dotSize,
            top: "50%",
            left: "50%",
            background: color,
            opacity: (i + 1) / dots,
            transform: `translate(-50%, -50%) rotate(${(360 / dots) * i}deg) translateY(-${radius}px)`,
          }}
        />
      ))}
    </div>
  );
}
