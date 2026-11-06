import { useState } from "react";
import { resetDemoData } from "../demo/store";

export default function DemoBanner() {
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
    resetDemoData();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign("/");
  };

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[100] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-cyan-100 bg-cyan-50 px-3 py-2 text-center text-xs font-medium text-slate-700 shadow-[0_-2px_10px_rgba(15,23,42,0.06)] sm:text-sm"
    >
      <span>Versión demo: los datos son ficticios</span>
      {confirming ? (
        <span className="flex items-center gap-2">
          ¿Restablecer todo?
          <button
            type="button"
            onClick={reset}
            className="rounded bg-[#0A6BB8] px-2 py-0.5 text-white hover:bg-[#095b9a]"
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded border border-slate-300 px-2 py-0.5 text-slate-700 hover:bg-white"
          >
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="font-semibold text-[#0A6BB8] underline underline-offset-2 hover:text-[#095b9a] hover:no-underline"
        >
          Restablecer datos de demo
        </button>
      )}
    </div>
  );
}
