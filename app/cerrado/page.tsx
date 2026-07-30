import type { Metadata } from "next";
import Link from "next/link";
import Emblem from "@/components/Emblem";

export const metadata: Metadata = { title: "Aún no" };

const PUERTAS = [
  { href: "/personaje", icon: "fa-scroll", label: "Tu ficha" },
  { href: "/inventario", icon: "fa-sack-xmark", label: "Tu inventario" },
  { href: "/reino", icon: "fa-book-open", label: "El reino" },
];

export default function CerradoPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="flex justify-center mb-6 opacity-60"><Emblem size={72} /></div>
      <p className="eyebrow mb-4">Aún no</p>
      <h1 className="font-display text-4xl font-bold gold-text mb-5">
        Esto se abrirá más adelante
      </h1>
      <p className="prose-lore lead max-w-lg mx-auto !mb-10">
        Esta parte del compañero aún no está en vuestras manos. Se abrirá cuando
        la campaña llegue a ella.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {PUERTAS.map((p) => (
          <Link key={p.href} href={p.href} className="btn-ghost">
            <i className={`fas ${p.icon} mr-2`} />{p.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
