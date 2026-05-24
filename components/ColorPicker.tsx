"use client";
import { COLOR_PALETA } from "@/lib/types";

export default function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {COLOR_PALETA.map((c) => {
          const selected = value?.toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => onChange(c.hex)}
              title={c.name}
              className={
                "h-9 w-9 rounded-full border-2 transition-transform " +
                (selected
                  ? "border-slate-900 scale-110 ring-2 ring-slate-300"
                  : "border-white shadow hover:scale-105")
              }
              style={{ backgroundColor: c.hex }}
              aria-label={c.name}
            />
          );
        })}
        <label
          className="h-9 w-9 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50"
          title="Color personalizado"
        >
          <input
            type="color"
            value={value || "#3b82f6"}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 absolute w-9 h-9 cursor-pointer"
          />
          <span className="text-slate-500 text-xs">+</span>
        </label>
      </div>
      <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full border border-slate-200"
          style={{ backgroundColor: value || "#3b82f6" }}
        />
        <span className="font-mono">{(value || "#3b82f6").toLowerCase()}</span>
      </div>
    </div>
  );
}
