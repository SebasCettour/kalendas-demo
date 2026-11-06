// Cliente de datos de la DEMO: misma interfaz que usaban los componentes (get/post/put/patch/delete)
// pero resuelto 100% en el navegador sobre un store en localStorage. No realiza requests de red.
import { loadDb, saveDb } from "../demo/store";
import {
  DEMO_USER,
  OBRAS_SOCIALES,
  PRESTACIONES,
  type Estado,
  type PacienteRecord,
  type TurnoRecord,
} from "../demo/seed";

interface RequestConfig {
  params?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

class DemoHttpError extends Error {
  response: { status: number; data: { message: string } };

  constructor(status: number, message: string) {
    super(message);
    this.response = { status, data: { message } };
  }
}

type Query = Record<string, string>;
type Body = Record<string, any>;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function toTurnoRow(t: TurnoRecord) {
  const db = loadDb();
  const p = db.pacientes.find((x) => x.id_paciente === t.id_paciente);
  const os = OBRAS_SOCIALES.find((o) => o.id_obra_social === p?.id_obra_social);
  const pr = PRESTACIONES.find((x) => x.id_prestacion === t.id_prestacion);
  return {
    id_turno: t.id_turno,
    fecha: `${t.fecha}T12:00:00`,
    hora: `${t.hora}:00`,
    nombre: p?.nombre ?? "",
    apellido: p?.apellido ?? "",
    telefono: p?.telefono ?? "",
    obra_social: os?.nombre ?? "Particular",
    prestacion: pr?.nombre ?? "",
    estado: t.estado,
    es_sobreturno: t.es_sobreturno,
    is_deleted: t.is_deleted,
  };
}

function toPacienteRow(p: PacienteRecord) {
  const os = OBRAS_SOCIALES.find((o) => o.id_obra_social === p.id_obra_social);
  return {
    id_paciente: p.id_paciente,
    nombre: p.nombre,
    apellido: p.apellido,
    telefono: p.telefono,
    dni: p.dni,
    obra_social: os?.nombre ?? null,
  };
}

function paginate<T>(items: T[], query: Query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 15);
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
  };
}

