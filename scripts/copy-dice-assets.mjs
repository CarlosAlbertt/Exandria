// Copia los assets de @3d-dice/dice-box a public/dice-box/assets para que la
// app los sirva localmente (offline, compatible con Vercel). Se ejecuta en
// postinstall y puede lanzarse a mano: node scripts/copy-dice-assets.mjs
import { cp, rm, mkdir, access } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url)) + "/..";
const src = `${root}/node_modules/@3d-dice/dice-box/dist/assets`;
const dest = `${root}/public/dice-box/assets`;

try {
  await access(src);
} catch {
  console.warn("[copy-dice-assets] assets de dice-box no encontrados; se omite.");
  process.exit(0);
}

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });
console.log(`[copy-dice-assets] assets copiados a ${dest}`);
