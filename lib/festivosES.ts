// ============================================================
// Catálogo de festivos en España (2026 y 2027)
// ============================================================
// Datos basados en el calendario laboral publicado por el BOE
// y los calendarios autonómicos publicados por cada CC.AA.
//
// Notas:
// - Cuando un festivo nacional cae en domingo, varias comunidades lo
//   trasladan al lunes siguiente. Aquí se incluye el día efectivo según
//   el calendario laboral estatal más extendido.
// - Las localidades sólo recogen una selección curada de capitales de
//   provincia. El admin puede añadir manualmente cualquier otro festivo
//   local específico desde el formulario "+ Nuevo festivo".
// ============================================================

export type FestivoEntry = { fecha: string; nombre: string };
export type FestivosPorAnio = Record<number, FestivoEntry[]>;

export type ComunidadCatalogo = {
  codigo: string;   // p.ej. "AN"
  nombre: string;   // p.ej. "Andalucía"
  festivos: FestivosPorAnio;
};

export type LocalidadCatalogo = {
  slug: string;     // p.ej. "sevilla"
  nombre: string;   // p.ej. "Sevilla"
  comunidad: string; // código de la comunidad (para filtrar)
  festivos: FestivosPorAnio;
};

// -------------------- NACIONALES --------------------
// Calendario laboral común para toda España. Los festivos que caen en
// domingo y se trasladan se indican explícitamente.
export const FESTIVOS_NACIONALES: FestivosPorAnio = {
  2026: [
    { fecha: "2026-01-01", nombre: "Año Nuevo" },
    { fecha: "2026-01-06", nombre: "Epifanía del Señor" },
    { fecha: "2026-04-03", nombre: "Viernes Santo" },
    { fecha: "2026-05-01", nombre: "Fiesta del Trabajo" },
    { fecha: "2026-08-15", nombre: "Asunción de la Virgen" },
    { fecha: "2026-10-12", nombre: "Fiesta Nacional de España" },
    { fecha: "2026-11-02", nombre: "Día de Todos los Santos (trasladado)" },
    { fecha: "2026-12-07", nombre: "Día de la Constitución (trasladado)" },
    { fecha: "2026-12-08", nombre: "Inmaculada Concepción" },
    { fecha: "2026-12-25", nombre: "Natividad del Señor" },
  ],
  2027: [
    { fecha: "2027-01-01", nombre: "Año Nuevo" },
    { fecha: "2027-01-06", nombre: "Epifanía del Señor" },
    { fecha: "2027-03-26", nombre: "Viernes Santo" },
    { fecha: "2027-05-01", nombre: "Fiesta del Trabajo (sábado)" },
    { fecha: "2027-08-15", nombre: "Asunción de la Virgen (domingo)" },
    { fecha: "2027-10-12", nombre: "Fiesta Nacional de España" },
    { fecha: "2027-11-01", nombre: "Día de Todos los Santos" },
    { fecha: "2027-12-06", nombre: "Día de la Constitución" },
    { fecha: "2027-12-08", nombre: "Inmaculada Concepción" },
    { fecha: "2027-12-25", nombre: "Natividad del Señor (sábado)" },
  ],
};

