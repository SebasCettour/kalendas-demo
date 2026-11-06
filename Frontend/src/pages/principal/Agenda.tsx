import { useEffect, useRef, useState, useCallback } from "react";
import Header from "../../components/Header";
import api from "../../lib/api";
import NewPatientModal from "../../components/NewPatientModal";
import AgendaFilters from "../../components/AgendaFilters";
import TurnosTable from "../../components/TurnosTable";
import TimeSelect from "../../components/TimeSelect";
import {
  ChevronDown,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  Search,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";

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

type Prestacion = {
  id_prestacion: number;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
};

type Paciente = {
  id_paciente: number;
  nombre: string;
  apellido: string;
  telefono: string;
  obra_social: string;
};

type NuevoTurnoForm = {
  fecha: string;
  hora: string;
  id_paciente: string;
  paciente_manual: string;
  nombre: string;
  apellido: string;
  telefono: string;
  dni: string;
  id_obra_social: string;
  id_prestacion: string;
};

const ESTADOS = [
  "Pendiente",
  "Confirmado",
  "Presente",
  "Ausente",
  "Cancelado",
] as const;

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

export default function Agenda() {
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isLoadingTurnos, setIsLoadingTurnos] = useState(false);
  const [isCreatingTurno, setIsCreatingTurno] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isConfirmingSobreturno, setIsConfirmingSobreturno] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPacienteListOpen, setIsPacienteListOpen] = useState(false);

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [totalTurnos, setTotalTurnos] = useState(0);
  const [prestaciones, setPrestaciones] = useState<Prestacion[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [mostrarCancelados, setMostrarCancelados] = useState(true);
  const [mostrarEliminados, setMostrarEliminados] = useState(false);

  const [pendingTurnoData, setPendingTurnoData] = useState<{
    fecha: string;
    hora: string;
    id_prestacion: number;
  } | null>(null);

  const [sobreturnoPendiente, setSobreturnoPendiente] = useState<{
    fecha: string;
    hora: string;
    id_paciente: number;
    id_prestacion: number;
  } | null>(null);

  const [nuevoTurno, setNuevoTurno] = useState<NuevoTurnoForm>({
    fecha: "",
    hora: "",
    id_paciente: "",
    paciente_manual: "",
    nombre: "",
    apellido: "",
    telefono: "",
    dni: "",
    id_obra_social: "",
    id_prestacion: "",
  });

  const selectorDropdownRef = useClickOutside<HTMLDivElement>(
    () => setIsFilterOpen(false),
    isFilterOpen,
  );
  const pacienteDropdownRef = useClickOutside<HTMLDivElement>(
    () => setIsPacienteListOpen(false),
    isPacienteListOpen,
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No hay sesión activa. Por favor inicia sesión.");
    }
    fetchTurnos();
    fetchPrestaciones();
    fetchPacientes();
  }, []);

  useEffect(() => {
    fetchTurnos();
  }, [mostrarEliminados, currentPage, pageSize, fechaDesde, fechaHasta, mostrarCancelados]);

  useEffect(() => {
    setCurrentPage(1);
  }, [fechaDesde, fechaHasta, mostrarCancelados, mostrarEliminados, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalTurnos / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, pageSize, totalTurnos]);

  const buildQueryString = (extraParams: Record<string, string> = {}) => {
    const params = new URLSearchParams();

    if (mostrarEliminados) {
      params.set("includeDeleted", "true");
    }

    if (!mostrarCancelados) {
      params.set("mostrarCancelados", "false");
    }

    if (fechaDesde) {
      params.set("fechaDesde", fechaDesde);
    }

    if (fechaHasta) {
      params.set("fechaHasta", fechaHasta);
    }

    params.set("page", String(currentPage));
    params.set("limit", String(pageSize));

    Object.entries(extraParams).forEach(([key, value]) => {
      params.set(key, value);
    });

    const query = params.toString();
    return query.length > 0 ? `?${query}` : "";
  };

  const fetchTurnos = async () => {
    try {
      setIsLoadingTurnos(true);
      const token = localStorage.getItem("token");
      const response = await api.get(`/turnos${buildQueryString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTurnos(response.data.data);
      setTotalTurnos(response.data.total || 0);
    } catch (error: any) {
      console.error(error);
      toast.error("No se pudieron cargar los turnos.");
      setTurnos([]);
      setTotalTurnos(0);
    } finally {
      setIsLoadingTurnos(false);
    }
  };

  const fetchPrestaciones = async () => {
    try {
      const response = await api.get("/prestaciones");
      setPrestaciones(response.data);
    } catch {
      toast.error("No se pudieron cargar las prestaciones.");
    }
  };

  const fetchPacientes = useCallback(async (searchTerm = "") => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Token no encontrado. Inicia sesión nuevamente.");
        return;
      }

      const params: Record<string, any> = { page: 1, limit: 30 };
      const endpoint = searchTerm.trim().length > 0 ? "/pacientes/search" : "/pacientes";
      if (searchTerm.trim().length > 0) {
        params.search = searchTerm.trim();
      }

      const response = await api.get(endpoint, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });

      const patientsFromApi = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setPacientes(patientsFromApi);
    } catch (error: any) {
      console.error("Error en /pacientes:", error);
      if (error.response?.status === 400) {
        toast.error(
          "Error 400 al cargar pacientes. Verifica el token o contacta al administrador.",
        );
      } else if (error.response?.status === 401) {
        toast.error("Sesión expirada. Inicia sesión nuevamente.");
      } else {
        toast.error("No se pudieron cargar los pacientes.");
      }
      setPacientes([]);
    }
  }, []);

  useEffect(() => {
    const query = nuevoTurno.paciente_manual.trim();
    if (query.length <= 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      fetchPacientes(query);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [nuevoTurno.paciente_manual, fetchPacientes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setNuevoTurno((prev) => ({ ...prev, [name]: value }));
  };

  const handlePacienteInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const parts = value.trim().split(/\s+/).filter(Boolean);

    const apellido = parts[0] || "";
    const nombre = parts.slice(1).join(" ") || "";

    setNuevoTurno((prev) => ({
      ...prev,
      paciente_manual: value,
      id_paciente: "",
      nombre,
      apellido,
    }));
    setIsPacienteListOpen(true);
  };

  const seleccionarPacienteExistente = (paciente: Paciente) => {
    setNuevoTurno({
      ...nuevoTurno,
      id_paciente: String(paciente.id_paciente),
      paciente_manual: `${paciente.apellido}, ${paciente.nombre}`,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      telefono: paciente.telefono || "",
    });
    setIsPacienteListOpen(false);
  };

  const tienePacienteExistente = !!nuevoTurno.id_paciente;
  const tieneDatosNuevoPaciente =
    !!nuevoTurno.nombre.trim() && !!nuevoTurno.apellido.trim();

  const formularioCompleto =
    !!nuevoTurno.fecha &&
    !!nuevoTurno.hora &&
    !!nuevoTurno.id_prestacion &&
    (tienePacienteExistente || tieneDatosNuevoPaciente);

  const crearTurno = useCallback(
    async (id_paciente: number, esSobreturno: boolean = false) => {
      try {
        setIsCreatingTurno(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");

        await api.post(
          "/turnos",
          {
            fecha: nuevoTurno.fecha,
            hora: nuevoTurno.hora,
            id_paciente,
            id_prestacion: Number(nuevoTurno.id_prestacion),
            es_sobreturno: esSobreturno,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        toast.success(
          esSobreturno
            ? "Sobreturno creado correctamente"
            : "Turno agendado correctamente",
        );

        await fetchTurnos();
        await fetchPacientes();

        setNuevoTurno({
          fecha: "",
          hora: "",
          id_paciente: "",
          paciente_manual: "",
          nombre: "",
          apellido: "",
          telefono: "",
          dni: "",
          id_obra_social: "",
          id_prestacion: "",
        });

        setPendingTurnoData(null);
        setSobreturnoPendiente(null);
        setIsConfirmingSobreturno(false);
      } catch (error: any) {
        if (error?.response?.status === 409) {
          toast.error(error.response.data?.message || "Conflicto de horario");
        } else {
          toast.error("No se pudo agendar el turno");
        }
      } finally {
        setIsCreatingTurno(false);
      }
    },
    [nuevoTurno],
  );

  const agregarTurno = async () => {
    if (!formularioCompleto) {
      toast.error("Completá fecha, hora, paciente y prestación.");
      return;
    }

    const hayConflicto = turnos.some((t) => {
      const fechaTurno = t.fecha.split("T")[0];
      const horaTurno = t.hora.substring(0, 5);
      return (
        fechaTurno === nuevoTurno.fecha &&
        horaTurno === nuevoTurno.hora &&
        t.estado !== "Cancelado" &&
        !t.is_deleted
      );
    });

    if (tienePacienteExistente) {
      const idPaciente = Number(nuevoTurno.id_paciente);
      if (hayConflicto) {
        setSobreturnoPendiente({
          fecha: nuevoTurno.fecha,
          hora: nuevoTurno.hora,
          id_paciente: idPaciente,
          id_prestacion: Number(nuevoTurno.id_prestacion),
        });
        setIsConfirmingSobreturno(true);
        return;
      }
      await crearTurno(idPaciente);
    } else {
      setPendingTurnoData({
        fecha: nuevoTurno.fecha,
        hora: nuevoTurno.hora,
        id_prestacion: Number(nuevoTurno.id_prestacion),
      });
      setIsPatientModalOpen(true);
    }
  };

  const handlePatientCreated = (newPatientId: number) => {
    console.log("handlePatientCreated llamado con id:", newPatientId);
    console.log("pendingTurnoData:", pendingTurnoData);
    setIsPatientModalOpen(false);
    if (!pendingTurnoData) {
      console.log("⚠️ pendingTurnoData es null, no se crea el turno");
      return;
    }

    const hayConflicto = turnos.some((t) => {
      const fechaTurno = t.fecha.split("T")[0];
      const horaTurno = t.hora.substring(0, 5);
      return (
        fechaTurno === pendingTurnoData.fecha &&
        horaTurno === pendingTurnoData.hora &&
        t.estado !== "Cancelado" &&
        !t.is_deleted
      );
    });

    if (hayConflicto) {
      setSobreturnoPendiente({
        fecha: pendingTurnoData.fecha,
        hora: pendingTurnoData.hora,
        id_paciente: newPatientId,
        id_prestacion: pendingTurnoData.id_prestacion,
      });
      setIsConfirmingSobreturno(true);
    } else {
      crearTurno(newPatientId);
    }
  };

  const toggleTurnoSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === turnos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(turnos.map((t) => t.id_turno)));
    }
  };

  const cambiarEstado = async (id: number, estado: Turno["estado"]) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(
        `/turnos/${id}/status`,
        { estado },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchTurnos();
    } catch {
      toast.error("No se pudo actualizar el estado.");
    }
  };

  const cancelarTurno = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await api.patch(
        `/turnos/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchTurnos();
    } catch {
      toast.error("No se pudo cancelar el turno.");
    }
  };

  const deleteTurnos = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem("token");
      await api.patch(
        "/turnos/delete/bulk",
        { ids },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`${ids.length} turno(s) eliminado(s)`);
      setSelectedIds(new Set());
      setIsConfirmingDelete(false);
      await fetchTurnos();
    } catch {
      toast.error("No se pudieron eliminar los turnos.");
    } finally {
      setIsDeleting(false);
    }
  };

  const pacientesArray = Array.isArray(pacientes) ? pacientes : [];

  const pacientesFiltrados = pacientesArray
    .filter(
      (p) =>
        `${p.apellido} ${p.nombre}`
          .toLowerCase()
          .includes(nuevoTurno.paciente_manual.toLowerCase()) ||
        `${p.nombre} ${p.apellido}`
          .toLowerCase()
          .includes(nuevoTurno.paciente_manual.toLowerCase()),
    )
    .slice(0, 10);

  const totalPages = Math.max(1, Math.ceil(totalTurnos / pageSize));

  const exportarExcel = async () => {
    try {
      setIsExporting(true);
      const token = localStorage.getItem("token");
      const response = await api.get(`/turnos${buildQueryString({ exportAll: "true" })}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const rows: Turno[] = response.data.data;
      if (!rows || rows.length === 0) {
        toast.error("No hay turnos para exportar.");
        return;
      }

      const datos = rows.map((turno) => ({
        Fecha: new Date(turno.fecha).toLocaleDateString("es-AR"),
        Hora: turno.hora,
        Paciente: `${turno.apellido}, ${turno.nombre}`,
        Teléfono: turno.telefono,
        ObraSocial: turno.obra_social,
        Prestación: turno.prestacion,
        Estado: turno.estado,
      }));

      const worksheet = XLSX.utils.json_to_sheet(datos);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Turnos");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const file = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(file, `turnos_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel exportado correctamente.");
    } catch {
      toast.error("Error al exportar.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <Header />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8 space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.03em] text-[#0A6BB8] leading-none">
            Agenda
          </h1>
          <p className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-slate-500 font-medium">
            Gestión de turnos y pacientes
          </p>
        </div>

        <AgendaFilters
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          mostrarCancelados={mostrarCancelados}
          mostrarEliminados={mostrarEliminados}
          isExporting={isExporting}
          onFechaDesdeChange={setFechaDesde}
          onFechaHastaChange={setFechaHasta}
          onMostrarCanceladosChange={setMostrarCancelados}
          onMostrarEliminadosChange={(checked) => {
            setMostrarEliminados(checked);
            if (!checked) setSelectedIds(new Set());
          }}
          onExportar={exportarExcel}
        />

        {/* Formulario Nuevo Turno */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
          <h2 className="mb-6 text-xl sm:text-2xl font-semibold tracking-[0.02em] text-slate-800">
            Nuevo Turno
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="fecha"
                className="mb-1.5 block text-xs font-medium text-slate-500"
              >
                Fecha
              </label>
              <input
                id="fecha"
                type="date"
                name="fecha"
                value={nuevoTurno.fecha}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-slate-50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none"
              />
            </div>

            <div>
              <TimeSelect
                id="hora"
                label="Hora"
                value={nuevoTurno.hora}
                onChange={(hora) =>
                  setNuevoTurno((prev) => ({ ...prev, hora }))
                }
                minuteStep={15}
              />
            </div>

            <div
              ref={pacienteDropdownRef}
              className="relative sm:col-span-2 xl:col-span-1"
            >
              <label
                htmlFor="paciente_manual"
                className="mb-1.5 block text-xs font-medium text-slate-500"
              >
                Paciente
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="paciente_manual"
                  type="text"
                  placeholder="Buscar o escribir nombre y apellido"
                  value={nuevoTurno.paciente_manual}
                  onChange={handlePacienteInput}
                  onFocus={() => setIsPacienteListOpen(true)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-4 py-3 text-sm bg-slate-50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none"
                />
              </div>

              {tienePacienteExistente && (
                <p className="mt-1.5 text-xs text-emerald-600 font-medium">
                  ✓ Paciente seleccionado
                </p>
              )}

              {!tienePacienteExistente && tieneDatosNuevoPaciente && (
                <p className="mt-1.5 text-xs text-amber-600 font-medium">
                  ⚠ No encontrado. Se creará una ficha nueva con estos datos al
                  agendar.
                </p>
              )}

              {isPacienteListOpen && nuevoTurno.paciente_manual.length > 1 && (
                <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-72 overflow-auto">
                  {pacientesFiltrados.length > 0 ? (
                    pacientesFiltrados.map((p) => (
                      <button
                        key={p.id_paciente}
                        type="button"
                        onClick={() => seleccionarPacienteExistente(p)}
                        className="w-full text-left px-4 py-3 hover:bg-cyan-50 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="font-medium text-slate-800">
                          {p.apellido}, {p.nombre}
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.telefono || "Sin teléfono"}
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-slate-500">
                      No encontrado. Escribe nombre y apellido para crear uno
                      nuevo.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="id_prestacion"
                className="mb-1.5 block text-xs font-medium text-slate-500"
              >
                Prestación
              </label>
              <select
                id="id_prestacion"
                name="id_prestacion"
                value={nuevoTurno.id_prestacion}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-slate-50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none"
              >
                <option value="">Seleccionar prestación</option>
                {prestaciones.map((p) => (
                  <option key={p.id_prestacion} value={p.id_prestacion}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={agregarTurno}
              disabled={isCreatingTurno || !formularioCompleto}
              className="flex-1 sm:flex-none bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-400 text-white font-semibold px-8 py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isCreatingTurno && (
                <Loader2 size={18} className="animate-spin" />
              )}
              {isCreatingTurno ? "Agendando..." : "Agendar Turno"}
            </button>

            <button
              onClick={() => setIsPatientModalOpen(true)}
              className="flex-1 sm:flex-none border border-slate-300 hover:bg-slate-50 px-6 py-3 rounded-xl font-semibold text-slate-700 transition"
            >
              Nuevo Paciente
            </button>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
            <div ref={selectorDropdownRef} className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50"
              >
                <span>Seleccionar</span>
                <ChevronDown
                  size={16}
                  className={isFilterOpen ? "rotate-180" : ""}
                />
              </button>
              {isFilterOpen && (
                <div className="absolute z-20 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  <button
                    onClick={() => {
                      toggleAll();
                      setIsFilterOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100"
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIds(new Set());
                      setIsFilterOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100"
                  >
                    Ninguna
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
            >
              <Trash2 size={18} />
            </button>

            <span className="text-sm text-slate-600">
              {selectedIds.size} seleccionado{selectedIds.size > 1 ? "s" : ""}
            </span>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-sm text-slate-400 hover:text-slate-600"
            >
              Limpiar
            </button>
          </div>
        )}

        <TurnosTable
          turnos={turnos}
          filteredCount={totalTurnos}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          isLoadingTurnos={isLoadingTurnos}
          selectedIds={selectedIds}
          onToggleTurnoSelection={toggleTurnoSelection}
          onToggleAll={toggleAll}
          onCambiarEstado={cambiarEstado}
          onCancelarTurno={cancelarTurno}
        />

        <NewPatientModal
          isOpen={isPatientModalOpen}
          onClose={() => {
            setIsPatientModalOpen(false);
            setPendingTurnoData(null);
          }}
          initialData={
            tieneDatosNuevoPaciente
              ? {
                  nombre: nuevoTurno.nombre,
                  apellido: nuevoTurno.apellido,
                  telefono: nuevoTurno.telefono,
                  dni: nuevoTurno.dni || undefined,
                }
              : undefined
          }
          turnoContexto={
            pendingTurnoData
              ? {
                  fecha: pendingTurnoData.fecha,
                  hora: pendingTurnoData.hora,
                  prestacionNombre: prestaciones.find(
                    (p) => p.id_prestacion === pendingTurnoData.id_prestacion,
                  )?.nombre,
                }
              : undefined
          }
          onPatientCreated={handlePatientCreated}
        />

        {isConfirmingSobreturno && sobreturnoPendiente && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden border-2 border-orange-400">
              <div className="p-6 border-b border-orange-400 bg-orange-50">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-8 h-8 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="text-xl font-bold text-orange-900">
                      Confirmar Sobreturno
                    </h3>
                    <p className="mt-2 text-orange-800">
                      Ya existe un turno el{" "}
                      {new Date(sobreturnoPendiente.fecha).toLocaleDateString(
                        "es-AR",
                      )}{" "}
                      a las {sobreturnoPendiente.hora}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 flex gap-3">
                <button
                  onClick={() => setIsConfirmingSobreturno(false)}
                  className="flex-1 py-3 border border-slate-300 rounded-2xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() =>
                    crearTurno(sobreturnoPendiente.id_paciente, true)
                  }
                  className="flex-1 py-3 bg-orange-600 text-white rounded-2xl font-semibold hover:bg-orange-700"
                >
                  Crear Sobreturno
                </button>
              </div>
            </div>
          </div>
        )}

        {isConfirmingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-red-400">
              <h3 className="text-xl font-bold text-red-900">
                Confirmar eliminación
              </h3>
              <p className="mt-3">
                Se van a eliminar {selectedIds.size} turno(s).
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 py-3 border border-slate-300 rounded-2xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteTurnos}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl"
                >
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
