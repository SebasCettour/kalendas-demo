import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface TimeSelectProps {
  id?: string;
  label?: string;
  value: string; // formato "HH:MM"
  onChange: (value: string) => void;
  minuteStep?: number; // intervalo entre opciones, en minutos
  minHour?: number;
  maxHour?: number;
  placeholder?: string;
}

function useClickOutside<T extends HTMLElement>(
  onClose: () => void,
  enabled: boolean,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [enabled, onClose]);

  return ref;
}

export default function TimeSelect({
  id,
  label,
  value,
  onChange,
  minuteStep = 15,
  minHour = 0,
  maxHour = 23,
  placeholder = "Seleccionar hora",
}: TimeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const containerRef = useClickOutside<HTMLDivElement>(
    () => setIsOpen(false),
    isOpen,
  );

  const opciones = useMemo(() => {
    const result: string[] = [];
    for (let h = minHour; h <= maxHour; h++) {
      for (let m = 0; m < 60; m += minuteStep) {
        result.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        );
      }
    }
    return result;
  }, [minHour, maxHour, minuteStep]);

  useEffect(() => {
    if (isOpen && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: "center" });
    }
  }, [isOpen]);

  const handleSelect = (hora: string) => {
    onChange(hora);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-medium text-slate-500"
        >
          {label}
        </label>
      )}

      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between rounded-xl border border-slate-300 px-4 py-3 text-sm bg-slate-50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none text-left transition"
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <Clock size={16} className="text-slate-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-30 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl py-1"
        >
          {opciones.map((hora) => {
            const isSelected = hora === value;
            return (
              <button
                key={hora}
                ref={isSelected ? selectedRef : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(hora)}
                className={
                  "w-full text-left px-4 py-2.5 text-sm transition " +
                  (isSelected
                    ? "bg-cyan-50 text-cyan-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100")
                }
              >
                {hora}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
