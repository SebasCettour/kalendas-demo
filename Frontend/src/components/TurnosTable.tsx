import { useEffect, useRef, type ReactNode } from "react";
import { Ban, CalendarCheck, Check, Clock3, Phone, X } from "lucide-react";

interface Turno {
  id_turno: number;
  fecha: string;
  hora: string;
  nombre: string;
  apellido: string;
  telefono: string;
  obra_social: string;
  prestacion: string;
  estado: "Pendiente" | "Confirmado" | "Presente" | "Ausente" | "Cancelado";
  es_sobreturno: boolean;
  is_deleted: boolean;
}

interface TurnosTableProps {
  turnos: Turno[];
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  isLoadingTurnos: boolean;
  selectedIds: Set<number>;
  onToggleTurnoSelection: (id: number) => void;
  onToggleAll: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onCambiarEstado: (id: number, estado: Turno["estado"]) => void;
  onCancelarTurno: (id: number) => void;
}

type EstadoStyle = {
  badge: string;
  icon: ReactNode;
};

const ESTADO_STYLES: Record<Turno["estado"], EstadoStyle> = {
  Presente: {
    badge: "bg-emerald-100 text-emerald-700",
    icon: <Check size={14} />,
  },
  Ausente: {
    badge: "bg-rose-100 text-rose-700",
    icon: <X size={14} />,
  },
  Cancelado: {
    badge: "bg-slate-200 text-slate-700",
    icon: <Ban size={14} />,
  },
  Confirmado: {
    badge: "bg-cyan-100 text-cyan-700",
    icon: <CalendarCheck size={14} />,
  },
  Pendiente: {
    badge: "bg-amber-100 text-amber-700",
    icon: <Clock3 size={14} />,
  },
};

const ESTADO_FALLBACK: EstadoStyle = {
  badge: "bg-slate-100 text-slate-500",
  icon: <Clock3 size={14} />,
};

function formatFechaLocal(fechaStr: string) {
  const soloFecha = fechaStr.split("T")[0]; // "2026-06-26"
  const [year, month, day] = soloFecha.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-AR");
}

function EstadoBadge({ estado }: { estado: Turno["estado"] }) {
  const config: EstadoStyle = ESTADO_STYLES[estado] ?? ESTADO_FALLBACK;

  return (
    <span
      className={
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap " +
        config.badge
      }
    >
      {config.icon}
      {estado || "Sin estado"}
    </span>
  );
}

function AccionesTurno({
  turno,
  onCambiarEstado,
  onCancelarTurno,
}: {
  turno: Turno;
  onCambiarEstado: (id: number, estado: Turno["estado"]) => void;
  onCancelarTurno: (id: number) => void;
}) {
  const handleCancelar = () => {
    const mensaje =
      "¿Cancelar el turno de " +
      turno.nombre +
      " " +
      turno.apellido +
      " del " +
      formatFechaLocal(turno.fecha) +
      " a las " +
      turno.hora +
      "?";

    const ok = window.confirm(mensaje);
    if (ok) onCancelarTurno(turno.id_turno);
  };

  const labelPresente =
    "Marcar a " + turno.nombre + " " + turno.apellido + " como presente";
  const labelAusente =
    "Marcar a " + turno.nombre + " " + turno.apellido + " como ausente";
  const labelCancelar =
    "Cancelar turno de " + turno.nombre + " " + turno.apellido;

  return (
    <div className="flex items-center gap-2">
      {turno.estado !== "Presente" && (
        <button
          type="button"
          onClick={() => onCambiarEstado(turno.id_turno, "Presente")}
          aria-label={labelPresente}
          title="Marcar como presente"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 active:bg-emerald-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <Check size={16} />
        </button>
      )}
      {turno.estado !== "Ausente" && (
        <button
          type="button"
          onClick={() => onCambiarEstado(turno.id_turno, "Ausente")}
          aria-label={labelAusente}
          title="Marcar como ausente"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 active:bg-rose-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          <X size={16} />
        </button>
      )}
      {turno.estado !== "Cancelado" && (
        <button
          type="button"
          onClick={handleCancelar}
          aria-label={labelCancelar}
          title="Cancelar turno"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 active:bg-slate-400 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <Ban size={16} />
        </button>
      )}
    </div>
  );
}

function TelefonoLink({ telefono }: { telefono: string }) {
  if (!telefono) {
    return <span className="text-slate-400">—</span>;
  }
  const url = "tel:" + telefono;
  return (
    <a href={url} className="hover:text-cyan-700 hover:underline">
      {telefono}
    </a>
  );
}

function rowTone(turno: Turno, isSelected: boolean) {
  if (isSelected) return "bg-cyan-50";
  if (turno.is_deleted) return "bg-slate-50 text-slate-500 opacity-80";
  if (turno.estado === "Cancelado")
    return "bg-slate-100 text-slate-400 opacity-60";
  if (turno.es_sobreturno) return "bg-orange-50 hover:bg-orange-100";
  return "hover:bg-slate-50";
}

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
      <CalendarCheck size={32} className="text-slate-300" />
      <p className="text-slate-400 text-sm">{mensaje}</p>
    </div>
  );
}

