import { describe, expect, it } from "vitest";
import { babyAge } from "./baby";
import { PLANS } from "./plans";

describe("babyAge", () => {
  it("counts days and months from birth date", () => {
    const a = babyAge("2026-01-15", new Date("2026-04-14T12:00:00"));
    expect(a.months).toBe(2);
    expect(a.days).toBe(89);
  });
});

describe("plans", () => {
  it("uses the agreed prices in MT", () => {
    expect(PLANS.map((p) => [p.id, p.price])).toEqual([["monthly", 147], ["quarterly", 276], ["yearly", 512]]);
  });
});
