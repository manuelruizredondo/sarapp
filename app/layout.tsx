import "./globals.css";
import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Vacantia · Vacaciones, descansos, bienestar",
  description: "Gestión de vacaciones, bajas, asistencias y permisos del equipo",
  icons: {
    // SVG favicon inline (sin necesidad de archivo)
    icon: [
      {
        url:
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#63E0DA"/><stop offset="1" stop-color="#17C7C8"/></linearGradient></defs><circle cx="32" cy="32" r="28" fill="none" stroke="url(#g)" stroke-width="3"/><path d="M14 40 Q32 56 50 40" stroke="#17C7C8" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M18 18 L32 46 L46 18" stroke="#062E73" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>`
          ),
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
