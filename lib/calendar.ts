// Aritmética PURA del calendario exandriano, compartida por la rueda de /reino
// y el desplegable del reloj en la barra de navegación. Sin React: aquí solo
// hay cuentas sobre `data/cosmology.ts`.
//
// Convenciones:
//  - doy  = día del año, 1..328.
//  - abs  = día absoluto desde el epoch = año*328 + (doy-1). Con él salen el
//           día de la semana y la fase de Catha (mismo origen que gameClock).

import { CALENDAR, SEASONS, HOLIDAYS } from "@/data/cosmology";

export const YEAR = CALENDAR.yearDays;
export const WEEK = CALENDAR.weekdays.length;

export const SEASON_COLOR: Record<string, string> = {
  Primavera: "var(--color-primitivo)",
  Verano: "var(--color-bronze)",
  Otoño: "var(--color-ember)",
  Invierno: "var(--color-arcane)",
};

export const SEASON_ICON: Record<string, string> = {
  Primavera: "fa-seedling",
  Verano: "fa-sun",
  Otoño: "fa-leaf",
  Invierno: "fa-snowflake",
};

// Día del año en que empieza cada mes.
export const STARTS: number[] = (() => {
  const out: number[] = [];
  let acc = 0;
  for (const d of CALENDAR.monthDays) { out.push(acc + 1); acc += d; }
  return out;
})();

// "13 de Dualahei" / "26 de Unndilar (el Cénit)" -> día del año.
export function doyFromDate(date: string): number | null {
  const m = date.match(/^\s*(\d+)\s+de\s+([^\s(,]+)/i);
  if (!m) return null;
  const mi = CALENDAR.months.findIndex((x) => x.toLowerCase() === m[2].trim().toLowerCase());
  if (mi < 0) return null;
  return STARTS[mi] + (Number(m[1]) - 1);
}

export const SEASON_RANGES = SEASONS.map((s) => ({
  name: s.name, days: s.days, start: doyFromDate(s.start) ?? 1,
}));

export function seasonOfDay(doy: number): string {
  for (const s of SEASON_RANGES) {
    const off = ((doy - s.start) % YEAR + YEAR) % YEAR;
    if (off < s.days) return s.name;
  }
  return SEASON_RANGES[SEASON_RANGES.length - 1].name;
}

// Días que le quedan a la estación en curso.
export function daysLeftInSeason(doy: number, seasonName: string): number | null {
  const s = SEASON_RANGES.find((x) => x.name === seasonName);
  if (!s) return null;
  return s.days - ((((doy - s.start) % YEAR) + YEAR) % YEAR);
}

export type HolidayAt = (typeof HOLIDAYS)[number] & { doy: number };

export const HOLIDAY_DOY: HolidayAt[] = HOLIDAYS
  .map((h) => ({ ...h, doy: doyFromDate(h.date) }))
  .filter((h): h is HolidayAt => h.doy != null);

// Próxima festividad desde `doy` (envolviendo el fin de año). `falta` 0 = hoy.
export function nextHoliday(doy: number): (HolidayAt & { falta: number }) | null {
  const list = HOLIDAY_DOY
    .map((h) => ({ ...h, falta: ((h.doy - doy) % YEAR + YEAR) % YEAR }))
    .sort((a, b) => a.falta - b.falta);
  return list[0] ?? null;
}

export const absDayOf = (year: number, doy: number) => year * YEAR + (doy - 1);

// Celdas de la rejilla de un mes: huecos iniciales para cuadrar el día de la
// semana, y luego 1..n. El offset sale del día absoluto, así que la rejilla
// siempre casa con el `weekdayName` de gameClock.
export function monthCells(mi: number, year: number): { cells: (number | null)[]; firstDoy: number; days: number } {
  const firstDoy = STARTS[mi];
  const days = CALENDAR.monthDays[mi];
  const offset = ((absDayOf(year, firstDoy) % WEEK) + WEEK) % WEEK;
  return {
    firstDoy,
    days,
    cells: [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: days }, (_, i) => i + 1),
    ],
  };
}

export const weekdayOf = (abs: number) => CALENDAR.weekdays[((abs % WEEK) + WEEK) % WEEK];
export const isWeekend = (abs: number) => CALENDAR.weekend.includes(weekdayOf(abs));
export const holidayAt = (doy: number) => HOLIDAY_DOY.find((h) => h.doy === doy);
