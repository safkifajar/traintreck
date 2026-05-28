import { describe, it, expect } from "vitest";
import { haversine, bearing, pointAlong } from "@/lib/geo";

describe("haversine", () => {
  it("zero for identical points", () => {
    expect(haversine([106.8, -6.2], [106.8, -6.2])).toBe(0);
  });

  it("approximates ~111km per degree latitude", () => {
    const d = haversine([106.8, -6.0], [106.8, -7.0]);
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });
});

describe("bearing", () => {
  it("due north ~0deg", () => {
    const b = bearing([106.8, -7.0], [106.8, -6.0]); // lat naik = ke utara
    expect(b).toBeCloseTo(0, 0);
  });

  it("due east ~90deg", () => {
    const b = bearing([106.0, -7.0], [107.0, -7.0]);
    expect(b).toBeGreaterThan(89);
    expect(b).toBeLessThan(91);
  });
});

describe("pointAlong", () => {
  const line: [number, number][] = [
    [106.0, -7.0],
    [108.0, -7.0],
  ];

  it("fraction 0 returns start", () => {
    const p = pointAlong(line, 0);
    expect(p.lng).toBeCloseTo(106.0, 5);
    expect(p.lat).toBeCloseTo(-7.0, 5);
  });

  it("fraction 1 returns end", () => {
    const p = pointAlong(line, 1);
    expect(p.lng).toBeCloseTo(108.0, 5);
  });

  it("fraction 0.5 returns midpoint", () => {
    const p = pointAlong(line, 0.5);
    expect(p.lng).toBeCloseTo(107.0, 1);
  });

  it("single point returns itself", () => {
    const p = pointAlong([[110.0, -7.5]], 0.5);
    expect(p.lng).toBe(110.0);
    expect(p.lat).toBe(-7.5);
    expect(p.bearing).toBe(0);
  });
});
