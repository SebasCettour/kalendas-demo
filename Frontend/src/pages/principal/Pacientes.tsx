import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Loader2, Users } from "lucide-react";
import Header from "../../components/Header";
import api from "../../lib/api";
import toast from "react-hot-toast";

type Paciente = {
  id_paciente: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  dni: string | null;
  obra_social: string | null;
};

type PatientsResponse = {
  data: Paciente[];
  total: number;
  page: number;
  limit: number;
};

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 px-4 text-center">
      <Users size={32} className="text-slate-300" />
      <p className="text-slate-400 text-sm">{mensaje}</p>
    </div>
  );
}

export default function Pacientes() {
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPacientes, setTotalPacientes] = useState(0);

  const fetchPacientes = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get<PatientsResponse>("/pacientes", {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      setPacientes(response.data.data || []);
      setTotalPacientes(response.data.total || 0);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los pacientes.");
      setPacientes([]);
      setTotalPacientes(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  const buscarPacientes = useCallback(async (texto: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get<PatientsResponse>("/pacientes/search", {
        params: { search: texto, page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      setPacientes(response.data.data || []);
      setTotalPacientes(response.data.total || 0);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo realizar la búsqueda.");
      setPacientes([]);
      setTotalPacientes(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchPacientes();
  }, [fetchPacientes]);

  // Debounce: espera 350ms después de que el usuario deja de tipear
  useEffect(() => {
    const texto = busqueda.trim();

    const timer = setTimeout(() => {
      if (texto.length === 0) {
        fetchPacientes();
      } else {
        buscarPacientes(texto);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [busqueda, fetchPacientes, buscarPacientes]);

  const irADetalle = (id: number) => {
    navigate(`/pacientes/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <Header />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8 space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[0.03em] text-[#0A6BB8] leading-none">
            Pacientes
          </h1>
          <p className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-slate-500 font-medium">
            Administración de fichas de pacientes
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, apellido, DNI o teléfono"
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm bg-slate-50 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 outline-none"
            />
            {isLoading && (
              <Loader2
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Vista mobile */}
          <div className="md:hidden divide-y divide-slate-100">
            {isLoading && pacientes.length === 0 ? (
              <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : pacientes.length === 0 ? (
              <EmptyState mensaje="No se encontraron pacientes." />
            ) : (
              pacientes.map((p) => (
                <button
                  key={p.id_paciente}
                  onClick={() => irADetalle(p.id_paciente)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 transition"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {p.apellido}, {p.nombre}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {p.dni ? `DNI ${p.dni}` : "Sin DNI"}
                      {p.telefono ? ` · ${p.telefono}` : ""}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </button>
              ))
            )}
          </div>

          {/* Vista desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                    Paciente
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                    DNI
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                    Teléfono
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                    Obra Social
                  </th>
                  <th className="px-6 py-4 w-10" />
                </tr>
              </thead>
              <tbody>
                {isLoading && pacientes.length === 0 ? (
                  [0, 1, 2, 3].map((i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-5 rounded bg-slate-100 animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : pacientes.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState mensaje="No se encontraron pacientes." />
                    </td>
                  </tr>
                ) : (
                  pacientes.map((p) => (
                    <tr
                      key={p.id_paciente}
                      onClick={() => irADetalle(p.id_paciente)}
                      className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {p.apellido}, {p.nombre}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {p.dni || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {p.telefono || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {p.obra_social || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <ChevronRight size={18} className="text-slate-400" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Mostrando {pacientes.length} de {totalPacientes} pacientes
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
            >
              {[10, 15, 20, 30].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} por página
                </option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-2">
              {Array.from(
                { length: Math.max(1, Math.ceil(totalPacientes / limit)) },
                (_, index) => index + 1,
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                    pageNumber === page
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
