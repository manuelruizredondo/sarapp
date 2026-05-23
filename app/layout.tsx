import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import SupabaseBanner from "@/components/SupabaseBanner";

export const metadata: Metadata = {
  title: "Sarapp · Control de ausencias",
  description: "Gestión de vacaciones, bajas, asistencias y permisos del equipo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
            <SupabaseBanner />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
