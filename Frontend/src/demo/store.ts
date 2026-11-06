import {
  buildSeed,
  daysBetween,
  addDays,
  toDateKey,
  type DemoDb,
} from "./seed";

const STORAGE_KEY = "kalendas_demo_db_v1";

let cache: DemoDb | null = null;

function shiftToToday(db: DemoDb): DemoDb {
  const today = toDateKey(new Date());
  const diff = daysBetween(db.seedDate, today);
  if (diff === 0) return db;
  return {
    ...db,
    seedDate: today,
    turnos: db.turnos.map((t) => ({ ...t, fecha: addDays(t.fecha, diff) })),
  };
}

export function loadDb(): DemoDb {
  if (cache) return cache;

  let db: DemoDb | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDb;
      if (Array.isArray(parsed.pacientes) && Array.isArray(parsed.turnos)) {
        db = shiftToToday(parsed);
      }
    }
  } catch {
    db = null;
  }

  cache = db ?? buildSeed();
  saveDb(cache);
  return cache;
}

export function saveDb(db: DemoDb): void {
  cache = db;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Sin persistencia (modo privado, cuota): la demo sigue funcionando en memoria.
  }
}

export function resetDemoData(): void {
  saveDb(buildSeed());
}
