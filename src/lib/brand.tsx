// Inner SVG of the Kaff brand mark — just the 4 fingers + ك. Uses currentColor
// so the surrounding tile (color/background) drives it. Pair with any tile wrapper.

export function KaffGlyph({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-label="Kaff">
      <g fill="currentColor">
        <rect x="30" y="10" width="7" height="20" rx="3.5" />
        <rect x="44" y="6"  width="7" height="24" rx="3.5" />
        <rect x="58" y="6"  width="7" height="24" rx="3.5" />
        <rect x="72" y="10" width="7" height="20" rx="3.5" />
      </g>
      <text x="55" y="108" textAnchor="middle"
            fontFamily="'IBM Plex Sans Arabic', 'Cairo', 'Sarabun', sans-serif"
            fontSize="92" fontWeight="500" fill="currentColor">ك</text>
    </svg>
  );
}