// -------------------- COMUNIDADES AUTÓNOMAS --------------------
// Festivos propios de cada CC.AA. (los nacionales NO se repiten aquí).
export const COMUNIDADES: ComunidadCatalogo[] = [
  {
    codigo: "AN",
    nombre: "Andalucía",
    festivos: {
      2026: [
        { fecha: "2026-02-28", nombre: "Día de Andalucía" },
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
      ],
      2027: [
        { fecha: "2027-03-01", nombre: "Día de Andalucía (trasladado)" },
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
      ],
    },
  },
  {
    codigo: "AR",
    nombre: "Aragón",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-04-23", nombre: "San Jorge - Día de Aragón" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-04-23", nombre: "San Jorge - Día de Aragón" },
      ],
    },
  },
  {
    codigo: "AS",
    nombre: "Asturias",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-09-08", nombre: "Día de Asturias" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-09-08", nombre: "Día de Asturias" },
      ],
    },
  },
  {
    codigo: "IB",
    nombre: "Illes Balears",
    festivos: {
      2026: [
        { fecha: "2026-03-02", nombre: "Día de les Illes Balears (trasladado)" },
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-04-06", nombre: "Lunes de Pascua" },
      ],
      2027: [
        { fecha: "2027-03-01", nombre: "Día de les Illes Balears" },
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-03-29", nombre: "Lunes de Pascua" },
      ],
    },
  },
  {
    codigo: "CN",
    nombre: "Canarias",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-05-30", nombre: "Día de Canarias (sábado)" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-05-31", nombre: "Día de Canarias (trasladado)" },
      ],
    },
  },
  {
    codigo: "CB",
    nombre: "Cantabria",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-07-28", nombre: "Día de las Instituciones" },
        { fecha: "2026-09-15", nombre: "La Bien Aparecida" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-07-28", nombre: "Día de las Instituciones" },
        { fecha: "2027-09-15", nombre: "La Bien Aparecida" },
      ],
    },
  },
  {
    codigo: "CL",
    nombre: "Castilla y León",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-04-23", nombre: "Día de Castilla y León" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-04-23", nombre: "Día de Castilla y León" },
      ],
    },
  },
  {
    codigo: "CM",
    nombre: "Castilla-La Mancha",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-06-04", nombre: "Corpus Christi" },
        { fecha: "2026-05-31", nombre: "Día de Castilla-La Mancha (domingo)" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-05-27", nombre: "Corpus Christi" },
        { fecha: "2027-05-31", nombre: "Día de Castilla-La Mancha" },
      ],
    },
  },
  {
    codigo: "CT",
    nombre: "Cataluña",
    festivos: {
      2026: [
        { fecha: "2026-04-06", nombre: "Lunes de Pascua" },
        { fecha: "2026-06-24", nombre: "San Juan" },
        { fecha: "2026-09-11", nombre: "Diada Nacional de Catalunya" },
        { fecha: "2026-12-26", nombre: "San Esteban" },
      ],
      2027: [
        { fecha: "2027-03-29", nombre: "Lunes de Pascua" },
        { fecha: "2027-06-24", nombre: "San Juan" },
        { fecha: "2027-09-11", nombre: "Diada Nacional de Catalunya" },
        { fecha: "2027-12-25", nombre: "San Esteban (sábado)" },
      ],
    },
  },
  {
    codigo: "VC",
    nombre: "Comunitat Valenciana",
    festivos: {
      2026: [
        { fecha: "2026-03-19", nombre: "San José" },
        { fecha: "2026-04-06", nombre: "Lunes de Pascua" },
        { fecha: "2026-06-24", nombre: "San Juan" },
        { fecha: "2026-10-09", nombre: "Día de la Comunitat Valenciana" },
      ],
      2027: [
        { fecha: "2027-03-19", nombre: "San José" },
        { fecha: "2027-03-29", nombre: "Lunes de Pascua" },
        { fecha: "2027-06-24", nombre: "San Juan" },
        { fecha: "2027-10-09", nombre: "Día de la Comunitat Valenciana (sábado)" },
      ],
    },
  },
  {
    codigo: "EX",
    nombre: "Extremadura",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-09-08", nombre: "Día de Extremadura" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-09-08", nombre: "Día de Extremadura" },
      ],
    },
  },
  {
    codigo: "GA",
    nombre: "Galicia",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-05-18", nombre: "Día das Letras Galegas (trasladado)" },
        { fecha: "2026-07-25", nombre: "Día Nacional de Galicia (sábado)" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-05-17", nombre: "Día das Letras Galegas" },
        { fecha: "2027-07-26", nombre: "Día Nacional de Galicia (trasladado)" },
      ],
    },
  },
  {
    codigo: "MD",
    nombre: "Comunidad de Madrid",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-05-02", nombre: "Día de la Comunidad (sábado)" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-05-03", nombre: "Día de la Comunidad (trasladado)" },
      ],
    },
  },
  {
    codigo: "MC",
    nombre: "Región de Murcia",
    festivos: {
      2026: [
        { fecha: "2026-03-19", nombre: "San José" },
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-06-09", nombre: "Día de la Región de Murcia" },
      ],
      2027: [
        { fecha: "2027-03-19", nombre: "San José" },
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-06-09", nombre: "Día de la Región de Murcia" },
      ],
    },
  },
  {
    codigo: "NC",
    nombre: "Comunidad Foral de Navarra",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-04-06", nombre: "Lunes de Pascua" },
        { fecha: "2026-07-25", nombre: "Santiago Apóstol (sábado)" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-03-29", nombre: "Lunes de Pascua" },
        { fecha: "2027-07-26", nombre: "Santiago Apóstol (trasladado)" },
      ],
    },
  },
  {
    codigo: "PV",
    nombre: "País Vasco",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-04-06", nombre: "Lunes de Pascua" },
        { fecha: "2026-07-25", nombre: "Santiago Apóstol (sábado)" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-03-29", nombre: "Lunes de Pascua" },
        { fecha: "2027-07-26", nombre: "Santiago Apóstol (trasladado)" },
      ],
    },
  },
  {
    codigo: "RI",
    nombre: "La Rioja",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-06-09", nombre: "Día de La Rioja" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-06-09", nombre: "Día de La Rioja" },
      ],
    },
  },
  {
    codigo: "CE",
    nombre: "Ceuta",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-05-27", nombre: "Fiesta del Sacrificio (Eid al-Adha)" },
        { fecha: "2026-08-05", nombre: "Día de Ceuta" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-05-17", nombre: "Fiesta del Sacrificio (Eid al-Adha)" },
        { fecha: "2027-08-05", nombre: "Día de Ceuta" },
      ],
    },
  },
  {
    codigo: "ML",
    nombre: "Melilla",
    festivos: {
      2026: [
        { fecha: "2026-04-02", nombre: "Jueves Santo" },
        { fecha: "2026-05-27", nombre: "Fiesta del Sacrificio (Eid al-Adha)" },
        { fecha: "2026-09-17", nombre: "Día de Melilla" },
      ],
      2027: [
        { fecha: "2027-03-25", nombre: "Jueves Santo" },
        { fecha: "2027-05-17", nombre: "Fiesta del Sacrificio (Eid al-Adha)" },
        { fecha: "2027-09-17", nombre: "Día de Melilla" },
      ],
    },
  },
];

