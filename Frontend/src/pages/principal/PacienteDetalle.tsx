import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import Header from "../../components/Header";
import api from "../../lib/api";

type PacienteFormData = {
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

export default function PacienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [loadingObras, setLoadingObras] = useState(false);
  const [obrasError, setObrasError] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PacienteFormData>({
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

  // Cargar obras sociales para el select
  useEffect(() => {
    const fetchObrasSociales = async () => {
      try {
        setLoadingObras(true);
        setObrasError(false);
        const response = await api.get("/obras-sociales");
        setObrasSociales(response.data);
      } catch {
        setObrasError(true);
        toast.error("Error al cargar obras sociales");
      } finally {
        setLoadingObras(false);
      }
    };

    fetchObrasSociales();
  }, []);

  // Cargar datos del paciente
  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const response = await api.get(`/pacientes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const p = response.data;

        setValue("nombre", p.nombre || "");
        setValue("apellido", p.apellido || "");
        setValue("telefono", p.telefono || "");
        setValue("email", p.email || "");
        setValue("dni", p.dni || "");
        setValue(
          "fechaNacimiento",
          p.fecha_nacimiento ? String(p.fecha_nacimiento).split("T")[0] : "",
        );
        setValue(
          "obraSocial",
          p.id_obra_social ? String(p.id_obra_social) : "",
        );
        setValue("numeroAfiliado", p.numero_afiliado || "");
      } catch (error: any) {
        if (error?.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error("No se pudo cargar el paciente.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchPaciente();
  }, [id, setValue]);

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm sm:text-base outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60
    ${
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-300 focus:border-cyan-500 focus:ring-cyan-100"
    }`;

  const onSubmit = async (data: PacienteFormData) => {
    try {
      setIsSaving(true);
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

      await api.put(`/pacientes/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Paciente actualizado correctamente");
      navigate("/pacientes");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Error al actualizar paciente",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
        <Header />
        <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-12 text-center">
          <p className="text-slate-500">
            El paciente no existe o fue eliminado.
          </p>
          <button
            onClick={() => navigate("/pacientes")}
            className="mt-4 inline-flex items-center gap-2 text-cyan-700 hover:underline"
          >
            <ArrowLeft size={16} /> Volver al listado
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <Header />

      <main className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-8 space-y-6">
        <div>
          <button
            onClick={() => navigate("/pacientes")}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
          >
            <ArrowLeft size={16} /> Volver al listado
          </button>

          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-[0.03em] text-[#0A6BB8] leading-none">
            Editar Paciente
          </h1>
          <p className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-slate-500 font-medium">
            Actualizar los datos de la ficha
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <fieldset disabled={isSaving} className="contents">
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
                      maxLength={100}
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
                      maxLength={100}
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
                      <span className="text-slate-400 font-normal">
                        (opcional)
                      </span>
                    </label>
                    <input
                      id="telefono"
                      type="tel"
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
                      <span className="text-slate-400 font-normal">
                        (opcional)
                      </span>
                    </label>
                    <input
                      id="email"
                      type="email"
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
                      aria-invalid={!!errors.obraSocial}
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
                      <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
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
                      <span className="text-slate-400 font-normal">
                        (opcional)
                      </span>
                    </label>
                    <input
                      id="numeroAfiliado"
                      type="text"
                      maxLength={50}
                      className={inputClass(!!errors.numeroAfiliado)}
                      {...register("numeroAfiliado")}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/pacientes")}
                  disabled={isSaving}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white shadow-md shadow-cyan-200 transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  {isSaving ? "Guardando…" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
