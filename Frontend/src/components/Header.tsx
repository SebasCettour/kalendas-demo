import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { LogOut, ChevronDown, CalendarDays, Users } from "lucide-react";

interface User {
  nombre: string;
  apellido: string;
  rol: string;
}

const DEFAULT_USER: User = {
  nombre: "Usuario",
  apellido: "",
  rol: "secretaria",
};

function getStoredUser(): User {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return DEFAULT_USER;

  try {
    const parsed = JSON.parse(rawUser);
    return {
      nombre: parsed?.nombre || DEFAULT_USER.nombre,
      apellido: parsed?.apellido || "",
      rol: parsed?.rol || DEFAULT_USER.rol,
    };
  } catch {
    return DEFAULT_USER;
  }
}

const NAV_LINKS = [
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/pacientes", label: "Pacientes", icon: Users },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const nombreCompleto = `${user.nombre} ${user.apellido}`.trim();
  const inicial = user.nombre?.charAt(0).toUpperCase() || "U";

  // Cerrar menú al hacer click fuera o presionar Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo + Nombre */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <img
              src="/main_logo.png"
              alt="Logo de Kalendas"
              className="h-11 sm:h-16 md:h-20 w-auto object-contain shrink-0"
            />

            <div className="min-w-0">
              <h1 className="truncate text-xl sm:text-3xl md:text-4xl font-semibold tracking-[0.05em] text-slate-800 leading-none">
                Kalendas
              </h1>

              <p className="mt-0.5 sm:mt-1 truncate text-[10px] sm:text-xs font-medium tracking-[0.08em] uppercase text-slate-500">
                Agenda médica inteligente
              </p>
            </div>
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const isActive = location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`
                    flex items-center gap-2
                    rounded-xl px-3.5 py-2
                    text-sm font-medium
                    transition-colors
                    ${
                      isActive
                        ? "bg-cyan-50 text-[#0A6BB8]"
                        : "text-slate-600 hover:bg-slate-100"
                    }
                  `}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Usuario */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Menú de usuario: ${nombreCompleto}`}
              title={nombreCompleto}
              className="
                flex items-center gap-2 sm:gap-3
                rounded-2xl
                px-1.5 sm:px-2 py-1
                transition-colors
                hover:bg-slate-100
                focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300
              "
            >
              {/* Texto: oculto en mobile muy chico para no saturar */}
              <div className="hidden sm:block text-right min-w-0 max-w-[10rem]">
                <p className="truncate text-sm font-semibold tracking-[0.02em] text-slate-800">
                  {nombreCompleto}
                </p>
                <p className="truncate text-[11px] uppercase tracking-[0.15em] text-slate-500">
                  {user.rol}
                </p>
              </div>

              <div
                className="
                  flex h-9 w-9 sm:h-11 sm:w-11
                  shrink-0 items-center justify-center
                  rounded-2xl
                  bg-gradient-to-br from-cyan-50 to-blue-100
                  text-[#0A6BB8] font-bold text-sm sm:text-base
                  shadow-sm ring-1 ring-cyan-100
                "
                aria-hidden="true"
              >
                {inicial}
              </div>

              <ChevronDown
                size={16}
                className={`hidden sm:block text-slate-400 transition-transform ${
                  menuOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Menú desplegable */}
            {menuOpen && (
              <div
                role="menu"
                className="
                  absolute right-0 top-[calc(100%+0.5rem)]
                  w-56 sm:w-60
                  rounded-2xl border border-slate-200
                  bg-white shadow-lg
                  overflow-hidden
                  z-50
                  animate-in fade-in slide-in-from-top-1 duration-150
                "
              >
                {/* Info de usuario visible siempre dentro del menú (útil en mobile, donde el header la oculta) */}
                <div className="sm:hidden px-4 py-3 border-b border-slate-100">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {nombreCompleto}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
                    {user.rol}
                  </p>
                </div>

                {/* Links de navegación visibles en mobile, donde el nav de arriba está oculto */}
                <div className="md:hidden border-b border-slate-100">
                  {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  ))}
                </div>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="
                    flex w-full items-center gap-2.5
                    px-4 py-3
                    text-sm font-medium text-slate-600
                    transition-colors
                    hover:bg-red-50 hover:text-red-600
                    focus:outline-none focus-visible:bg-red-50 focus-visible:text-red-600
                  "
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
