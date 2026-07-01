"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import Emblem from "@/components/Emblem";

// Dominio sintético: el login es por nombre de usuario, no por email.
const DOMAIN = "@taldorei.local";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseConfigured) {
      setError("Supabase no está configurado todavía. Añade las credenciales en .env.local.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    // Si escriben un email completo se usa tal cual; si no, se mapea a u@taldorei.local.
    const id = username.trim().toLowerCase();
    const email = id.includes("@") ? id : `${id}${DOMAIN}`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-md p-9">
        <div className="flex justify-center mb-3"><Emblem size={64} /></div>
        <p className="eyebrow text-center mb-2">Compañero de campaña</p>
        <h1 className="font-display text-3xl font-extrabold text-center gold-text mb-1">Tal'Dorei</h1>
        <p className="text-center text-sm italic mb-7" style={{ color: "var(--color-muted)" }}>
          Identifícate para cruzar al continente.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="eyebrow block mb-1.5">Usuario o email</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              placeholder="usuario o tu@email.com"
              className="w-full bg-[var(--color-night)] rounded-lg px-4 py-2.5 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
          </div>
          <div>
            <label className="eyebrow block mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full bg-[var(--color-night)] rounded-lg px-4 py-2.5 font-body text-[15px] outline-none border border-[var(--color-line)] focus:border-[var(--color-bronze)] transition-colors"
              style={{ color: "var(--color-warm)" }}
            />
          </div>

          {error && (
            <p className="text-center text-[13px] italic" style={{ color: "var(--color-ember)" }}>{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-gold w-full !py-3 mt-2">
            {loading ? "Entrando…" : "Entrar al continente"}
          </button>
        </form>

        <p className="text-center text-[12px] mt-6" style={{ color: "var(--color-dim)" }}>
          Las cuentas las crea el Director de Juego.
        </p>
      </div>
    </main>
  );
}
