import Link from "next/link";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#F7F9FC" }}>
      <div className="card p-8 max-w-md text-center">
        <div className="mb-3 flex justify-center" style={{ color: "#17C7C8" }} aria-hidden>
          <MapPinOff size={44} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#062E73" }}>Página no encontrada</h1>
        <p className="text-sm mb-6" style={{ color: "#7B8794" }}>
          Esta URL no existe o ya no está disponible.
        </p>
        <Link href="/" className="btn-primary inline-block">Volver a inicio</Link>
      </div>
    </div>
  );
}
