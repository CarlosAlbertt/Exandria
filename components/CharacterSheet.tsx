"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadActiveCharacter, saveCharacter, listCharacters, archiveCharacter, type Item, type CharacterData } from "@/lib/character";
import type { Asi } from "@/lib/character";
import { archivedOf, MAX_CHARACTERS } from "@/lib/archive";
import { getSpecies } from "@/data/species";
import { getClass } from "@/data/classes";
import { getBackground } from "@/data/backgrounds";
import { ABILITIES, AbilityKey, fmtMod } from "@/data/rules";
import { reachedAsiLevels } from "@/data/leveling";
import { CATALOG, ItemCat } from "@/data/equipment";
import LevelPanel from "@/components/LevelPanel";
import Paperdoll from "@/components/Paperdoll";
import PortraitFrame from "@/components/PortraitFrame";
import InitiativeTracker from "@/components/InitiativeTracker";
import { derive } from "@/lib/derive";
import { getMechanics, type ClassFeature } from "@/data/classdata";
import { useSession } from "@/components/SessionProvider";
import { publishRoll } from "@/lib/useDiceFeed";
import PozosClase from "@/components/personaje/PozosClase";
import EstadoVivo from "@/components/personaje/EstadoVivo";
import { ventajaDe } from "@/lib/estado";
import type { PlayState } from "@/lib/recursos";

const BUILD_KEY = "taldorei.build.v1";
const SHEET_KEY = "taldorei.sheet.v1";

const EMPTY_SCORES: Record<AbilityKey, number> = { fue: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 };
const NO_BONUS: Record<AbilityKey, number> = { fue: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 };

type Build = {
  name: string;
  species: string | null;
  lineage: string | null;
  cls: string | null;
  subclass: string | null;
  background: string | null;
  base: Record<AbilityKey, number>;
  bonus: Record<AbilityKey, number>;
};

const EMPTY_BUILD: Build = {
  name: "", species: null, lineage: null, cls: null, subclass: null, background: null,
  base: { ...EMPTY_SCORES }, bonus: { ...NO_BONUS },
};

/* --- helpers de inventario --- */
function removeOne(items: Item[], id: string): Item[] {
  const out: Item[] = [];
  for (const it of items) {
    if (it.id === id) {
      if (it.qty > 1) out.push({ ...it, qty: it.qty - 1 });
    } else out.push(it);
  }
  return out;
}
function addBack(items: Item[], item: Item): Item[] {
  const idx = items.findIndex((i) => i.name === item.name);
  if (idx >= 0) {
    const next = [...items];
    next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
    return next;
  }
  return [...items, { id: crypto.randomUUID(), name: item.name, qty: 1, notes: item.notes }];
}

type CharacterSheetProps = {
  targetUserId: string | null; // whose sheet (null = no session → localStorage)
  readOnly: boolean;
  saveMode: "self" | "dm";     // self = saveCharacter; dm = POST /api/dm/character
};

