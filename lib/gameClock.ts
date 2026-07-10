// Derivación pura del reloj de campaña exandriano: convierte minutos de
// juego absolutos (desde el año 0 PD, día 1 de Horisal, 00:00) en una fecha
// y hora legibles (mes, día, estación, fase lunar, festividad...) y viceversa.
// Sin React ni Supabase: solo aritmética sobre `data/cosmology.ts`.

import { CALENDAR, SEASONS } from "@/data/cosmology";
import { holidayFor, parseGameDate } from "@/lib/gameDate";

export type GameMoment = {
  year: number;
  monthIndex: number;
  monthName: string;
  day: number; // día del mes (1..)
  hour: number;
  minute: number;
  weekdayName: string;
  dayOfYear: number; // 1..328
  season: string; // nombre de SEASONS
  moonPhase: string;
  moonIcon: string;
  holiday: string | null;
  dateStr: string; // "D de Mes, AAAA PD"
};

const MINUTES_PER_DAY = 24 * 60;
const YEAR_DAYS = CALENDAR.yearDays; // 328
const YEAR_MINUTES = YEAR_DAYS * MINUTES_PER_DAY;

const MOON_PHASE_NAMES = [
  "Luna nueva",
  "Luna creciente",
  "Cuarto creciente",
  "Gibosa creciente",
  "Luna llena",
  "Gibosa menguante",
  "Cuarto menguante",
  "Luna menguante",
];

const MOON_PHASE_ICONS = [
  "fa-circle",
  "fa-moon",
  "fa-circle-half-stroke",
  "fa-moon",
  "fa-circle",
  "fa-moon",
  "fa-circle-half-stroke",
  "fa-moon",
];

const CATHA_CYCLE_DAYS = 33;

// Día-del-año (1-based) del inicio de un mes dado (0-based), sumando los
// días de todos los meses previos según `CALENDAR.monthDays`.
function dayOfYearForMonthStart(monthIndex: number): number {
  let acc = 0;
  for (let i = 0; i < monthIndex; i++) acc += CALENDAR.monthDays[i];
  return acc + 1;
}

// Parsea "D de Mes" (con posible texto extra, p.ej. "26 de Unndilar (el
// Cénit)") a día-del-año (1..328) usando `CALENDAR.monthDays`. Reutiliza
// `parseGameDate` (tolerante a sufijos) sin exigir año.
function seasonStartToDayOfYear(start: string): number {
  const parsed = parseGameDate(start);
  if (!parsed) return 1;
  const monthIndex = CALENDAR.months.findIndex(
    (m) => m.toLowerCase() === parsed.month
  );
  if (monthIndex < 0) return 1;
  return dayOfYearForMonthStart(monthIndex) + (parsed.day - 1);
}

// Nombre de la estación cuyo rango [start, start+days) contiene `dayOfYear`,
// envolviendo el fin de año (328 → 1).
function seasonForDayOfYear(dayOfYear: number): string {
  for (const s of SEASONS) {
    const startDoY = seasonStartToDayOfYear(s.start);
    const offset = ((dayOfYear - startDoY) % YEAR_DAYS + YEAR_DAYS) % YEAR_DAYS;
    if (offset < s.days) return s.name;
  }
  // No debería ocurrir (las estaciones suman 328 días), pero por seguridad:
  return SEASONS[SEASONS.length - 1].name;
}

// gameMinAbs = minutos absolutos desde el año 0 PD, día 1 de Horisal, 00:00.
export function momentFromGameMin(gameMinAbs: number): GameMoment {
  const totalMin = Math.max(0, Math.floor(gameMinAbs));

  const year = Math.floor(totalMin / YEAR_MINUTES);
  const minInYear = totalMin - year * YEAR_MINUTES;

  const dayIndexInYear = Math.floor(minInYear / MINUTES_PER_DAY); // 0-based
  const dayOfYear = dayIndexInYear + 1; // 1..328

  let remaining = dayIndexInYear;
  let monthIndex = 0;
  for (let i = 0; i < CALENDAR.monthDays.length; i++) {
    const len = CALENDAR.monthDays[i];
    if (remaining < len) {
      monthIndex = i;
      break;
    }
    remaining -= len;
    monthIndex = i;
  }
  const day = remaining + 1;
  const monthName = CALENDAR.months[monthIndex];

  const minInDay = minInYear % MINUTES_PER_DAY;
  const hour = Math.floor(minInDay / 60);
  const minute = minInDay % 60;

  const dayCount = Math.floor(totalMin / MINUTES_PER_DAY); // días desde el epoch, ciclo continuo
  const weekdayName = CALENDAR.weekdays[dayCount % CALENDAR.weekdays.length];

  const season = seasonForDayOfYear(dayOfYear);

  const cathaDay = ((dayCount % CATHA_CYCLE_DAYS) + CATHA_CYCLE_DAYS) % CATHA_CYCLE_DAYS;
  const phaseIdx = Math.floor((cathaDay / CATHA_CYCLE_DAYS) * 8) % 8;
  const moonPhase = MOON_PHASE_NAMES[phaseIdx];
  const moonIcon = MOON_PHASE_ICONS[phaseIdx];

  const dateStr = `${day} de ${monthName}, ${year} PD`;
  const holiday = holidayFor(dateStr)?.name ?? null;

  return {
    year,
    monthIndex,
    monthName,
    day,
    hour,
    minute,
    weekdayName,
    dayOfYear,
    season,
    moonPhase,
    moonIcon,
    holiday,
    dateStr,
  };
}

export function gameMinFromMoment(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute: number
): number {
  let daysBeforeMonth = 0;
  for (let i = 0; i < monthIndex; i++) daysBeforeMonth += CALENDAR.monthDays[i];
  return (
    year * YEAR_MINUTES +
    (daysBeforeMonth + (day - 1)) * MINUTES_PER_DAY +
    hour * 60 +
    minute
  );
}
