import { useMemo } from "react";

const PAIRS = 11;

export default function DnaHelix() {
  const rungs = useMemo(() => {
    const lines = [];
    for (let i = 0; i < PAIRS; i++) {
      const t = i / (PAIRS - 1);
      const y = 24 + t * 312;
      const x1 = 55 + Math.sin(t * Math.PI * 5) * 45;
      const x2 = 145 - Math.sin(t * Math.PI * 5) * 45;
      lines.push(
        <line
          key={i}
          className="dna__rung"
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke="rgba(232, 238, 245, 0.35)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ animationDelay: `${i * 0.25}s` }}
        />
      );
    }
    return lines;
  }, []);

  return (
    <div className="dna-wrap">
      <svg
        className="dna"
        viewBox="0 0 200 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="strand-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-a)" />
            <stop offset="100%" stopColor="var(--accent-b)" />
          </linearGradient>
          <linearGradient id="strand-b" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-c)" />
            <stop offset="100%" stopColor="var(--accent-a)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="dna__strand dna__strand--back"
          d="M55 20 C115 60 115 100 55 140 C-5 180 -5 220 55 260 C115 300 115 340 55 380"
          fill="none"
          stroke="url(#strand-b)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          className="dna__strand dna__strand--front"
          d="M145 20 C85 60 85 100 145 140 C205 180 205 220 145 260 C85 300 85 340 145 380"
          fill="none"
          stroke="url(#strand-a)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        <g>{rungs}</g>
      </svg>
    </div>
  );
}
