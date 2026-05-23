import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export const fmt = (d: Date | string, pattern = "dd/MM/yyyy") =>
  format(typeof d === "string" ? parseISO(d) : d, pattern, { locale: es });

export const toISO = (d: Date) => format(d, "yyyy-MM-dd");

export const diasEntre = (inicio: string, fin: string) =>
  differenceInCalendarDays(parseISO(fin), parseISO(inicio)) + 1;

export const incluyeFecha = (fechaISO: string, inicioISO: string, finISO: string) =>
  isWithinInterval(parseISO(fechaISO), {
    start: parseISO(inicioISO),
    end: parseISO(finISO),
  });

export const semanaActual = (d: Date = new Date()) => ({
  inicio: startOfWeek(d, { weekStartsOn: 1 }),
  fin: endOfWeek(d, { weekStartsOn: 1 }),
});

export const semanasDelMes = (year: number, month: number) => {
  // month es 0-based para coincidir con Date
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = startOfWeek(first, { weekStartsOn: 1 });
  const end = endOfWeek(last, { weekStartsOn: 1 });
  const semanas: { inicio: Date; fin: Date }[] = [];
  let cursor = start;
  while (cursor <= end) {
    const finSemana = endOfWeek(cursor, { weekStartsOn: 1 });
    semanas.push({ inicio: cursor, fin: finSemana });
    cursor = addDays(finSemana, 1);
  }
  return semanas;
};

export const diasDelMes = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return eachDayOfInterval({ start: first, end: last });
};

export const nombreMes = (month: number, year: number) =>
  format(new Date(year, month, 1), "LLLL yyyy", { locale: es });

export const nombreDiaCorto = (d: Date) =>
  format(d, "EEE", { locale: es });
