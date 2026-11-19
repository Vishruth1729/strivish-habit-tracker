import { describe, it, expect } from "vitest";
import { canEditHabitDay } from "@/lib/store";
const now = new Date(2026, 10, 19, 12);
describe("habit day lock", () => {
  it("allows today", () => expect(canEditHabitDay("2026-11-19", now)).toBe(true));
  it("blocks yesterday", () => expect(canEditHabitDay("2026-11-18", now)).toBe(false));
  it("blocks tomorrow", () => expect(canEditHabitDay("2026-11-20", now)).toBe(false));
});
