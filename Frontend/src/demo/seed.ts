// Datos 100% ficticios para la versión demo. Ninguna persona real está representada.

export type Estado =
  | "Pendiente"
  | "Confirmado"
  | "Presente"
  | "Ausente"
  | "Cancelado";

export interface ObraSocial {
  id_obra_social: number;
  nombre: string;
}

export interface Prestacion {
  id_prestacion: number;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
}

export interface PacienteRecord {
  id_paciente: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  dni: string | null;
  fecha_nacimiento: string | null;
  id_obra_social: number | null;
  numero_afiliado: string | null;
}

export interface TurnoRecord {
  id_turno: number;
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
  id_paciente: number;
  id_prestacion: number;
  estado: Estado;
  es_sobreturno: boolean;
  is_deleted: boolean;
}

export interface DemoDb {
  seedDate: string;
  pacientes: PacienteRecord[];
  turnos: TurnoRecord[];
  nextPacienteId: number;
  nextTurnoId: number;
}

export const DEMO_USER = {
  nombre: "Médico",
  apellido: "Demo",
  rol: "medico",
};

export const OBRAS_SOCIALES: ObraSocial[] = [
  { id_obra_social: 1, nombre: "Particular" },
  { id_obra_social: 2, nombre: "Obra Social Demo A" },
  { id_obra_social: 3, nombre: "Obra Social Demo B" },
  { id_obra_social: 4, nombre: "Prepaga Ejemplo" },
];

export const PRESTACIONES: Prestacion[] = [
  {
    id_prestacion: 1,
    nombre: "Consulta clínica",
    descripcion: "Consulta médica general",
    precio: 10000,
  },
  {
    id_prestacion: 2,
    nombre: "Control",
    descripcion: "Control de seguimiento",
    precio: 8000,
  },
  {
    id_prestacion: 3,
    nombre: "Electrocardiograma",
    descripcion: "Estudio ECG de reposo",
    precio: 15000,
  },
  {
    id_prestacion: 4,
    nombre: "Certificado de aptitud",
    descripcion: "Certificado médico de aptitud física",
    precio: 6000,
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
}

export function daysBetween(fromKey: string, toKey: string): number {
  const [y1, m1, d1] = fromKey.split("-").map(Number);
  const [y2, m2, d2] = toKey.split("-").map(Number);
  const ms = Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1);
  return Math.round(ms / 86400000);
}

const NOMBRES = [
  "Ana",
  "Luis",
  "María",
  "Carlos",
  "Lucía",
  "Pedro",
  "Sofía",
  "Jorge",
  "Elena",
  "Martín",
  "Paula",
  "Diego",
  "Laura",
  "Tomás",
  "Julia",
  "Andrés",
];

const APELLIDOS = [
  "Demo",
  "Ejemplo",
  "Prueba",
  "Muestra",
  "Ficticio",
  "Simulado",
  "Modelo",
  "Testigo",
];

function buildPacientes(): PacienteRecord[] {
  return NOMBRES.map((nombre, i) => {
    const n = i + 1;
    return {
      id_paciente: n,
      nombre,
      apellido: APELLIDOS[i % APELLIDOS.length],
      telefono: `+54 11 5550-${String(1000 + n)}`,
      email: `paciente.demo${n}@example.com`,
      dni: String(10000000 + n),
      fecha_nacimiento: `${1960 + ((n * 3) % 40)}-${pad((n % 12) + 1)}-${pad(
        ((n * 5) % 27) + 1,
      )}`,
      id_obra_social: (n % 4) + 1,
      numero_afiliado: `DEMO-${String(100000 + n)}`,
    };
  });
}

// [offset de días respecto de hoy, hora, id_paciente, id_prestacion, estado, sobreturno]
type Row = [number, string, number, number, Estado, boolean];

const TURNOS_BASE: Row[] = [
  [-3, "09:00", 1, 1, "Presente", false],
  [-3, "09:30", 2, 2, "Presente", false],
  [-3, "10:00", 3, 3, "Ausente", false],
  [-2, "09:00", 4, 1, "Presente", false],
  [-2, "09:00", 5, 2, "Presente", true],
  [-2, "10:30", 6, 4, "Cancelado", false],
  [-1, "11:00", 7, 1, "Presente", false],
  [-1, "11:30", 8, 2, "Ausente", false],
  [0, "09:00", 9, 1, "Presente", false],
  [0, "09:30", 10, 2, "Confirmado", false],
  [0, "10:00", 11, 3, "Confirmado", false],
  [0, "10:00", 12, 1, "Pendiente", true],
  [0, "11:00", 13, 4, "Pendiente", false],
  [0, "16:00", 14, 2, "Cancelado", false],
  [1, "09:00", 15, 1, "Confirmado", false],
  [1, "09:30", 16, 2, "Pendiente", false],
  [1, "10:00", 1, 3, "Pendiente", false],
  [1, "10:00", 2, 1, "Confirmado", true],
  [2, "15:00", 3, 1, "Pendiente", false],
  [2, "15:30", 4, 2, "Confirmado", false],
  [3, "09:00", 5, 4, "Pendiente", false],
  [3, "09:30", 6, 1, "Pendiente", false],
  [4, "10:00", 7, 2, "Confirmado", false],
  [5, "11:00", 8, 1, "Pendiente", false],
  [7, "09:00", 9, 3, "Pendiente", false],
];

export function buildSeed(today: string = toDateKey(new Date())): DemoDb {
  const turnos: TurnoRecord[] = TURNOS_BASE.map(
    ([offset, hora, id_paciente, id_prestacion, estado, es_sobreturno], i) => ({
      id_turno: i + 1,
      fecha: addDays(today, offset),
      hora,
      id_paciente,
      id_prestacion,
      estado,
      es_sobreturno,
      is_deleted: false,
    }),
  );

  // Un turno eliminado para mostrar el filtro "mostrar eliminados"
  turnos.push({
    id_turno: turnos.length + 1,
    fecha: addDays(today, -1),
    hora: "12:00",
    id_paciente: 3,
    id_prestacion: 2,
    estado: "Pendiente",
    es_sobreturno: false,
    is_deleted: true,
  });

  const pacientes = buildPacientes();

  return {
    seedDate: today,
    pacientes,
    turnos,
    nextPacienteId: pacientes.length + 1,
    nextTurnoId: turnos.length + 1,
  };
}
