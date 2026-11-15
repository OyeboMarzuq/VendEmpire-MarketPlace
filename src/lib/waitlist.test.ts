import { describe, expect, it } from "vitest";
import { waitlistSchema } from "./waitlist";

const base = { full_name: "Amina Bello", email: "AMINA@x.com", country: "Nigeria", persona: "homemaker", interests: ["foodstuffs"] };

describe("waitlistSchema", () => {
  it("accepts a valid customer and lowercases email", () => {
    const r = waitlistSchema.parse(base);
    expect(r.email).toBe("amina@x.com");
  });
  it("requires at least one thing to buy", () => {
    expect(waitlistSchema.safeParse({ ...base, interests: [] }).success).toBe(false);
  });
  it("rejects unknown shopper types", () => {
    expect(waitlistSchema.safeParse({ ...base, persona: "vendor" }).success).toBe(false);
  });
});
