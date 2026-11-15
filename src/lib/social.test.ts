import { describe, expect, it } from "vitest";
import { SOCIAL_LINKS } from "./social";

const byId = (id: string) => SOCIAL_LINKS.find((s) => s.id === id);

describe("SOCIAL_LINKS", () => {
  it("lists the five pages in the order shown on the home page", () => {
    expect(SOCIAL_LINKS.map((s) => s.id)).toEqual([
      "whatsapp",
      "whatsapp_channel",
      "instagram",
      "tiktok",
      "facebook",
    ]);
  });
  it("points every ready page at the link the owner supplied", () => {
    expect(byId("whatsapp")?.href).toBe("https://chat.whatsapp.com/Kbqb8S7316W8BXkCpqtJEl?s=cl&p=a&iam=2");
    expect(byId("whatsapp_channel")?.href).toBe("https://whatsapp.com/channel/0029Vb9PtFYGOj9isRsXYt0v");
    expect(byId("instagram")?.href).toBe("https://www.instagram.com/vendempire.ng?dlrf=bno5OWE1Mmthb21p");
    expect(byId("tiktok")?.href).toBe("https://www.tiktok.com/@vendempire?_r=1&_t=ZS-9BPbRKenD0e");
  });
  it("keeps Facebook unlinked until its link is ready", () => {
    expect(byId("facebook")?.href).toBeNull();
  });
});
