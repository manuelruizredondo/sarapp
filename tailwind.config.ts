import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Vacantia
        brand: {
          50:  "#eef4ff",
          100: "#dbe6ff",
          200: "#b8ccff",
          400: "#3b5fa6",
          500: "#1d418c",
          600: "#062E73",   // Azul Corporativo (Primary)
          700: "#052561",
          800: "#041B45",   // Azul Oscuro Profundo
          900: "#020f2b",
        },
        accent: {
          50:  "#e6fbfb",
          100: "#c4f5f5",
          200: "#9aedee",
          300: "#63E0DA",   // Turquesa Claro
          400: "#2fd1d2",
          500: "#17C7C8",   // Turquesa Principal (Accent)
          600: "#0fa7a8",
          700: "#0c8485",
        },
        ink: {
          DEFAULT: "#1F2937", // Gris texto principal
          muted: "#7B8794",   // Gris texto secundario
        },
        line: "#E5EAF2",     // Gris claro bordes
        bg: "#F7F9FC",       // Fondo principal
        success: "#16C784",
        warning: "#F5B700",
        danger:  "#E5484D",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(6, 46, 115, 0.04), 0 1px 3px rgba(6, 46, 115, 0.06)",
        soft: "0 4px 12px rgba(6, 46, 115, 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
