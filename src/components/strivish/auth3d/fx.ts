// Shared mutable state between the HTML form and the 3D scene (no React re-renders).
export const authFx = { mouseX: 0, mouseY: 0, focus: 0, mode: "in" as "in" | "up", burst: 0 };
export function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
export function isLowPower() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
}