export default function TurnosTable({
  turnos,
  filteredCount,
  currentPage,
  totalPages,
  pageSize,
  isLoadingTurnos,
  selectedIds,
  onToggleTurnoSelection,
  onToggleAll,
  onPageChange,
  onPageSizeChange,
  onCambiarEstado,
  onCancelarTurno,
}: TurnosTableProps) {
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allSelected = turnos.length > 0 && selectedIds.size === turnos.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const hayTurnosCargados = filteredCount > 0;
  const hayResultadosFiltrados = filteredCount > 0;

  const pageButtons = [] as number[];
  const maxPageButtons = 7;
  const half = Math.floor(maxPageButtons / 2);

  if (totalPages <= maxPageButtons) {
    for (let i = 1; i <= totalPages; i += 1) {
      pageButtons.push(i);
    }
  } else {
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, currentPage + half);

    if (currentPage <= half + 1) {
      start = 1;
      end = maxPageButtons;
    } else if (currentPage >= totalPages - half) {
      start = totalPages - maxPageButtons + 1;
      end = totalPages;
    }

    for (let i = start; i <= end; i += 1) {
      pageButtons.push(i);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-cyan-50 border-b border-cyan-100 px-4 sm:px-6 py-2.5 text-sm text-cyan-800">
          <span>
            {selectedIds.size} turno{selectedIds.size > 1 ? "s" : ""}{" "}
            seleccionado
            {selectedIds.size > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="md:hidden divide-y divide-slate-100">
        {isLoadingTurnos ? (
          <div className="p-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : !hayTurnosCargados ? (
          <EmptyState mensaje="No hay turnos cargados." />
        ) : !hayResultadosFiltrados ? (
          <EmptyState mensaje="Ningún turno coincide con los filtros aplicados." />
        ) : (
          turnos.map((turno) => {
            const isSelected = selectedIds.has(turno.id_turno);
            const checkboxLabel =
              "Seleccionar turno de " + turno.nombre + " " + turno.apellido;

            return (
              <div
                key={turno.id_turno}
                className={"p-4 transition " + rowTone(turno, isSelected)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleTurnoSelection(turno.id_turno)}
                    aria-label={checkboxLabel}
                    className="mt-1 rounded h-4 w-4 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-800 truncate">
                        {turno.apellido}, {turno.nombre}
                      </p>
                      <EstadoBadge estado={turno.estado} />
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {formatFechaLocal(turno.fecha)} - {turno.hora} hs
                      {!!turno.es_sobreturno && (
                        <span className="ml-2 text-xs font-medium text-orange-600">
                          Sobreturno
                        </span>
                      )}
                    </p>

                    <p className="mt-1 text-sm text-slate-500 truncate">
                      {turno.prestacion} - {turno.obra_social}
                    </p>

                    {turno.telefono && (
                      <div className="mt-1 inline-flex items-center gap-1 text-sm text-cyan-700">
                        <Phone size={13} />
                        <TelefonoLink telefono={turno.telefono} />
                      </div>
                    )}

                    <div className="mt-3">
                      <AccionesTurno
                        turno={turno}
                        onCambiarEstado={onCambiarEstado}
                        onCancelarTurno={onCancelarTurno}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-center px-4 py-4 text-sm font-semibold text-slate-600 w-10">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  onChange={onToggleAll}
                  checked={allSelected}
                  disabled={!hayResultadosFiltrados}
                  aria-label="Seleccionar todos los turnos visibles"
                  className="rounded h-4 w-4"
                />
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Fecha
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Hora
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Paciente
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Obra Social
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Teléfono
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Prestación
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Estado
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoadingTurnos ? (
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td colSpan={9} className="px-6 py-4">
                    <div className="h-5 rounded bg-slate-100 animate-pulse" />
                  </td>
                </tr>
              ))
            ) : !hayTurnosCargados ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState mensaje="No hay turnos cargados." />
                </td>
              </tr>
            ) : !hayResultadosFiltrados ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState mensaje="Ningún turno coincide con los filtros aplicados." />
                </td>
              </tr>
            ) : (
              turnos.map((turno) => {
                const isSelected = selectedIds.has(turno.id_turno);
                const checkboxLabel =
                  "Seleccionar turno de " + turno.nombre + " " + turno.apellido;

                return (
                  <tr
                    key={turno.id_turno}
                    className={
                      "border-b border-slate-100 transition " +
                      rowTone(turno, isSelected)
                    }
                  >
                    <td className="text-center px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleTurnoSelection(turno.id_turno)}
                        aria-label={checkboxLabel}
                        className="rounded h-4 w-4"
                      />
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      {formatFechaLocal(turno.fecha)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      {turno.hora}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        {turno.apellido}, {turno.nombre}
                        {!!turno.es_sobreturno && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                            Sobreturno
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {turno.obra_social}
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">
                      <TelefonoLink telefono={turno.telefono} />
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {turno.prestacion}
                    </td>
                    <td className="px-6 py-4">
                      <EstadoBadge estado={turno.estado} />
                    </td>
                    <td className="px-6 py-4">
                      <AccionesTurno
                        turno={turno}
                        onCambiarEstado={onCambiarEstado}
                        onCancelarTurno={onCancelarTurno}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-600">
          Mostrando {turnos.length} de {filteredCount} turno{filteredCount !== 1 ? "s" : ""}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
            >
              ‹
            </button>

            {pageButtons.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium ${
                  page === currentPage
                    ? "border-cyan-500 bg-cyan-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 disabled:opacity-50"
            >
              ›
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <label htmlFor="pageSize" className="font-medium">
              Mostrar
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {[10, 15, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>por página</span>
          </div>
        </div>
      </div>
    </div>
  );
}
