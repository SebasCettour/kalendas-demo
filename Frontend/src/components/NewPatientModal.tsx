import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { X, AlertCircle, Loader2 } from "lucide-react";

import api from "../lib/api";

interface NewPatientProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    dni?: string;
  };
  turnoContexto?: {
    fecha: string;
    hora: string;
    prestacionNombre?: string;
  };
  onPatientCreated?: (newPatientId: number) => void;
}

type PatientFormData = {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  dni: string;
  fechaNacimiento: string;
  obraSocial: string;
  numeroAfiliado: string;
};

type ObraSocial = {
  id_obra_social: number;
  nombre: string;
};

function formatearFechaLocal(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-");
  return `${dia}/${mes}/${anio}`;
}

export default function NewPatient({
  isOpen,
  onClose,
  initialData,
  turnoContexto,
  onPatientCreated,
}: NewPatientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [loadingObras, setLoadingObras] = useState(false);
  const [obrasError, setObrasError] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PatientFormData>({
    defaultValues: {
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      dni: "",
      fechaNacimiento: "",
      obraSocial: "",
      numeroAfiliado: "",
    },
  });

  // Precompletar datos cuando se abre el modal con initialData
  useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.nombre) setValue("nombre", initialData.nombre);
      if (initialData.apellido) setValue("apellido", initialData.apellido);
      if (initialData.telefono) setValue("telefono", initialData.telefono);
      if (initialData.dni) setValue("dni", initialData.dni);
    }
  }, [isOpen, initialData, setValue]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      return;
    }
    const timer = setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen, reset]);

  useEffect(() => {
    const fetchObrasSociales = async () => {
      try {
        setLoadingObras(true);
        setObrasError(false);
        const response = await api.get("/obras-sociales");
        setObrasSociales(response.data);
      } catch (error) {
        setObrasError(true);
        toast.error("Error al cargar obras sociales");
      } finally {
        setLoadingObras(false);
      }
    };

    if (isOpen) {
      fetchObrasSociales();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm sm:text-base outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60
    ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300 focus:border-cyan-500 focus:ring-cyan-100"
    }`;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) onClose();
  };

  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("token");

      const payload = {
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        telefono: data.telefono.trim() || null,
        email: data.email.trim() || null,
        dni: data.dni.trim() || null,
        fecha_nacimiento: data.fechaNacimiento || null,
        id_obra_social: data.obraSocial ? Number(data.obraSocial) : null,
        numero_afiliado: data.numeroAfiliado.trim() || null,
      };

      const response = await api.post("/pacientes", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newPatientId =
        response.data?.patientId ||
        response.data?.id_paciente ||
        response.data?.id;

      toast.success("Paciente creado correctamente");

      if (newPatientId && onPatientCreated) {
        onPatientCreated(newPatientId);
      } else if (onPatientCreated) {
        console.error(
          "No se pudo obtener el ID del paciente recién creado:",
          response.data,
        );
        toast.error(
          "El paciente se creó, pero no se pudo agendar el turno automáticamente. Buscalo en la lista para agendarlo.",
        );
        onClose();
      } else {
        onClose();
      }

      reset();
    } catch (error) {
      toast.error(
        (error as any)?.response?.data?.message || "Error al crear paciente",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-patient-title"
        className="
          flex flex-col
          w-full h-full sm:h-auto
          sm:max-w-3xl sm:max-h-[90vh]
          rounded-none sm:rounded-3xl
          border-0 sm:border border-slate-200
          bg-white shadow-2xl
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-4 sm:py-5 shrink-0">
          <div className="min-w-0">
            <h2
              id="new-patient-title"
              className="text-xl sm:text-2xl font-bold text-slate-800"
            >
              Nuevo Paciente
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Complete los datos del paciente. Los campos con{" "}
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

        {turnoContexto && (
          <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shrink-0">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p>
              Este paciente todavía no está registrado. Completá la ficha y al
              guardar se va a crear el turno automáticamente para el{" "}
              <span className="font-semibold">
                {formatearFechaLocal(turnoContexto.fecha)}
              </span>{" "}
              a las <span className="font-semibold">{turnoContexto.hora}</span>
              {turnoContexto.prestacionNombre && (
                <>
                  {" "}
                  (
                  <span className="font-semibold">
                    {turnoContexto.prestacionNombre}
                  </span>
                  )
                </>
              )}
              .
            </p>
          </div>
        )}
        {/* Body */}
        <form
          id="new-patient-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-6 p-4 sm:p-6"
          noValidate
        >
          <fieldset disabled={isLoading} className="contents">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Nombre */}
              <div>
                <label
                  htmlFor="nombre"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Ej: María"
                  maxLength={100}
                  aria-required="true"
                  aria-invalid={!!errors.nombre}
                  className={inputClass(!!errors.nombre)}
                  {...register("nombre", {
                    required: "El nombre es obligatorio",
                    minLength: { value: 2, message: "Mínimo 2 caracteres" },
                    maxLength: {
                      value: 100,
                      message: "Máximo 100 caracteres",
                    },
                    pattern: {
                      value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
                      message: "Solo letras",
                    },
                  })}
                  ref={(el) => {
                    register("nombre").ref(el);
                    firstFieldRef.current = el;
                  }}
                />
                {errors.nombre && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle size={14} /> {errors.nombre.message}
                  </p>
                )}
              </div>

              {/* Apellido */}
              <div>
                <label
                  htmlFor="apellido"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  id="apellido"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Ej: González"
                  maxLength={100}
                  aria-required="true"
                  aria-invalid={!!errors.apellido}
                  className={inputClass(!!errors.apellido)}
                  {...register("apellido", {
                    required: "El apellido es obligatorio",
                    minLength: { value: 2, message: "Mínimo 2 caracteres" },
                    maxLength: {
                      value: 100,
                      message: "Máximo 100 caracteres",
                    },
                    pattern: {
                      value: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
                      message: "Solo letras",
                    },
                  })}
                />
                {errors.apellido && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle size={14} /> {errors.apellido.message}
                  </p>
                )}
              </div>

              {/* DNI */}
              <div>
                <label
                  htmlFor="dni"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  DNI
                </label>
                <input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 30123456"
                  maxLength={8}
                  aria-invalid={!!errors.dni}
                  className={inputClass(!!errors.dni)}
                  {...register("dni", {
                    pattern: {
                      value: /^[0-9]{7,8}$/,
                      message: "Ingrese un DNI válido (7 u 8 dígitos)",
                    },
                  })}
                />
                {errors.dni && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle size={14} /> {errors.dni.message}
                  </p>
                )}
              </div>

              {/* Fecha de nacimiento */}
              <div>
                <label
                  htmlFor="fechaNacimiento"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Fecha de nacimiento
                </label>
                <input
                  id="fechaNacimiento"
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  className={inputClass(!!errors.fechaNacimiento)}
                  {...register("fechaNacimiento")}
                />
              </div>

              {/* Teléfono */}
              <div>
                <label
                  htmlFor="telefono"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Teléfono{" "}
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="telefono"
                  type="tel"
                  placeholder="Ej: 11 2345-6789"
                  maxLength={30}
                  aria-invalid={!!errors.telefono}
                  className={inputClass(!!errors.telefono)}
                  {...register("telefono", {
                    minLength: {
                      value: 6,
                      message: "Teléfono demasiado corto",
                    },
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: "Ingrese un teléfono válido",
                    },
                  })}
                />
                {errors.telefono && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle size={14} /> {errors.telefono.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email{" "}
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Ej: maria.gonzalez@email.com"
                  aria-invalid={!!errors.email}
                  className={inputClass(!!errors.email)}
                  {...register("email", {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Ingrese un email válido",
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
                    <AlertCircle size={14} /> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Obra social */}
              <div>
                <label
                  htmlFor="obraSocial"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Obra social <span className="text-red-500">*</span>
                </label>
                <select
                  id="obraSocial"
                  disabled={loadingObras}
                  aria-required="true"
                  aria-invalid={!!errors.obraSocial}
                  aria-describedby={
                    errors.obraSocial ? "obraSocial-error" : undefined
                  }
                  className={inputClass(!!errors.obraSocial)}
                  {...register("obraSocial", {
                    required: "Seleccione una obra social",
                  })}
                >
                  <option value="">
                    {loadingObras
                      ? "Cargando obras sociales…"
                      : obrasError
                        ? "No se pudieron cargar las obras sociales"
                        : "Seleccione una obra social"}
                  </option>

                  {!loadingObras &&
                    !obrasError &&
                    obrasSociales.map((obra) => (
                      <option
                        key={obra.id_obra_social}
                        value={obra.id_obra_social}
                      >
                        {obra.nombre}
                      </option>
                    ))}
                </select>
                {errors.obraSocial && (
                  <p
                    id="obraSocial-error"
                    className="mt-2 flex items-center gap-1 text-sm text-red-500"
                  >
                    <AlertCircle size={14} /> {errors.obraSocial.message}
                  </p>
                )}
              </div>

              {/* Número de afiliado */}
              <div>
                <label
                  htmlFor="numeroAfiliado"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Número de afiliado{" "}
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="numeroAfiliado"
                  type="text"
                  placeholder="Ej: 1234567890"
                  maxLength={50}
                  className={inputClass(!!errors.numeroAfiliado)}
                  {...register("numeroAfiliado")}
                />
              </div>
            </div>
          </fieldset>
        </form>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-200 px-4 sm:px-6 py-4 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="new-patient-form"
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white shadow-md shadow-cyan-200 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? "Guardando…" : "Guardar Paciente"}
          </button>
        </div>
      </div>
    </div>
  );
}
