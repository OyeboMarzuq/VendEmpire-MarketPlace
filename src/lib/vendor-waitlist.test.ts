import { describe, expect, it } from "vitest";
import { vendorSchema } from "./waitlist";
import { buildVipPassSvg } from "./vip-pass";

const base = { business_name: "Grace Mart", full_name: "Grace Obi", email: "g@x.com", country: "Ghana", persona: "shop", interests: ["groceries"] };

describe("vendor waitlist", () => {
  it("requires a business name", () => {
    expect(vendorSchema.safeParse({ ...base, business_name: "" }).success).toBe(false);
  });
  it("rejects shopper types", () => {
    expect(vendorSchema.safeParse({ ...base, persona: "student" }).success).toBe(false);
  });
  it("accepts a valid vendor", () => {
    expect(vendorSchema.safeParse(base).success).toBe(true);
  });
  it("vendor pass uses the VV prefix and vendor title", () => {
    const svg = buildVipPassSvg({ name: "Grace Mart", rank: 7, interests: [], joinedAt: "2026-01-01", kind: "vendor" }, {});
    expect(svg).toContain("VV-00007");
    expect(svg).toContain("FOUNDING VENDOR PASS");
  });
});
