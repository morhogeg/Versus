// Territory colors for the "Two Territories, One Seam" system (§3.2).
// Default A = Plasma (cyan), B = Pyre (magenta); a character's accentHint may
// override its territory hue. Gold is the judgment color (belongs to neither).

export const PLASMA = "#00E5FF";
export const PYRE = "#FF2D6F";
export const GOLD = "#FFE600";
export const INK = "#0B0A1A";
export const BONE = "#F2F0FF";
export const ASH = "#6B6488";

export type Side = "a" | "b";

export function territoryColor(side: Side, accentHint?: string): string {
  if (accentHint) return accentHint;
  return side === "a" ? PLASMA : PYRE;
}

/** A translucent version of a hex color, for fills/glows. */
export function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
