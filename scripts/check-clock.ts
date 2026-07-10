// Script de comprobación manual para lib/gameClock.ts.
// Uso: npx tsx scripts/check-clock.ts
import { momentFromGameMin, gameMinFromMoment } from "../lib/gameClock";
import { CALENDAR, SEASONS } from "../data/cosmology";

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

let failures = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`OK   ${label}`);
  } else {
    console.log(`FAIL ${label}`);
    failures++;
  }
}

// --- Ida y vuelta: varias fechas ---
const roundTripCases: [number, number, number, number, number][] = [
  [836, 0, 1, 8, 0],
  [836, 1, 1, 0, 0],
  [836, 2, 20, 12, 0],
  [0, 0, 1, 0, 0],
  [836, 10, 32, 23, 59],
  [900, 5, 15, 6, 30],
];
for (const [year, monthIndex, day, hour, minute] of roundTripCases) {
  const m = momentFromGameMin(gameMinFromMoment(year, monthIndex, day, hour, minute));
  check(
    `Ida y vuelta (${year},${monthIndex},${day},${hour}:${minute})`,
    m.year === year &&
      m.monthIndex === monthIndex &&
      m.day === day &&
      m.hour === hour &&
      m.minute === minute
  );
}

// --- gameMinFromMoment(836,0,1,8,0) ---
{
  const m = momentFromGameMin(gameMinFromMoment(836, 0, 1, 8, 0));
  check("836,0,1,8,0: year 836", m.year === 836);
  check("836,0,1,8,0: monthIndex 0", m.monthIndex === 0);
  check("836,0,1,8,0: monthName Horisal", m.monthName === "Horisal");
  check("836,0,1,8,0: day 1", m.day === 1);
  check("836,0,1,8,0: hour 8", m.hour === 8);
  check("836,0,1,8,0: minute 0", m.minute === 0);
  check(
    "836,0,1,8,0: weekdayName es uno de CALENDAR.weekdays",
    CALENDAR.weekdays.includes(m.weekdayName)
  );
}

// --- dayOfYear de 1 de Misuthar (monthIndex 1) = 30 (Horisal tiene 29) ---
{
  const m = momentFromGameMin(gameMinFromMoment(836, 1, 1, 0, 0));
  check("1 de Misuthar: dayOfYear === 30", m.dayOfYear === 30);
}

// --- Festividad: 20 de Dualahei (monthIndex 2) → "Esplendor Salvaje" ---
{
  const m = momentFromGameMin(gameMinFromMoment(836, 2, 20, 12, 0));
  check('20 de Dualahei: dateStr = "20 de Dualahei, 836 PD"', m.dateStr === "20 de Dualahei, 836 PD");
  check('20 de Dualahei: holiday === "Esplendor Salvaje"', m.holiday === "Esplendor Salvaje");
}

// --- Estación válida y fase lunar válida ---
{
  const m = momentFromGameMin(gameMinFromMoment(836, 0, 1, 8, 0));
  check(
    "season es uno de SEASONS",
    SEASONS.some((s) => s.name === m.season)
  );
  check("season de 1 de Horisal es Invierno", m.season === "Invierno");
  check(
    "moonPhase es una de las 8 fases",
    MOON_PHASE_NAMES.includes(m.moonPhase)
  );
}

// --- Fase lunar varía a lo largo del ciclo de Catha (33 días) ---
{
  const phasesSeen = new Set<string>();
  for (let d = 0; d < 33; d++) {
    const m = momentFromGameMin(gameMinFromMoment(836, 0, 1, 0, 0) + d * 1440);
    phasesSeen.add(m.moonPhase);
  }
  check("moonPhase recorre varias fases en 33 días", phasesSeen.size > 1);
}

console.log(failures === 0 ? "\nTodas las comprobaciones pasaron." : `\n${failures} comprobación(es) fallaron.`);
process.exit(failures === 0 ? 0 : 1);
