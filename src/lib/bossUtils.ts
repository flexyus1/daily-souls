import type { Boss, Bosses } from "../types/types";
import { statusIconMap } from "./statusIconMap";

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

const textures = [
  "/images/background2.png",
  "/images/background3.png",
  "/images/background4.png",
  "/images/background5.png",
];

export function pickIndex(key: string, modulo = textures.length): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % modulo;
}

export function bgVarFor(key: string) {
  const idx = pickIndex(key);
  const url = textures[idx];
  // style com CSS var usada no seu CSS
  return { ["--bg-images" as any]: `url("${url}")` };
}

export function getDailyBoss(bosses: Bosses, date = new Date()): Boss {
  const today = date.getUTCDate();
  return bosses[today % bosses.length];
}

export function fieldComparison(attemptCategory: string[], answerCategory: string[]) {
  const a = [...attemptCategory].sort();
  const b = [...answerCategory].sort();
  if (a.join(",") === b.join(",")) return "green";
  for (let i = 0; i < attemptCategory.length; i++) {
    if (answerCategory.includes(attemptCategory[i])) return "yellow";
  }
  return "red";
}

// Exporte se precisar em outros lugares
export { statusIconMap };
