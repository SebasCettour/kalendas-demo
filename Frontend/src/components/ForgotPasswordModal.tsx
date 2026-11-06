import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { X, AlertCircle, Loader2, MailCheck } from "lucide-react";

import api from "../lib/api";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setEmail("");
      setError("");
      setEnviado(false);
    }, 200);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) handleClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();

    if (!trimmed) {
      setError("Ingresá tu correo electrónico");
      inputRef.current?.focus();
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setError("Ingresá un correo electrónico válido");
      inputRef.current?.focus();
      return;
    }

    setError("");

    try {
      setIsLoading(true);

      await api.post("/auth/forgot-password", { email: trimmed });

      setEnviado(true);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo procesar la solicitud. Intentá nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        className="
          flex flex-col
          w-full sm:max-w-md
          h-full sm:h-auto sm:max-h-[90vh]
          rounded-none sm:rounded-3xl
          overflow-hidden
          bg-white shadow-2xl
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-6 shrink-0">
          <div className="min-w-0">
            <h2
              id="forgot-password-title"
              className="text-lg sm:text-2xl font-bold text-slate-800"
            >
              Recuperar contraseña
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {enviado
                ? "Revisá tu correo para continuar."
                : "Ingresá el correo asociado a tu cuenta."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Cerrar"
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {enviado ? (
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <MailCheck size={28} />
              </div>
              <p className="text-sm text-slate-600">
                Si el correo{" "}
                <span className="font-medium text-slate-800">{email}</span> está
                registrado, vas a recibir un enlace para restablecer tu
                contraseña.
              </p>
              <p className="text-xs text-amber-600">
                Demo: no se envió ningún email real; el envío está simulado.
              </p>
            </div>
          ) : (
            <form id="forgot-password-form" onSubmit={handleSubmit} noValidate>
              <fieldset disabled={isLoading} className="contents">
                <label
                  htmlFor="forgot-email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Correo electrónico
                </label>
                <input
                  ref={inputRef}
                  id="forgot-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  aria-invalid={!!error}
                  aria-describedby={
                    error ? "forgot-email-error" : "forgot-email-hint"
                  }
                  className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm sm:text-base outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                    error
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-300 focus:border-cyan-500 focus:ring-cyan-100"
                  }`}
                />

                {error ? (
                  <p
                    id="forgot-email-error"
                    className="mt-2 flex items-center gap-1 text-sm text-red-500"
                  >
                    <AlertCircle size={14} />
                    {error}
                  </p>
                ) : (
                  <p
                    id="forgot-email-hint"
                    className="mt-2 text-xs text-slate-500"
                  >
                    Te enviaremos un enlace para restablecer tu contraseña.
                  </p>
                )}
              </fieldset>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-200 p-4 sm:p-6 shrink-0 bg-white">
          {enviado ? (
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white shadow-md shadow-cyan-200 transition hover:bg-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Entendido
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="forgot-password-form"
                disabled={isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white shadow-md shadow-cyan-200 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {isLoading ? "Enviando…" : "Enviar enlace"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