function listPacientes(query: Query, search?: string) {
  const term = norm(search ?? "").trim();
  const items = loadDb()
    .pacientes.filter(
      (p) =>
        !term ||
        norm(`${p.apellido} ${p.nombre}`).includes(term) ||
        norm(`${p.nombre} ${p.apellido}`).includes(term) ||
        (p.dni ?? "").includes(term),
    )
    .sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`),
    )
    .map(toPacienteRow);
  return paginate(items, query);
}

function listTurnos(query: Query) {
  const items = loadDb()
    .turnos.filter((t) => {
      if (t.is_deleted && query.includeDeleted !== "true") return false;
      if (query.mostrarCancelados === "false" && t.estado === "Cancelado")
        return false;
      if (query.fechaDesde && t.fecha < query.fechaDesde) return false;
      if (query.fechaHasta && t.fecha > query.fechaHasta) return false;
      return true;
    })
    .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
    .map(toTurnoRow);

  if (query.exportAll === "true") return { data: items, total: items.length };
  const { data, total } = paginate(items, query);
  return { data, total };
}

function pacienteFromBody(body: Body) {
  return {
    nombre: String(body.nombre ?? "").trim(),
    apellido: String(body.apellido ?? "").trim(),
    telefono: body.telefono ?? null,
    email: body.email ?? null,
    dni: body.dni ?? null,
    fecha_nacimiento: body.fecha_nacimiento ?? null,
    id_obra_social: body.id_obra_social ?? null,
    numero_afiliado: body.numero_afiliado ?? null,
  };
}

function route(
  method: string,
  path: string,
  query: Query,
  body: Body,
): unknown {
  const key = `${method} ${path}`;

  // Autenticación simulada: cualquier credencial es válida, sin tokens reales.
  if (key === "POST /auth/login")
    return { token: "demo-token", user: DEMO_USER };
  if (key === "POST /auth/register")
    return { token: "demo-token", user: DEMO_USER };
  if (key === "POST /auth/forgot-password") return { message: "Simulado" };
  if (key === "POST /auth/reset-password") return { message: "Simulado" };

  if (key === "GET /obras-sociales") return OBRAS_SOCIALES;
  if (key === "GET /prestaciones") return PRESTACIONES;

  if (key === "GET /pacientes") return listPacientes(query);
  if (key === "GET /pacientes/search")
    return listPacientes(query, query.search);

  if (key === "POST /pacientes") {
    const db = loadDb();
    const data = pacienteFromBody(body);
    if (!data.nombre || !data.apellido)
      throw new DemoHttpError(400, "Nombre y apellido son obligatorios");
    const id = db.nextPacienteId;
    saveDb({
      ...db,
      nextPacienteId: id + 1,
      pacientes: [...db.pacientes, { id_paciente: id, ...data }],
    });
    return { patientId: id, id_paciente: id };
  }

  const pacienteMatch = path.match(/^\/pacientes\/(\d+)$/);
  if (pacienteMatch) {
    const id = Number(pacienteMatch[1]);
    const db = loadDb();
    const existing = db.pacientes.find((p) => p.id_paciente === id);
    if (!existing) throw new DemoHttpError(404, "Paciente no encontrado");

    if (method === "GET") return existing;
    if (method === "PUT") {
      const data = pacienteFromBody(body);
      saveDb({
        ...db,
        pacientes: db.pacientes.map((p) =>
          p.id_paciente === id ? { ...p, ...data } : p,
        ),
      });
      return { message: "Paciente actualizado" };
    }
  }

  if (key === "GET /turnos") return listTurnos(query);

  if (key === "POST /turnos") {
    const db = loadDb();
    const hora = String(body.hora ?? "").substring(0, 5);
    const conflicto = db.turnos.some(
      (t) =>
        t.fecha === body.fecha &&
        t.hora === hora &&
        t.estado !== "Cancelado" &&
        !t.is_deleted,
    );
    if (conflicto && !body.es_sobreturno)
      throw new DemoHttpError(409, "Ya existe un turno en ese horario");

    const id = db.nextTurnoId;
    saveDb({
      ...db,
      nextTurnoId: id + 1,
      turnos: [
        ...db.turnos,
        {
          id_turno: id,
          fecha: body.fecha,
          hora,
          id_paciente: Number(body.id_paciente),
          id_prestacion: Number(body.id_prestacion),
          estado: "Pendiente",
          es_sobreturno: !!body.es_sobreturno,
          is_deleted: false,
        },
      ],
    });
    return { id_turno: id };
  }

  if (key === "PATCH /turnos/delete/bulk") {
    const ids = new Set<number>(body.ids ?? []);
    const db = loadDb();
    saveDb({
      ...db,
      turnos: db.turnos.map((t) =>
        ids.has(t.id_turno) ? { ...t, is_deleted: true } : t,
      ),
    });
    return { message: "Turnos eliminados" };
  }

  const turnoMatch = path.match(/^\/turnos\/(\d+)\/(status|cancel)$/);
  if (method === "PATCH" && turnoMatch) {
    const id = Number(turnoMatch[1]);
    const db = loadDb();
    if (!db.turnos.some((t) => t.id_turno === id))
      throw new DemoHttpError(404, "Turno no encontrado");
    const estado: Estado =
      turnoMatch[2] === "cancel" ? "Cancelado" : (body.estado as Estado);
    saveDb({
      ...db,
      turnos: db.turnos.map((t) => (t.id_turno === id ? { ...t, estado } : t)),
    });
    return { message: "Turno actualizado" };
  }

  throw new DemoHttpError(404, `Ruta no disponible en la demo: ${key}`);
}

function request<T>(
  method: string,
  url: string,
  body: Body = {},
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  const [path, qs = ""] = url.split("?");
  const query: Query = Object.fromEntries(new URLSearchParams(qs));
  for (const [k, v] of Object.entries(config.params ?? {})) {
    if (v !== undefined && v !== null) query[k] = String(v);
  }

  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      try {
        const data = route(method, path, query, body) as T;
        resolve({ data: JSON.parse(JSON.stringify(data)), status: 200 });
      } catch (error) {
        reject(error);
      }
    }, 120);
  });
}

const api = {
  get: <T = any>(url: string, config?: RequestConfig) =>
    request<T>("GET", url, {}, config),
  post: <T = any>(url: string, body?: Body, config?: RequestConfig) =>
    request<T>("POST", url, body, config),
  put: <T = any>(url: string, body?: Body, config?: RequestConfig) =>
    request<T>("PUT", url, body, config),
  patch: <T = any>(url: string, body?: Body, config?: RequestConfig) =>
    request<T>("PATCH", url, body, config),
  delete: <T = any>(url: string, config?: RequestConfig) =>
    request<T>("DELETE", url, {}, config),
};

export default api;
