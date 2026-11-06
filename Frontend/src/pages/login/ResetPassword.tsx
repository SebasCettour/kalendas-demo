import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import api from "../../lib/api";

type FormData = {
  password: string;
  confirmPassword: string;
};

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [completado, setCompletado] = useState(false);

  const firstFieldRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<FormData>();

  const password = watch("password");
  const tokenValido = !!token && token.trim().length > 0;

  useEffect(() => {
    if (tokenValido) {
      const timer = setTimeout(() => firstFieldRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [tokenValido]);

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

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 pr-12 text-base text-slate-800 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60
    ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300 focus:border-cyan-500 focus:ring-cyan-100"
    }`;

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      await api.post("/auth/reset-password", {
        token,
        password: data.password,
      });

      setCompletado(true);
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 400 || status === 401) {
        toast.error(
          message || "El enlace expiró o no es válido. Solicitá uno nuevo.",
        );
      } else {
        toast.error(message || "No fue posible actualizar la contraseña");
      }
      setFocus("password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-cyan-50 to-slate-200 p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200">
        {/* ---------- Caso: sin token válido en la URL ---------- */}
        {!tokenValido ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
              <ShieldAlert size={32} />
            </div>

            <h1 className="mt-4 text-xl sm:text-2xl font-bold text-slate-800">
              Enlace inválido
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Este enlace para restablecer la contraseña no es válido o ya fue
              utilizado. Solicitá uno nuevo desde la pantalla de inicio de
              sesión.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-600 py-3 font-semibold text-white transition hover:bg-cyan-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        ) : completado ? (
          /* ---------- Caso: contraseña actualizada ---------- */
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 size={32} />
            </div>

            <h1 className="mt-4 text-xl sm:text-2xl font-bold text-slate-800">
              Contraseña actualizada
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Ya podés iniciar sesión con tu nueva contraseña.
            </p>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-6 w-full rounded-xl bg-cyan-600 py-3 font-semibold text-white transition hover:bg-cyan-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200"
            >
              Ir al inicio de sesión
            </button>
          </div>
        ) : (
          /* ---------- Caso: formulario normal ---------- */
          <>
            <div className="mb-6 sm:mb-8 text-center">
              <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 shadow-inner">
                <Lock size={28} />
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-800">
                Restablecer contraseña
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Ingresá una nueva contraseña para tu cuenta.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <fieldset disabled={isLoading} className="contents">
                {/* Nueva contraseña */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Nueva contraseña
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
                      className={inputClass(!!errors.password)}
                      {...register("password", {
                        required: "Ingresá una contraseña",
                        minLength: { value: 6, message: "Mínimo 6 caracteres" },
                      })}
                      ref={(el) => {
                        register("password").ref(el);
                        firstFieldRef.current = el;
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {errors.password ? (
                    <p
                      id="password-error"
                      className="mt-2 flex items-center gap-1 text-sm text-red-500"
                    >
                      <AlertCircle size={14} />
                      {String(errors.password.message)}
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

                {/* Confirmar contraseña */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Confirmar contraseña
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repetí la contraseña"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={
                        errors.confirmPassword
                          ? "confirmPassword-error"
                          : undefined
                      }
                      className={inputClass(!!errors.confirmPassword)}
                      {...register("confirmPassword", {
                        required: "Confirmá la contraseña",
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
                      className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {errors.confirmPassword && (
                    <p
                      id="confirmPassword-error"
                      className="mt-2 flex items-center gap-1 text-sm text-red-500"
                    >
                      <AlertCircle size={14} />
                      {String(errors.confirmPassword.message)}
                    </p>
                  )}
                </div>

                {/* Botón */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-white font-semibold transition hover:bg-cyan-700 active:scale-[0.99] shadow-md shadow-cyan-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading && <Loader2 size={18} className="animate-spin" />}
                  {isLoading ? "Actualizando…" : "Actualizar contraseña"}
                </button>

                {/* Volver al login */}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:opacity-50"
                >
                  Volver al inicio de sesión
                </button>
              </fieldset>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
