// Utilidades de fecha narrativa exandriana ("13 de Sydenstar, 836 PD").
// Compartidas entre /cronica (jugadores) y /dm (editor de crónica).

import { HOLIDAYS, type Holiday } from "@/data/cosmology";

// Extrae día y mes de una fecha exandriana ("13 de Sydenstar, 836 PD").
// Devuelve null si el texto no empieza por "D de Mes" (fecha malformada).
export function parseGameDate(text: string): { day: number; month: string } | null {
  const m = /^(\d{1,2}) de ([A-Za-zÁ-ú']+)/.exec(text.trim());
  return m ? { day: Number(m[1]), month: m[2].toLowerCase() } : null;
}

// Coincidencia exacta día+mes: evita que "13 de Fessuran" active "3 de Fessuran".
export function isHolidayDate(campaignDate: string, holidayDate: string): boolean {
  const a = parseGameDate(campaignDate);
  const b = parseGameDate(holidayDate);
  return !!a && !!b && a.day === b.day && a.month === b.month;
}

// Festividad exacta para una fecha de campaña, o null si no coincide con ninguna.
export function holidayFor(campaignDate: string): Holiday | null {
  if (!campaignDate.trim()) return null;
  return HOLIDAYS.find((h) => isHolidayDate(campaignDate, h.date)) ?? null;
}
