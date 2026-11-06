import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { X, AlertCircle, Loader2, Eye, EyeOff, Check } from "lucide-react";

import api from "../lib/api";

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type NewUserFormData = {
  nombre: string;
  apellido: string;
  usuario: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function NewUserModal({ isOpen, onClose }: NewUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const firstFieldRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<NewUserFormData>({
    defaultValues: {
      nombre: "",
      apellido: "",
      usuario: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
      setShowPassword(false);
      setShowConfirmPassword(false);
      return;
    }
    const timer = setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading, onClose]);

  const password = watch("password");

  // Indicador simple de fortaleza, solo informativo (no bloquea el submit)
  const getPasswordStrength = (value: string) => {
    if (!value) return { label: "", level: 0, color: "" };
    let score = 0;
    if (value.length >= 6) score++;
    if (value.length >= 10) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;

    if (score <= 1) return { label: "Débil", level: 1, color: "bg-red-400" };
    if (score === 2)
      return { label: "Aceptable", level: 2, color: "bg-amber-400" };
    if (score === 3) return { label: "Buena", level: 3, color: "bg-cyan-500" };
    return { label: "Fuerte", level: 4, color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password || "");

  const inputClass = (hasError: boolean, withIcon = false) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm sm:text-base outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
      withIcon ? "pr-11" : ""
    } ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300 focus:border-cyan-500 focus:ring-cyan-100"
    }`;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) onClose();
  };

  const onSubmit = async (data: NewUserFormData) => {
    try {
      setIsLoading(true);

      const response = await api.post("/auth/register", {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        usuario: data.usuario.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      localStorage.setItem("token", response.data.token);

      toast.success("Cuenta creada correctamente");

      onClose();
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-user-title"
        className="
          flex flex-col
          w-full h-full sm:h-auto
          sm:max-w-3xl sm:max-h-[90vh]
          rounded-none sm:rounded-3xl
          bg-white shadow-2xl
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-6 shrink-0">
          <div className="min-w-0">
            <h2
              id="new-user-title"
              className="text-xl sm:text-2xl font-bold text-slate-800"
            >
              Crear cuenta
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Complete los datos para registrarse. Los campos con{" "}
              <span className="text-red-500">*</span> son obligatorios.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Cerrar formulario"
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form (scrollable) */}
        <form
          id="new-user-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-5 p-4 sm:p-6"
          noValidate
        >
          <fieldset disabled={isLoading} className="contents">
            {/* Nombre + Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Ej: María"
                  aria-invalid={!!errors.nombre}
                  aria-describedby={errors.nombre ? "nombre-error" : undefined}
                  className={inputClass(!!errors.nombre)}
                  {...register("nombre", {
                    required: "El nombre es obligatorio",
                    minLength: { value: 2, message: "Mínimo 2 caracteres" },
                  })}
                  ref={(el) => {
                    register("nombre").ref(el);
                    firstFieldRef.current = el;
                  }}
                />
                {errors.nombre && (
                  <p
                    id="nombre-error"
                    className="mt-2 flex items-center gap-1 text-sm text-red-500"
                  >
                    <AlertCircle size={14} /> {errors.nombre.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="apellido"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  id="apellido"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Ej: González"
                  aria-invalid={!!errors.apellido}
                  aria-describedby={
                    errors.apellido ? "apellido-error" : undefined
                  }
                  className={inputClass(!!errors.apellido)}
                  {...register("apellido", {
                    required: "El apellido es obligatorio",
                    minLength: { value: 2, message: "Mínimo 2 caracteres" },
                  })}
                />
                {errors.apellido && (
                  <p
                    id="apellido-error"
                    className="mt-2 flex items-center gap-1 text-sm text-red-500"
                  >
                    <AlertCircle size={14} /> {errors.apellido.message}
                  </p>
                )}
              </div>
            </div>

            {/* Usuario */}
            <div>
              <label
                htmlFor="usuario"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Usuario <span className="text-red-500">*</span>
              </label>
              <input
                id="usuario"
                type="text"
                autoComplete="username"
                placeholder="Ej: mgonzalez"
                aria-invalid={!!errors.usuario}
                aria-describedby={
                  errors.usuario ? "usuario-error" : "usuario-hint"
                }
                className={inputClass(!!errors.usuario)}
                {...register("usuario", {
                  required: "El usuario es obligatorio",
                  minLength: { value: 3, message: "Mínimo 3 caracteres" },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: "Solo letras, números y guiones bajos",
                  },
                })}
              />
              {errors.usuario ? (
                <p
                  id="usuario-error"
                  className="mt-2 flex items-center gap-1 text-sm text-red-500"
                >
                  <AlertCircle size={14} /> {errors.usuario.message}
                </p>
              ) : (
                <p id="usuario-hint" className="mt-2 text-xs text-slate-400">
                  Sin espacios. Solo letras, números y guiones bajos (_).
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Ej: maria.gonzalez@email.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={inputClass(!!errors.email)}
                {...register("email", {
                  required: "El email es obligatorio",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Ingrese un email válido",
                  },
                })}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-2 flex items-center gap-1 text-sm text-red-500"
                >
                  <AlertCircle size={14} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : "password-strength"
                    }
                    className={inputClass(!!errors.password, true)}
                    {...register("password", {
                      required: "La contraseña es obligatoria",
                      minLength: { value: 6, message: "Mínimo 6 caracteres" },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.password ? (
                  <p
                    id="password-error"
                    className="mt-2 flex items-center gap-1 text-sm text-red-500"
                  >
                    <AlertCircle size={14} /> {errors.password.message}
                  </p>
                ) : (
                  password && (
                    <div id="password-strength" className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <span
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= strength.level
                                ? strength.color
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Seguridad: {strength.label}
                      </p>
                    </div>
                  )
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Confirmar contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repita la contraseña"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword
                        ? "confirmPassword-error"
                        : undefined
                    }
                    className={inputClass(!!errors.confirmPassword, true)}
                    {...register("confirmPassword", {
                      required: "Debe confirmar la contraseña",
                      validate: (value) =>
                        value === password || "Las contraseñas no coinciden",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>

                {errors.confirmPassword ? (
                  <p
                    id="confirmPassword-error"
                    className="mt-2 flex items-center gap-1 text-sm text-red-500"
                  >
                    <AlertCircle size={14} /> {errors.confirmPassword.message}
                  </p>
                ) : (
                  confirmPasswordMatches(
                    password,
                    watch("confirmPassword"),
                  ) && (
                    <p className="mt-2 flex items-center gap-1 text-sm text-emerald-600">
                      <Check size={14} /> Las contraseñas coinciden
                    </p>
                  )
                )}
              </div>
            </div>
          </fieldset>
        </form>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-200 p-4 sm:p-6 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="new-user-form"
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white transition hover:bg-cyan-700 shadow-md shadow-cyan-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? "Creando…" : "Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper fuera del componente para no recrearlo en cada render
function confirmPasswordMatches(password?: string, confirm?: string) {
  return !!password && !!confirm && password === confirm;
}
