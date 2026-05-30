"use client";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({
  title,
  children,
  onClose,
  size = "md",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    // Mover el foco al diálogo al abrirlo (accesibilidad / lectores de pantalla).
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const widths: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(4, 27, 69, 0.45)" }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={"bg-white rounded-2xl w-full outline-none " + widths[size] + " shadow-soft"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5EAF2" }}>
          <h3 id={titleId} className="font-semibold" style={{ color: "#062E73" }}>{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" style={{ color: "#7B8794" }}>
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
