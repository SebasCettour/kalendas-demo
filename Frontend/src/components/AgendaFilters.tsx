import { FileSpreadsheet, Filter } from "lucide-react";

interface AgendaFiltersProps {
  fechaDesde: string;
  fechaHasta: string;
  mostrarCancelados: boolean;
  mostrarEliminados: boolean;
  isExporting: boolean;
  onFechaDesdeChange: (value: string) => void;
  onFechaHastaChange: (value: string) => void;
  onMostrarCanceladosChange: (value: boolean) => void;
  onMostrarEliminadosChange: (value: boolean) => void;
  onExportar: () => void;
}

export default function AgendaFilters({
  fechaDesde,
  fechaHasta,
  mostrarCancelados,
  mostrarEliminados,
  isExporting,
  onFechaDesdeChange,
  onFechaHastaChange,
  onMostrarCanceladosChange,
  onMostrarEliminadosChange,
  onExportar,
}: AgendaFiltersProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
          <Filter size={18} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Filtros de agenda
          </h2>
          <p className="text-sm text-slate-500">
            Filtrá los turnos y exportá la información.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="fechaDesde"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Fecha desde
            </label>

            <input
              id="fechaDesde"
              type="date"
              value={fechaDesde}
              onChange={(e) => onFechaDesdeChange(e.target.value)}
              className="
                w-full
                rounded-xl
                border border-slate-300
                px-4 py-3
                text-slate-700
                focus:outline-none
                focus:ring-2
                focus:ring-sky-500
                focus:border-sky-500
              "
            />
          </div>

          <div>
            <label
              htmlFor="fechaHasta"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Fecha hasta
            </label>

            <input
              id="fechaHasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => onFechaHastaChange(e.target.value)}
              className="
                w-full
                rounded-xl
                border border-slate-300
                px-4 py-3
                text-slate-700
                focus:outline-none
                focus:ring-2
                focus:ring-sky-500
                focus:border-sky-500
              "
            />
          </div>
        </div>

        {/* Opciones */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarCancelados}
              onChange={(e) => onMostrarCanceladosChange(e.target.checked)}
              className="h-4 w-4"
            />

            <span>Mostrar turnos cancelados</span>
          </label>

          <label className="flex items-center gap-3 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarEliminados}
              onChange={(e) => onMostrarEliminadosChange(e.target.checked)}
              className="h-4 w-4"
            />

            <span>Incluir turnos eliminados</span>
          </label>
        </div>

        {/* Botón */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onExportar}
            disabled={isExporting}
            className="
              w-full
              flex items-center justify-center gap-2
              bg-emerald-600
              hover:bg-emerald-700
              text-white
              font-medium
              px-4 py-3
              rounded-xl
              transition-colors
              disabled:opacity-70
              disabled:cursor-not-allowed
            "
          >
            <FileSpreadsheet size={18} />

            {isExporting ? "Exportando..." : "Exportar agenda a Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}
