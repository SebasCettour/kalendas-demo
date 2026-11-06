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
      className="fixed inset-x-0 bottom-0 z-[100] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-amber-400 px-3 py-2 text-center text-xs sm:text-sm font-medium text-amber-950 shadow-[0_-2px_10px_rgba(0,0,0,0.15)]"
    >
      <span>Versión demo: los datos son ficticios</span>
      {confirming ? (
        <span className="flex items-center gap-2">
          ¿Restablecer todo?
          <button
            type="button"
            onClick={reset}
            className="rounded bg-amber-950 px-2 py-0.5 text-amber-50 hover:bg-amber-900"
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded border border-amber-950 px-2 py-0.5 hover:bg-amber-300"
          >
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="underline underline-offset-2 hover:no-underline"
        >
          Restablecer datos de demo
        </button>
      )}
    </div>
  );
}
