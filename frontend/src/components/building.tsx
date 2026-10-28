// Drawn for TTHome: a block of rented rooms. Lit windows are the vacant rooms, switching on one by one.
const COLS = 6;
const ROWS = 9;
const LIT = new Set([2, 7, 9, 14, 20, 23, 28, 31, 36, 41, 44, 49]);

export function Building() {
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => i);
  return (
    <svg viewBox="0 0 300 420" role="img" aria-label="Tòa nhà với những ô cửa sổ sáng đèn là các phòng đang trống" preserveAspectRatio="xMaxYMax slice" className="absolute inset-0 h-full w-full">
      <rect x="20" y="20" width="260" height="400" fill="#795114" />
      <rect x="10" y="404" width="280" height="16" fill="#1a1408" />
      {cells.map((i) => {
        const x = 40 + (i % COLS) * 37;
        const y = 40 + Math.floor(i / COLS) * 40;
        const lit = LIT.has(i);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="25"
            height="28"
            fill={lit ? "#fff4d0" : "#1a1408"}
            opacity={lit ? undefined : 0.35}
            className={lit ? "win-lit" : undefined}
            style={lit ? ({ "--d": `${(i % 13) * 260}` } as React.CSSProperties) : undefined}
          />
        );
      })}
    </svg>
  );
}

export function Wordmark({ light }: { light?: boolean }) {
  return (
    <span className={`text-xl font-extrabold tracking-tight ${light ? "text-ink" : "text-gold-bronze"}`}>
      TT HOME
    </span>
  );
}
