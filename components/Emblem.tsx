// Sigilo arcano de Tal'Dorei: rombo con compás y orbe central.
export default function Emblem({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden>
      <defs>
        <radialGradient id="emOrb" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#c4fff9" />
          <stop offset="45%" stopColor="#45c7bd" />
          <stop offset="100%" stopColor="#1f6f69" />
        </radialGradient>
      </defs>
      <path d="M30 3 L57 30 L30 57 L3 30 Z" fill="none" stroke="var(--color-bronze)" strokeWidth="1.4" />
      <path d="M30 11 L49 30 L30 49 L11 30 Z" fill="none" stroke="var(--color-bronze-deep)" strokeWidth="1" />
      <path d="M30 6 L33 27 L54 30 L33 33 L30 54 L27 33 L6 30 L27 27 Z" fill="url(#emOrb)" opacity="0.9" />
      <circle cx="30" cy="30" r="4.2" fill="#0d121a" stroke="var(--color-bronze-bright)" strokeWidth="1" />
      <circle cx="30" cy="30" r="1.8" fill="var(--color-arcane-bright)" />
    </svg>
  );
}