export default function CharacterSheet({ targetUserId, readOnly, saveMode }: CharacterSheetProps) {
  // Los botones de tirada (salvación/pericia) solo tienen sentido cuando la
  // ficha que se muestra es la del propio usuario logueado: el DM editando
  // la ficha de OTRO jugador (vía ?user=) no debe poder tirar "por" él.
  const session = useSession();
  const isOwner = !!session && !!targetUserId && session.id === targetUserId;

  const [build, setBuild] = useState<Build>({ ...EMPTY_BUILD });
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [gold, setGold] = useState(0);
  const [asi, setAsi] = useState<Asi>({});
  const [items, setItems] = useState<Item[]>([]);
  const [equipment, setEquipment] = useState<Record<string, Item>>({});
  const [hpRolls, setHpRolls] = useState<Record<string, number>>({});
  const [playState, setPlayState] = useState<PlayState>({}); // usos de los pozos de clase (Fase O1)
  const [skills, setSkills] = useState<string[]>([]); // pericias elegidas en /crear (solo lectura aquí)
  const [ac, setAc] = useState<number | null>(null); // CA: sesión-only (no se persiste)
  const [pickingSlot, setPickingSlot] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(true);
  // id de la ficha activa (saveCharacter va por id). Retirar/listar es la Tarea 5.
  const [characterId, setCharacterId] = useState<string | null>(null);
  // Huecos del jugador (activo + archivados), solo se cargan en la ficha propia.
  const [slots, setSlots] = useState<Awaited<ReturnType<typeof listCharacters>>>([]);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const [cat, setCat] = useState<ItemCat>("Aventura");
  const [openDoc, setOpenDoc] = useState<Item | null>(null); // documento in-game abierto (Fase M)
  const [loreUnlocked, setLoreUnlocked] = useState<string[]>([]); // saber aprendido por este PJ
  const [loreMsg, setLoreMsg] = useState<string | null>(null);

  // Leer un tomo ENSEÑA: al abrir un documento con `unlockLore`, esas entradas
  // se añaden al saber del personaje (solo en la ficha propia; si el DM está
  // mirando la hoja de otro, no se le concede nada a nadie).
  function openDocument(it: Item) {
    setOpenDoc(it);
    const ids = it.doc?.unlockLore ?? [];
    if (saveMode !== "self" || !characterId || ids.length === 0) return;
    const nuevos = ids.filter((id) => !loreUnlocked.includes(id));
    if (nuevos.length === 0) return;
    const next = [...loreUnlocked, ...nuevos];
    setLoreUnlocked(next);
    void saveCharacter(characterId, { lore_unlocked: next });
    setLoreMsg(`Has aprendido ${nuevos.length} cosa${nuevos.length === 1 ? "" : "s"} nueva${nuevos.length === 1 ? "" : "s"}. Míralo en El Mundo de Exandria.`);
  }
  const [custom, setCustom] = useState("");
  const [rollErr, setRollErr] = useState<string | null>(null); // error de publishRoll (salvación/pericia)

  // Carga: por targetUserId (nube/API), si no hay sesión → localStorage.
  useEffect(() => {
    let done = false;
    (async () => {
      if (targetUserId) {
        const row = await loadActiveCharacter(targetUserId);
        if (!done && row) {
          setCharacterId(row.id);
          setBuild({
            name: row.name ?? "",
            species: row.species ?? null,
            lineage: row.lineage ?? null,
            cls: row.cls ?? null,
            subclass: row.subclass ?? null,
            background: row.background ?? null,
            base: row.base && Object.keys(row.base).length ? row.base : { ...EMPTY_SCORES },
            bonus: row.bonus && Object.keys(row.bonus).length ? row.bonus : { ...NO_BONUS },
          });
          if (typeof row.level === "number") setLevel(row.level);
          if (typeof row.xp === "number") setXp(row.xp);
          if (typeof row.gold === "number") setGold(row.gold);
          if (row.asi) setAsi(row.asi);
          if (Array.isArray(row.items)) setItems(row.items);
          if (row.equipment) setEquipment(row.equipment);
          if (row.hp_rolls) setHpRolls(row.hp_rolls);
          if (Array.isArray(row.skills)) setSkills(row.skills);
          if (Array.isArray(row.lore_unlocked)) setLoreUnlocked(row.lore_unlocked);
          if (row.play_state && typeof row.play_state === "object") setPlayState(row.play_state as PlayState);
        }
      } else {
        try {
          const b = localStorage.getItem(BUILD_KEY);
          if (b) {
            const parsed = JSON.parse(b) as Partial<Build> & { skills?: string[] };
            if (Array.isArray(parsed.skills)) setSkills(parsed.skills);
            setBuild((prev) => ({
              ...prev,
              name: parsed.name ?? prev.name,
              species: parsed.species ?? prev.species,
              lineage: parsed.lineage ?? prev.lineage,
              cls: parsed.cls ?? prev.cls,
              subclass: parsed.subclass ?? prev.subclass,
              background: parsed.background ?? prev.background,
              base: parsed.base && Object.keys(parsed.base).length ? parsed.base : prev.base,
              bonus: parsed.bonus && Object.keys(parsed.bonus).length ? parsed.bonus : prev.bonus,
            }));
          }
          const s = localStorage.getItem(SHEET_KEY);
          if (s) {
            const sheet = JSON.parse(s) as { level?: number; gold?: number; asi?: Asi; items?: Item[]; equipment?: Record<string, Item>; hp_rolls?: Record<string, number>; play_state?: PlayState };
            if (typeof sheet.level === "number") setLevel(sheet.level);
            if (typeof sheet.gold === "number") setGold(sheet.gold);
            if (sheet.asi) setAsi(sheet.asi);
            if (Array.isArray(sheet.items)) setItems(sheet.items);
            if (sheet.equipment) setEquipment(sheet.equipment);
            if (sheet.hp_rolls) setHpRolls(sheet.hp_rolls);
            if (sheet.play_state) setPlayState(sheet.play_state);
          }
        } catch {}
      }
      if (!done) setLoaded(true);
    })();
    return () => { done = true; };
  }, [targetUserId]);

  // Huecos (activo + archivados) para el bloque de retirada, solo en la ficha
  // propia: el DM editando a otro (?user=) no necesita esta lista aquí.
  useEffect(() => {
    if (saveMode !== "self" || !targetUserId) return;
    listCharacters(targetUserId).then(setSlots);
  }, [saveMode, targetUserId]);

  // Adaptador de guardado: readOnly no guarda; sin sesión → localStorage;
  // con sesión → saveCharacter (self) o POST /api/dm/character (dm).
  async function persistSheet(patch: Partial<CharacterData>) {
    if (readOnly || !targetUserId) {
      if (!readOnly && !targetUserId) { try { localStorage.setItem(SHEET_KEY, JSON.stringify({ level, gold, asi, items, equipment, hp_rolls: hpRolls })); } catch {} }
      return;
    }
    if (saveMode === "self") { if (characterId) await saveCharacter(characterId, patch); return; }
    await fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: targetUserId, patch }) });
  }

  // Guardado de la ficha (nivel, oro, asi, items, equipo, tiradas PG). No toca los campos de build.
  useEffect(() => {
    if (!loaded) return;
    if (readOnly) return;
    const t = setTimeout(() => { persistSheet({ level, gold, asi, items, equipment, hp_rolls: hpRolls }); }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, gold, asi, items, equipment, hpRolls, loaded, readOnly, targetUserId, saveMode, characterId]);

  /* --- datos derivados --- */
  const species = build.species ? getSpecies(build.species) : undefined;
  const cls = build.cls ? getClass(build.cls) : undefined;
  const bg = build.background ? getBackground(build.background) : undefined;

  const preAsi = useMemo(() => {
    const out = {} as Record<AbilityKey, number>;
    ABILITIES.forEach((a) => (out[a.key] = (build.base[a.key] ?? 8) + (build.bonus[a.key] ?? 0)));
    return out;
  }, [build.base, build.bonus]);

  const hitDie = cls?.hitDie ?? 8;

  // Pericias competentes = trasfondo (fijas) + clase (elegidas en /crear).
  const mergedSkills = useMemo(
    () => Array.from(new Set([...(bg?.skills ?? []), ...skills])),
    [bg, skills]
  );

  // Objeto crudo que alimenta el motor de derivación (lib/derive.ts): única
  // fuente de verdad para puntuaciones finales, PG máx, CA, salvaciones,
  // pericias, percepción pasiva y (si conjurador) CD/ataque/espacios.
  const charForDerive: Partial<CharacterData> = useMemo(
    () => ({ level, cls: build.cls, base: build.base, bonus: build.bonus, asi, skills: mergedSkills, equipment, hp_rolls: hpRolls }),
    [level, build.cls, build.base, build.bonus, asi, mergedSkills, equipment, hpRolls]
  );
  const d = useMemo(() => derive(charForDerive), [charForDerive]);

  const finalScores = useMemo(() => {
    const out = {} as Record<AbilityKey, number>;
    ABILITIES.forEach((a) => (out[a.key] = d.abilities[a.key].score));
    return out;
  }, [d]);
  const mods = useMemo(() => {
    const out = {} as Record<AbilityKey, number>;
    ABILITIES.forEach((a) => (out[a.key] = d.abilities[a.key].mod));
    return out;
  }, [d]);

  const mechanics = useMemo(() => getMechanics(build.cls), [build.cls]);
  const featuresByLevel = useMemo(() => {
    if (!mechanics) return [] as { level: number; feats: ClassFeature[] }[];
    const visible = mechanics.features.filter((f) => f.level <= level && (!f.subclass || !!build.subclass));
    const map = new Map<number, ClassFeature[]>();
    for (const f of visible) {
      if (!map.has(f.level)) map.set(f.level, []);
      map.get(f.level)!.push(f);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([lvl, feats]) => ({ level: lvl, feats }));
  }, [mechanics, level, build.subclass]);

  const spellSlotChips = useMemo(() => {
    if (!d.spellSlots) return [] as { lvl: number; n: number }[];
    return d.spellSlots.map((n, i) => ({ lvl: i + 1, n })).filter((s) => s.n > 0);
  }, [d.spellSlots]);

  const cap = Math.max(10, 20 + 2 * mods.fue);
  const used = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const full = used >= cap;
  const acValue = ac ?? d.ac;

  /* --- handlers de nivel / asi --- */
  const onLevel = (n: number) => {
    const lvl = Math.max(1, Math.min(20, n));
    setLevel(lvl);
    setAsi((prev) => {
      const valid = new Set(reachedAsiLevels(build.cls, lvl).map(String));
      const next: Asi = {};
      for (const k of Object.keys(prev)) if (valid.has(k)) next[k] = prev[k];
      return next;
    });
  };

  const onAsi = (levelKey: string, key: AbilityKey, delta: number) => {
    setAsi((prev) => {
      const milestone = { ...(prev[levelKey] ?? {}) };
      const cur = milestone[key] ?? 0;
      const nextVal = Math.max(0, cur + delta);
      // suma del hito ≤ 2
      const sumOthers = (Object.entries(milestone) as [AbilityKey, number][])
        .reduce((s, [k, v]) => s + (k === key ? 0 : v ?? 0), 0);
      if (nextVal + sumOthers > 2) return prev;
      // puntuación final ≤ 20
      if (delta > 0 && finalScores[key] >= 20) return prev;
      if (nextVal === 0) delete milestone[key];
      else milestone[key] = nextVal;
      return { ...prev, [levelKey]: milestone };
    });
  };

  // El dueño puede tirar PG aunque la ficha sea de solo lectura (el DM vía ?user= no está en readOnly).
  const canRollHp = !readOnly || saveMode === "self";

  const onRollHp = (lv: number, val: number) => {
    setHpRolls((prev) => {
      const next = { ...prev, [String(lv)]: val };
      if (targetUserId) {
        if (saveMode === "self") { if (characterId) saveCharacter(characterId, { hp_rolls: next }); }
        else fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: targetUserId, patch: { hp_rolls: next } }) });
      } else {
        try { const s = JSON.parse(localStorage.getItem(SHEET_KEY) ?? "{}"); localStorage.setItem(SHEET_KEY, JSON.stringify({ ...s, hp_rolls: next })); } catch {}
      }
      return next;
    });
  };

  // Gastar/devolver un uso de un pozo de clase: refleja el cambio al instante
  // (estado local) y lo persiste en paralelo, sin esperar la respuesta — mismo
  // patrón que onRollHp.
  const onPlayStateChange = (next: PlayState) => {
    setPlayState(next);
    if (targetUserId) {
      if (saveMode === "self") { if (characterId) void saveCharacter(characterId, { play_state: next }); }
      else void fetch("/api/dm/character", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: targetUserId, patch: { play_state: next } }) });
    } else {
      try { const s = JSON.parse(localStorage.getItem(SHEET_KEY) ?? "{}"); localStorage.setItem(SHEET_KEY, JSON.stringify({ ...s, play_state: next })); } catch {}
    }
  };

  /* --- oro --- */
  const setGoldClamped = (n: number) => setGold(Math.max(0, Math.floor(n) || 0));

  /* --- inventario --- */
  const addItem = (name: string) => {
    const n = name.trim();
    if (!n || full) return;
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.name === n);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id: crypto.randomUUID(), name: n, qty: 1 }];
    });
  };
  const changeQty = (id: string, delta: number) => {
    if (delta > 0 && full) return;
    setItems((prev) => prev.flatMap((i) => {
      if (i.id !== id) return [i];
      const q = i.qty + delta;
      return q <= 0 ? [] : [{ ...i, qty: q }];
    }));
  };
  const setNotes = (id: string, notes: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notes } : i)));

  /* --- equipar / retirar --- */
  const onSlotClick = (slotId: string) => {
    if (readOnly) return;
    const equipped = equipment[slotId];
    if (equipped) {
      // retirar → vuelve al inventario
      setItems((prev) => addBack(prev, equipped));
      setEquipment((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
      if (pickingSlot === slotId) setPickingSlot(null);
    } else {
      setPickingSlot((p) => (p === slotId ? null : slotId));
    }
  };

  const equipInto = (slotId: string, item: Item) => {
    const prevEquipped = equipment[slotId];
    setItems((prev) => {
      let next = removeOne(prev, item.id);
      if (prevEquipped) next = addBack(next, prevEquipped);
      return next;
    });
    setEquipment((prev) => ({ ...prev, [slotId]: { id: item.id, name: item.name, qty: 1, notes: item.notes } }));
    setPickingSlot(null);
  };

  const onItemClick = (item: Item) => {
    if (pickingSlot) equipInto(pickingSlot, item);
  };

  /* --- RETIRAR PERSONAJE / LISTA DE RETIRADOS ---
     Acción del dueño sobre su cuenta, no una edición de la ficha: va bajo
     saveMode==="self" (incluye al jugador aunque su ficha sea readOnly) y no
     bajo !readOnly (eso la escondería de todos los jugadores: la ficha propia
     de un jugador ES readOnly).

     Se define ANTES del early-return del estado vacío y se pinta en los dos
     returns: tras archivar te quedas sin activo, que es justo cuando la lista
     de retirados y el contador hacen falta. El botón de retirar se esconde
     solo en el estado vacío porque allí no hay characterId que retirar. */
  const personajesPanel = saveMode === "self" && targetUserId && (
    <div className="panel p-6 mt-5 text-left">
      <p className="eyebrow mb-2">Personajes</p>
      <p className="font-ui text-[13px] mb-4" style={{ color: "var(--color-muted)" }}>
        Tienes {slots.length} de {MAX_CHARACTERS}. Solo puedes jugar uno a la vez.
      </p>

      {archivedOf(slots).length > 0 && (
        <div className="mb-4">
          <p className="eyebrow mb-2">Retirados</p>
          {archivedOf(slots).map((c) => (
            <div key={c.id} className="pick-row" style={{ opacity: 0.5, cursor: "default" }}>
              <span className="pick-row-name">{c.name || "Sin nombre"}</span>
              <span className="pick-row-sub">Retirado. Solo el DM puede devolverlo a juego.</span>
            </div>
          ))}
        </div>
      )}

      {characterId && (
        <button
          className="btn-ghost"
          onClick={async () => {
            if (!confirm("¿Retirar a este personaje del juego? Dejarás de verlo y solo el DM podrá devolverlo.")) return;
            const err = await archiveCharacter(characterId);
            if (err) { setArchiveError(err); return; }
            // A /crear: sin activo, es donde se hace el siguiente.
            window.location.href = "/crear";
          }}
        >
          <i className="fas fa-box-archive mr-2" />Retirar personaje
        </button>
      )}
      {archiveError && (
        <p className="font-ui text-[12px] font-bold mt-3" style={{ color: "var(--color-ember)" }}>
          <i className="fas fa-circle-exclamation mr-1.5" />{archiveError}
        </p>
      )}
    </div>
  );

  /* --- estado vacío ---
     Ojo con el caso raro pero real: `createCharacter` inserta la fila VACÍA y
     solo después se guarda el borrador. Si ese guardado falló, queda una ficha
     a medio crear — el hueco gastado y la hoja sin nada. Antes se decía "aún no
     hay personaje", que es mentira y además dejaba al jugador sin salida
     (el botón de retirar no se pinta aquí porque no siempre hay characterId).
     Ahora se distingue el caso y se ofrece terminarla. */
  if (loaded && !build.species && !build.cls) {
    const aMedias = saveMode === "self" && !!characterId;
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <i className={`fas ${aMedias ? "fa-triangle-exclamation" : "fa-hat-wizard"} text-4xl mb-4`} style={{ color: aMedias ? "var(--color-ember)" : "var(--color-dim)" }} />
        <h1 className="font-display text-2xl font-bold mb-3" style={{ color: "var(--color-parch)" }}>
          {aMedias ? "Tienes una ficha a medio crear" : "Aún no hay personaje"}
        </h1>
        <p className="prose-lore !text-[15px] mb-6" style={{ color: "var(--color-muted)" }}>
          {aMedias
            ? "Se reservó el hueco pero los datos no llegaron a guardarse. Termina de crearla y se rellenará esta misma ficha, sin gastar otro hueco."
            : "Crea un personaje para abrir su hoja interactiva: nivel, aptitudes, oro, inventario y equipo."}
        </p>
        <Link href="/crear" className="btn-gold">
          <i className="fas fa-hat-wizard mr-2" />{aMedias ? "Terminar de crearla" : "Crear personaje"}
        </Link>
        {personajesPanel}
      </main>
    );
  }

  return (
    <>
      {/* HEADER / IDENTIDAD */}
      <header className="panel p-5 mb-6 flex items-center gap-4 flex-wrap">
        <PortraitFrame src={species ? `/species/${species.slug}.jpg` : undefined} alt={build.name || "Personaje"} size="md" icon="fa-user" />
        <div className="min-w-0">
          <p className="eyebrow mb-1">Hoja del héroe · Nivel {level}</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold gold-text">{build.name || "Personaje sin nombre"}</h1>
          <p className="font-ui text-[13px] font-semibold mt-2" style={{ color: "var(--color-muted)" }}>
            {[species?.name, build.lineage, cls?.name, build.subclass, bg?.name].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </header>

      {/* INICIATIVA EN VIVO: compacta, solo visible mientras hay ronda en
          curso y solo en la ficha PROPIA — el tracker tira con la identidad
          de la sesión, y aquí el mod de DES es el del personaje mostrado:
          mezclarlos (DM viendo ?user=) publicaría tiradas incoherentes. El
          DM tiene el tracker completo en su pestaña «Dados». */}
      {isOwner && (
        <div className="mb-6">
          <InitiativeTracker mod={d.abilities.des.mod} hideEmpty />
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-6">
          {/* NIVEL + ASI */}
          <LevelPanel level={level} onLevel={onLevel} clsSlug={build.cls} hitDie={hitDie} preAsi={preAsi} asi={asi} onAsi={onAsi} hpRolls={hpRolls} onRollHp={canRollHp ? onRollHp : () => {}} readOnly={readOnly} canRollHp={canRollHp} xp={xp} />

          {/* APTITUDES */}
          <section className="panel p-5">
            <p className="eyebrow mb-3">Aptitudes</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ABILITIES.map((a) => (
                <div key={a.key} className="panel-raised py-3 text-center">
                  <p className="eyebrow mb-1">{a.abbr}</p>
                  <p className="font-display text-2xl font-extrabold" style={{ color: "var(--color-arcane-bright)" }}>{finalScores[a.key]}</p>
                  <p className="font-ui text-[11px] font-bold" style={{ color: "var(--color-muted)" }}>{fmtMod(mods[a.key])}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DERIVADOS */}
          <section className="panel p-5">
            <p className="eyebrow mb-3">Estadísticas derivadas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Derived icon="fa-heart" label="PG máx" value={d.maxHp} color="var(--color-ember)" />
              <Derived icon="fa-shield-halved" label="Competencia" value={fmtMod(d.prof)} color="var(--color-bronze)" />
              <Derived icon="fa-shoe-prints" label="Velocidad" value={species ? `${species.speed} m` : "—"} color="var(--color-primitivo)" />
            </div>
          </section>

          {/* COMBATE */}
          <section className="panel p-5">
            <p className="eyebrow mb-3"><i className="fas fa-shield-halved mr-1.5" style={{ color: "var(--color-bronze)" }} />Combate</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="panel-raised py-3 px-2 text-center flex flex-col items-center">
                <i className="fas fa-shield text-lg mb-1" style={{ color: "var(--color-arcane-bright)" }} />
                <p className="eyebrow !text-[9px] mb-1">CA</p>
                {readOnly ? (
                  <p className="font-display text-2xl font-extrabold" style={{ color: "var(--color-parch)" }}>{acValue}</p>
                ) : (
                  <input
                    type="number"
                    value={acValue}
                    onChange={(e) => setAc(e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value)) || 0))}
                    className="w-16 text-center bg-[var(--color-night)] rounded-lg px-2 py-1 font-display text-2xl font-extrabold outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]"
                    style={{ color: "var(--color-parch)" }}
                  />
                )}
                <p className="text-[10px] mt-1 italic" style={{ color: "var(--color-dim)" }}>{d.acSource}</p>
              </div>
              <Derived icon="fa-bolt" label="Iniciativa" value={fmtMod(d.initiative)} color="var(--color-arcane)" />
              <Derived icon="fa-eye" label="Percepción pasiva" value={d.passivePerception} color="var(--color-primitivo)" />
              {typeof d.spellDc === "number" && (
                <>
                  <Derived icon="fa-wand-sparkles" label="CD de conjuros" value={d.spellDc} color="var(--color-violet)" />
                  <Derived icon="fa-hat-wizard" label="Ataque de conjuro" value={fmtMod(d.spellAttack ?? 0)} color="var(--color-violet)" />
                </>
              )}
            </div>
            <p className="text-[11px] mt-2 italic" style={{ color: "var(--color-dim)" }}>CA editable para reflejar bonificadores temporales (p. ej. conjuros); no se guarda entre sesiones. El cálculo base se indica bajo el número.</p>
          </section>

          {/* ESTADO DE COMBATE (PG, muerte, condiciones, agotamiento) */}
          <section className="panel p-5">
            <p className="eyebrow mb-3"><i className="fas fa-heart-pulse mr-1.5" style={{ color: "var(--color-ember)" }} />Estado de combate</p>
            <EstadoVivo
              play={playState}
              maxHp={d.maxHp}
              onChange={onPlayStateChange}
              readOnly={readOnly && saveMode !== "self"}
            />
          </section>

          {/* SALVACIONES */}
          <section className="panel p-5">
            <p className="eyebrow mb-3">Salvaciones</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ABILITIES.map((a) => {
                const sv = d.saves[a.key];
                return (
                  <div key={a.key} className="panel-raised py-3 text-center relative">
                    {sv.proficient && (
                      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-arcane-bright)" }} title="Competente" />
                    )}
                    {isOwner && (
                      <button
                        className="absolute top-1.5 left-1.5 w-5 h-5 flex items-center justify-center rounded-md transition-colors"
                        style={{ color: "var(--color-bronze)" }}
                        title={`Tirar salvación de ${a.name}`}
                        onClick={async () => {
                          const { error } = await publishRoll(session!.id, "save", `Salvación de ${a.name}`, "1d20", { mod: sv.mod, adv: ventajaDe(playState, "salvez") ?? undefined });
                          setRollErr(error);
                        }}
                      >
                        <i className="fas fa-dice-d20 text-[11px]" />
                      </button>
                    )}
                    <p className="eyebrow mb-1">{a.abbr}</p>
                    <p className="font-display text-xl font-extrabold" style={{ color: sv.proficient ? "var(--color-arcane-bright)" : "var(--color-warm)" }}>
                      {fmtMod(sv.mod)}
                    </p>
                  </div>
                );
              })}
            </div>
            {rollErr && <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>{rollErr}</p>}
          </section>

          {/* PERICIAS */}
          <section className="panel p-5">
            <p className="eyebrow mb-3">Pericias</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {d.skills.map((s) => (
                <div key={s.name} className="panel-raised px-3 py-1.5 flex items-center justify-between gap-2">
                  <span className="font-ui text-[12px] font-semibold flex items-center gap-1.5" style={{ color: s.proficient ? "var(--color-bronze-bright)" : "var(--color-muted)" }}>
                    {s.proficient && <i className="fas fa-circle text-[5px]" style={{ color: "var(--color-bronze)" }} />}
                    {s.name}
                  </span>
                  <span className="flex items-center gap-2">
                    {isOwner && (
                      <button
                        className="w-5 h-5 flex items-center justify-center rounded-md transition-colors"
                        style={{ color: "var(--color-bronze)" }}
                        title={`Tirar ${s.name}`}
                        onClick={async () => {
                          const { error } = await publishRoll(session!.id, "skill", s.name, "1d20", { mod: s.mod, adv: ventajaDe(playState, "prueba") ?? undefined });
                          setRollErr(error);
                        }}
                      >
                        <i className="fas fa-dice-d20 text-[10px]" />
                      </button>
                    )}
                    <span className="font-ui text-[12px] font-bold" style={{ color: s.proficient ? "var(--color-bronze-bright)" : "var(--color-dim)" }}>
                      {fmtMod(s.mod)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            {rollErr && <p className="text-[12px] mt-2 italic" style={{ color: "var(--color-ember)" }}>{rollErr}</p>}
          </section>

          {/* RASGOS DE CLASE + RECURSOS */}
          <section className="panel p-5">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <p className="eyebrow">
                <i className="fas fa-scroll mr-1.5" style={{ color: cls ? `var(--color-${cls.group})` : "var(--color-bronze)" }} />
                Rasgos de clase
              </p>
              {featuresByLevel.length > 0 && (
                <button className="btn-ghost !py-1 !px-2.5 text-[11px]" onClick={() => setFeaturesOpen((o) => !o)}>
                  <i className={`fas fa-chevron-${featuresOpen ? "up" : "down"} mr-1.5`} />{featuresOpen ? "Ocultar" : "Mostrar"}
                </button>
              )}
            </div>

            {spellSlotChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {spellSlotChips.map((s) => (
                  <span key={s.lvl} className="chip" data-on>Espacios nv{s.lvl} ×{s.n}</span>
                ))}
              </div>
            )}

            {build.cls && (
              <PozosClase clsSlug={build.cls} level={level} play={playState} onChange={onPlayStateChange} readOnly={readOnly} />
            )}

            {!mechanics ? (
              <p className="font-ui text-[13px]" style={{ color: "var(--color-dim)" }}>Elige una clase para ver sus rasgos.</p>
            ) : featuresOpen ? (
              <div className="space-y-4">
                {featuresByLevel.map(({ level: lvl, feats }) => (
                  <div key={lvl}>
                    <p className="eyebrow !text-[10px] mb-1.5">Nivel {lvl}</p>
                    <div className="space-y-2">
                      {feats.map((f) => (
                        <div key={f.name} className="panel-raised p-3">
                          <p className="font-ui text-[13px] font-bold" style={{ color: "var(--color-parch)" }}>
                            {f.name}{f.subclass && build.subclass ? ` — ${build.subclass}` : ""}
                          </p>
                          <p className="font-ui text-[12px] mt-1" style={{ color: "var(--color-muted)" }}>{f.blurb}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {/* ORO */}
          <section className="panel p-5">
            <p className="eyebrow mb-3">Oro</p>
            <div className="flex items-center gap-3">
              {readOnly ? (
                <span className="font-display text-xl font-extrabold" style={{ color: "var(--color-bronze-bright)" }}>{gold}</span>
              ) : (
                <>
                  <button className="stat-btn" onClick={() => setGoldClamped(gold - 1)} disabled={gold <= 0}>−</button>
                  <input
                    type="number"
                    value={gold}
                    onChange={(e) => setGoldClamped(Number(e.target.value))}
                    className="w-28 text-center bg-[var(--color-night)] rounded-lg px-3 py-2 font-display text-xl font-extrabold outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)]"
                    style={{ color: "var(--color-bronze-bright)" }}
                  />
                  <button className="stat-btn" onClick={() => setGoldClamped(gold + 1)}>+</button>
                  <div className="flex gap-1.5 ml-2">
                    {[10, 50, 100].map((n) => (
                      <button key={n} className="btn-ghost !py-1.5 !px-2.5 text-[12px]" onClick={() => setGoldClamped(gold + n)}>+{n}</button>
                    ))}
                  </div>
                </>
              )}
              <span className="font-ui text-[13px] ml-1" style={{ color: "var(--color-muted)" }}>po</span>
            </div>
          </section>

          {/* INVENTARIO */}
          <section className="panel p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <p className="eyebrow">Inventario</p>
              <p className="font-ui text-[13px] font-semibold">
                <span style={{ color: full ? "var(--color-ember)" : "var(--color-arcane-bright)" }}>{used}</span>
                <span style={{ color: "var(--color-dim)" }}>/{cap} huecos</span>
              </p>
            </div>

            {pickingSlot && (
              <div className="panel-raised p-3 mb-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--color-bronze)" }}>
                <span className="font-ui text-[13px] font-semibold" style={{ color: "var(--color-bronze-bright)" }}>
                  <i className="fas fa-hand-pointer mr-2" />Elige un objeto para equipar en: <strong>{pickingSlot}</strong>
                </span>
                <button className="btn-ghost !py-1.5 !px-3 text-[12px]" onClick={() => setPickingSlot(null)}>Cancelar</button>
              </div>
            )}

            {/* añadir */}
            {!readOnly && (
              <>
                <div className="flex gap-2 mb-3">
                  <input value={custom} onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { addItem(custom); setCustom(""); } }}
                    placeholder="Objeto personalizado…"
                    className="flex-1 bg-[var(--color-night)] rounded-lg px-3 py-2 font-ui text-[13px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                    style={{ color: "var(--color-warm)" }} />
                  <button className="stat-btn !w-9 !h-9" onClick={() => { addItem(custom); setCustom(""); }} disabled={full || !custom.trim()}>+</button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(Object.keys(CATALOG) as ItemCat[]).map((c) => (
                    <button key={c} className="chip" data-on={cat === c} onClick={() => setCat(c)}>{c}</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {CATALOG[cat].map((it) => (
                    <button key={it} onClick={() => addItem(it)} disabled={full}
                      className="chip disabled:opacity-40" title="Añadir">
                      {it} <i className="fas fa-plus text-[9px] ml-0.5" style={{ color: "var(--color-bronze)" }} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {full && <p className="text-[12px] mb-3 text-center italic" style={{ color: "var(--color-ember)" }}>Inventario lleno. Aumenta tu Fuerza para más huecos.</p>}
            {!pickingSlot && items.length > 0 && (
              <p className="text-[11px] mb-3 italic" style={{ color: "var(--color-dim)" }}>
                <i className="fas fa-circle-info mr-1" />Para equipar, pulsa un hueco del equipo (derecha) y luego el objeto.
              </p>
            )}

            {/* filas de objetos */}
            {items.length === 0 ? (
              <p className="font-ui text-[13px] text-center py-4" style={{ color: "var(--color-dim)" }}>Sin objetos todavía.</p>
            ) : (
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id}
                    className="panel-raised p-3"
                    data-pick={!!pickingSlot}
                    style={pickingSlot ? { borderColor: "var(--color-bronze)", cursor: "pointer" } : undefined}
                    onClick={pickingSlot ? () => onItemClick(it) : undefined}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-ui text-[14px] font-semibold flex-1 min-w-0" style={{ color: "var(--color-warm)" }}>
                        {it.doc && <i className="fas fa-scroll mr-1.5" style={{ color: "var(--color-arcane)" }} />}{it.name}
                      </span>
                      {it.doc && (
                        <button className="btn-ghost !py-1 !px-2.5 text-[12px]" style={{ color: "var(--color-arcane-bright)" }}
                          onClick={(e) => { e.stopPropagation(); openDocument(it); }}><i className="fas fa-book-open mr-1" />Leer</button>
                      )}
                      {!readOnly && (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button className="stat-btn !w-7 !h-7" onClick={() => changeQty(it.id, -1)}>−</button>
                          <span className="font-ui font-bold w-6 text-center" style={{ color: "var(--color-parch)" }}>{it.qty}</span>
                          <button className="stat-btn !w-7 !h-7" onClick={() => changeQty(it.id, +1)} disabled={full}>+</button>
                        </div>
                      )}
                      {readOnly && (
                        <span className="font-ui font-bold w-6 text-center" style={{ color: "var(--color-parch)" }}>×{it.qty}</span>
                      )}
                      {pickingSlot && (
                        <span className="font-ui text-[12px] font-bold" style={{ color: "var(--color-bronze-bright)" }}>
                          <i className="fas fa-hand-pointer mr-1" />Equipar aquí
                        </span>
                      )}
                    </div>
                    {readOnly ? (
                      it.notes ? <p className="w-full mt-2 font-ui text-[12px]" style={{ color: "var(--color-muted)" }}>{it.notes}</p> : null
                    ) : (
                      <input
                        value={it.notes ?? ""}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNotes(it.id, e.target.value)}
                        placeholder="Notas…"
                        className="w-full mt-2 bg-[var(--color-night)] rounded-lg px-3 py-1.5 font-ui text-[12px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
                        style={{ color: "var(--color-muted)" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* PAPERDOLL */}
        <div className="lg:sticky lg:top-24">
          <Paperdoll
            equipment={equipment}
            mods={mods}
            portrait={species ? `/species/${species.slug}.jpg` : undefined}
            portraitAlt={build.name || "Personaje"}
            onSlotClick={onSlotClick}
          />
        </div>
      </div>

      {personajesPanel}

      {openDoc?.doc && <DocViewer item={openDoc} note={loreMsg} onClose={() => { setOpenDoc(null); setLoreMsg(null); }} />}
    </>
  );
}

// Visor de documento in-game: pergamino a pantalla completa (carta, contrato…).
function DocViewer({ item, note, onClose }: { item: Item; note?: string | null; onClose: () => void }) {
  const doc = item.doc!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-xl p-6 sm:p-8"
        style={{ background: "var(--color-parch)", color: "#2a2018", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", border: "1px solid var(--color-bronze)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="font-display text-2xl font-extrabold" style={{ color: "#3a2a15" }}>{doc.titulo || item.name}</h3>
          <button onClick={onClose} className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#2a201810", color: "#3a2a15" }} aria-label="Cerrar"><i className="fas fa-xmark" /></button>
        </div>
        {doc.imagen && <img src={doc.imagen} alt="" className="w-full rounded-lg mb-4 border" style={{ borderColor: "#3a2a1533" }} />}
        <p className="font-body text-[16px] leading-relaxed whitespace-pre-wrap" style={{ color: "#2a2018" }}>{doc.texto}</p>
        {note && (
          <p className="font-ui text-[13px] mt-5 pt-4 flex items-start gap-2" style={{ color: "#5a3a15", borderTop: "1px solid #3a2a1533" }}>
            <i className="fas fa-book-open mt-0.5" />{note}
          </p>
        )}
      </div>
    </div>
  );
}

function Derived({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="panel-raised py-3 px-2 text-center flex flex-col items-center">
      <i className={`fas ${icon} text-lg mb-1`} style={{ color }} />
      <p className="eyebrow !text-[9px] mb-1">{label}</p>
      <p className="font-display text-xl font-extrabold" style={{ color: "var(--color-parch)" }}>{value}</p>
    </div>
  );
}
