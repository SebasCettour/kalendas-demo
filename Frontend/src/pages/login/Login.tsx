import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

import api from "../../lib/api";

import NewUserModal from "../../components/NewUserModal";
import ForgotPasswordModal from "../../components/ForgotPasswordModal";

type LoginForm = {
  usuario: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<LoginForm>();

  const entrarComoDemo = () =>
    onSubmit({ usuario: "demo", password: "demo" });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);

      const response = await api.post("/auth/login", {
        usuario: data.usuario.trim(),
        password: data.password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      toast.success("Bienvenido");

      navigate("/agenda");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Usuario o contraseña incorrectos",
      );
      setFocus("password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50 px-4 py-4">
      <div
        className="
          relative
          w-full
          max-w-sm
          overflow-hidden
          rounded-2xl
          border
          border-slate-200/70
          bg-white/90
          p-5 sm:p-6
          shadow-lg
          shadow-slate-200/50
          backdrop-blur-xl
        "
      >
        {/* Decoración (oculta en mobile muy chico para no saturar) */}
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-cyan-100/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Logo / Marca */}
          <div className="mb-5 sm:mb-6 text-center">
            <img
              src="/main_logo.png"
              alt="Logo de Kalendas"
              className="mx-auto h-14 sm:h-16 md:h-20 w-auto object-contain"
            />

            <h1
              className="
                mt-2 sm:mt-3
                text-2xl sm:text-3xl
                font-bold
                tracking-[0.04em]
                text-[#0A6BB8]
                leading-none
              "
            >
              Kalendas
            </h1>

            <p
              className="
                mt-1.5
                text-[10px] sm:text-[11px]
                uppercase
                tracking-[0.20em]
                text-slate-500
                font-medium
              "
            >
              Agenda médica inteligente
            </p>

            <p className="mt-3 sm:mt-4 text-sm text-slate-500">
              Ingresá tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Formulario */}
          <form
            className="space-y-3"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <fieldset
              disabled={isLoading}
              className="min-w-0 space-y-3"
            >
              {/* Usuario */}
              <div>
                <label
                  htmlFor="usuario"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Usuario
                </label>

                <input
                  id="usuario"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="Ej: mgonzalez"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-invalid={!!errors.usuario}
                  aria-describedby={
                    errors.usuario ? "usuario-error" : undefined
                  }
                  className={`
                    w-full
                    rounded-xl
                    border
                    bg-slate-50/80
                    px-4
                    py-2.5
                    text-base
                    text-slate-800
                    placeholder:text-slate-400
                    outline-none
                    transition-all
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    ${
                      errors.usuario
                        ? "border-red-300 focus:ring-4 focus:ring-red-100"
                        : "border-slate-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                    }
                  `}
                  {...register("usuario", {
                    required: "El usuario es obligatorio",
                    minLength: {
                      value: 3,
                      message: "Mínimo 3 caracteres",
                    },
                  })}
                />

                {errors.usuario && (
                  <p
                    id="usuario-error"
                    className="mt-2 flex items-center gap-1 text-sm text-red-500"
                  >
                    <AlertCircle size={14} />
                    {String(errors.usuario.message)}
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <div                 className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Contraseña
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-medium text-[#0A6BB8] hover:text-[#095b9a] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Ingresá tu contraseña"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={`
                      w-full
                      rounded-xl
                      border
                      bg-slate-50/80
                      px-4
                      py-2.5
                      pr-12
                      text-base
                      text-slate-800
                      placeholder:text-slate-400
                      outline-none
                      transition-all
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      ${
                        errors.password
                          ? "border-red-300 focus:ring-4 focus:ring-red-100"
                          : "border-slate-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                      }
                    `}
                    {...register("password", {
                      required: "La contraseña es obligatoria",
                      minLength: {
                        value: 4,
                        message: "Mínimo 4 caracteres",
                      },
                    })}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.password && (
                  <p
                    id="password-error"
                    className="mt-2 flex items-center gap-1 text-sm text-red-500"
                  >
                    <AlertCircle size={14} />
                    {String(errors.password.message)}
                  </p>
                )}
              </div>

              {/* Entrar */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[#0A6BB8]
                  py-3
                  font-semibold
                  text-white
                  transition-all
                  hover:bg-[#095b9a]
                  hover:shadow-lg
                  hover:shadow-cyan-200/50
                  active:scale-[0.99]
                  focus:outline-none
                  focus-visible:ring-4
                  focus-visible:ring-cyan-200
                  disabled:cursor-not-allowed
                  disabled:opacity-70
                  disabled:hover:shadow-none
                "
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                {isLoading ? "Ingresando…" : "Entrar"}
              </button>

              <button
                type="button"
                onClick={entrarComoDemo}
                disabled={isLoading}
                className="w-full rounded-xl border border-[#0A6BB8] py-3 font-semibold text-[#0A6BB8] transition-all hover:bg-cyan-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Entrar como demo
              </button>

              <p className="text-center text-xs text-slate-400">
                Demo: se acepta cualquier usuario y contraseña.
              </p>
            </fieldset>

            {/* Separador */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>

              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-slate-400">o</span>
              </div>
            </div>

            {/* Crear cuenta */}
            <div className="text-center">
              <p className="text-sm text-slate-500">
                ¿No tenés cuenta?{" "}
                <button
                  onClick={() => setIsModalOpen(true)}
                  type="button"
                  disabled={isLoading}
                  className="font-semibold text-[#0A6BB8] transition-colors hover:text-[#095b9a] hover:underline focus:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Crear cuenta
                </button>
              </p>

            </div>
          </form>
        </div>
      </div>

      <NewUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
