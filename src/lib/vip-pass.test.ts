import { describe, expect, it } from "vitest";
import { buildVipPassSvg } from "./vip-pass";

describe("buildVipPassSvg", () => {
  it("creates a personalized branded pass and escapes customer-provided text", () => {
    const svg = buildVipPassSvg(
      { name: "Amina & Sons", rank: 7, interests: ["Foodstuffs"], joinedAt: "2026-11-07T00:00:00.000Z" },
      {},
    );

    expect(svg).toContain("VENDEMPIREMARKETPLACE");
    expect(svg).toContain("Amina &amp; Sons");
    expect(svg).toContain("VE-00007");
    expect(svg).toContain("Foodstuffs");
  });
});