// -------------------- LOCALIDADES (selección curada) --------------------
// Festivos locales propios de cada ciudad (los autonómicos / nacionales
// no se repiten aquí). Si tu localidad no aparece, añade los suyos a mano.
export const LOCALIDADES: LocalidadCatalogo[] = [
  {
    slug: "sevilla",
    nombre: "Sevilla",
    comunidad: "AN",
    festivos: {
      2026: [
        { fecha: "2026-06-04", nombre: "Corpus Christi" },
        { fecha: "2026-09-08", nombre: "Virgen de los Reyes" },
      ],
      2027: [
        { fecha: "2027-05-27", nombre: "Corpus Christi" },
        { fecha: "2027-09-08", nombre: "Virgen de los Reyes" },
      ],
    },
  },
  {
    slug: "malaga",
    nombre: "Málaga",
    comunidad: "AN",
    festivos: {
      2026: [
        { fecha: "2026-08-19", nombre: "Feria de Málaga" },
        { fecha: "2026-09-08", nombre: "Virgen de la Victoria" },
      ],
      2027: [
        { fecha: "2027-08-19", nombre: "Feria de Málaga" },
        { fecha: "2027-09-08", nombre: "Virgen de la Victoria" },
      ],
    },
  },
  {
    slug: "granada",
    nombre: "Granada",
    comunidad: "AN",
    festivos: {
      2026: [
        { fecha: "2026-01-02", nombre: "Toma de Granada" },
        { fecha: "2026-06-04", nombre: "Corpus Christi" },
      ],
      2027: [
        { fecha: "2027-01-02", nombre: "Toma de Granada (sábado)" },
        { fecha: "2027-05-27", nombre: "Corpus Christi" },
      ],
    },
  },
  {
    slug: "cordoba",
    nombre: "Córdoba",
    comunidad: "AN",
    festivos: {
      2026: [
        { fecha: "2026-09-08", nombre: "Virgen de la Fuensanta" },
        { fecha: "2026-10-26", nombre: "San Rafael (trasladado)" },
      ],
      2027: [
        { fecha: "2027-09-08", nombre: "Virgen de la Fuensanta" },
        { fecha: "2027-10-25", nombre: "San Rafael (trasladado)" },
      ],
    },
  },
  {
    slug: "madrid",
    nombre: "Madrid",
    comunidad: "MD",
    festivos: {
      2026: [
        { fecha: "2026-05-15", nombre: "San Isidro Labrador" },
        { fecha: "2026-11-09", nombre: "Virgen de la Almudena" },
      ],
      2027: [
        { fecha: "2027-05-17", nombre: "San Isidro Labrador (trasladado)" },
        { fecha: "2027-11-09", nombre: "Virgen de la Almudena" },
      ],
    },
  },
  {
    slug: "barcelona",
    nombre: "Barcelona",
    comunidad: "CT",
    festivos: {
      2026: [
        { fecha: "2026-09-24", nombre: "La Mercè" },
      ],
      2027: [
        { fecha: "2027-09-24", nombre: "La Mercè" },
      ],
    },
  },
  {
    slug: "valencia",
    nombre: "Valencia",
    comunidad: "VC",
    festivos: {
      2026: [
        { fecha: "2026-04-20", nombre: "Lunes de San Vicente Ferrer" },
        { fecha: "2026-10-09", nombre: "Día de la Comunitat" },
      ],
      2027: [
        { fecha: "2027-04-12", nombre: "Lunes de San Vicente Ferrer" },
      ],
    },
  },
  {
    slug: "zaragoza",
    nombre: "Zaragoza",
    comunidad: "AR",
    festivos: {
      2026: [
        { fecha: "2026-01-29", nombre: "San Valero" },
        { fecha: "2026-10-12", nombre: "Virgen del Pilar" },
      ],
      2027: [
        { fecha: "2027-01-29", nombre: "San Valero" },
        { fecha: "2027-10-12", nombre: "Virgen del Pilar" },
      ],
    },
  },
  {
    slug: "bilbao",
    nombre: "Bilbao",
    comunidad: "PV",
    festivos: {
      2026: [
        { fecha: "2026-08-25", nombre: "Aste Nagusia" },
      ],
      2027: [
        { fecha: "2027-08-25", nombre: "Aste Nagusia" },
      ],
    },
  },
  {
    slug: "murcia",
    nombre: "Murcia",
    comunidad: "MC",
    festivos: {
      2026: [
        { fecha: "2026-04-07", nombre: "Bando de la Huerta" },
        { fecha: "2026-09-08", nombre: "Romería de la Fuensanta" },
      ],
      2027: [
        { fecha: "2027-03-30", nombre: "Bando de la Huerta" },
        { fecha: "2027-09-08", nombre: "Romería de la Fuensanta" },
      ],
    },
  },
  {
    slug: "palma",
    nombre: "Palma de Mallorca",
    comunidad: "IB",
    festivos: {
      2026: [
        { fecha: "2026-01-20", nombre: "San Sebastián" },
        { fecha: "2026-12-31", nombre: "Festa de l'Estendard" },
      ],
      2027: [
        { fecha: "2027-01-20", nombre: "San Sebastián" },
        { fecha: "2027-12-31", nombre: "Festa de l'Estendard" },
      ],
    },
  },
  {
    slug: "las-palmas",
    nombre: "Las Palmas de Gran Canaria",
    comunidad: "CN",
    festivos: {
      2026: [
        { fecha: "2026-06-24", nombre: "Fundación de la Ciudad" },
      ],
      2027: [
        { fecha: "2027-06-24", nombre: "Fundación de la Ciudad" },
      ],
    },
  },
  {
    slug: "vigo",
    nombre: "Vigo",
    comunidad: "GA",
    festivos: {
      2026: [
        { fecha: "2026-03-28", nombre: "Reconquista de Vigo (sábado)" },
        { fecha: "2026-08-16", nombre: "San Roque (domingo)" },
      ],
      2027: [
        { fecha: "2027-03-29", nombre: "Reconquista de Vigo" },
        { fecha: "2027-08-16", nombre: "San Roque" },
      ],
    },
  },
  {
    slug: "valladolid",
    nombre: "Valladolid",
    comunidad: "CL",
    festivos: {
      2026: [
        { fecha: "2026-09-08", nombre: "Virgen de San Lorenzo" },
        { fecha: "2026-09-21", nombre: "San Mateo" },
      ],
      2027: [
        { fecha: "2027-09-08", nombre: "Virgen de San Lorenzo" },
        { fecha: "2027-09-20", nombre: "San Mateo (trasladado)" },
      ],
    },
  },
  {
    slug: "alicante",
    nombre: "Alicante",
    comunidad: "VC",
    festivos: {
      2026: [
        { fecha: "2026-06-24", nombre: "San Juan (Hogueras)" },
        { fecha: "2026-08-05", nombre: "Mare de Déu del Remei" },
      ],
      2027: [
        { fecha: "2027-06-24", nombre: "San Juan (Hogueras)" },
        { fecha: "2027-08-05", nombre: "Mare de Déu del Remei" },
      ],
    },
  },
];

// -------------------- Helper de años disponibles --------------------
export const ANIOS_DISPONIBLES = [2026, 2027] as const;
