export type Trabajador = {
  id: string;
  nombre: string;
  apellidos: string | null;
  email: string | null;
  puesto: string | null;
  departamento: string | null;
  fecha_alta: string | null;
  dias_vacaciones_anuales: number;
  activo: boolean;
  notas: string | null;
  created_at?: string;
};

export type TipoAusencia =
  | "vacaciones"
  | "baja_medica"
  | "permiso"
  | "asuntos_propios"
  | "formacion"
  | "otro";

export type Ausencia = {
  id: string;
  trabajador_id: string;
  tipo: TipoAusencia;
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string;    // YYYY-MM-DD
  motivo: string | null;
  aprobado: boolean;
  created_at?: string;
};

export type EstadoAsistencia = "presente" | "ausente" | "teletrabajo" | "retraso";

export type Asistencia = {
  id: string;
  trabajador_id: string;
  fecha: string;
  estado: EstadoAsistencia;
  hora_entrada: string | null;
  hora_salida: string | null;
  notas: string | null;
};

export const TIPO_LABEL: Record<TipoAusencia, string> = {
  vacaciones: "Vacaciones",
  baja_medica: "Baja médica",
  permiso: "Permiso",
  asuntos_propios: "Asuntos propios",
  formacion: "Formación",
  otro: "Otro",
};

export const TIPO_COLOR: Record<TipoAusencia, string> = {
  vacaciones: "bg-emerald-100 text-emerald-800 border-emerald-300",
  baja_medica: "bg-rose-100 text-rose-800 border-rose-300",
  permiso: "bg-amber-100 text-amber-800 border-amber-300",
  asuntos_propios: "bg-violet-100 text-violet-800 border-violet-300",
  formacion: "bg-sky-100 text-sky-800 border-sky-300",
  otro: "bg-slate-100 text-slate-800 border-slate-300",
};

export const TIPO_DOT: Record<TipoAusencia, string> = {
  vacaciones: "bg-emerald-500",
  baja_medica: "bg-rose-500",
  permiso: "bg-amber-500",
  asuntos_propios: "bg-violet-500",
  formacion: "bg-sky-500",
  otro: "bg-slate-500",
};

export const ESTADO_LABEL: Record<EstadoAsistencia, string> = {
  presente: "Presente",
  ausente: "Ausente",
  teletrabajo: "Teletrabajo",
  retraso: "Retraso",
};

export const ESTADO_COLOR: Record<EstadoAsistencia, string> = {
  presente: "bg-emerald-100 text-emerald-800 border-emerald-300",
  ausente: "bg-rose-100 text-rose-800 border-rose-300",
  teletrabajo: "bg-sky-100 text-sky-800 border-sky-300",
  retraso: "bg-amber-100 text-amber-800 border-amber-300",
};
