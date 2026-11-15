import { createServerFn } from "@tanstack/react-start";

async function matches(input: string, expected: string) {
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(input)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i]! ^ y[i]!;
  return diff === 0;
}

export const getAdminData = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string }) => {
    if (typeof input?.password !== "string" || input.password.length > 200) throw new Error("Invalid");
    return input;
  })
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    if (!expected) throw new Error("Admin password is not configured");
    if (!(await matches(data.password, expected))) return { ok: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows: Array<{
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      city: string | null;
      country: string;
      persona: string;
      interests: string[];
      note: string | null;
      created_at: string;
    }> = [];
    const page = 1000;
    for (let from = 0; from < 50000; from += page) {
      const { data: chunk, error } = await supabaseAdmin
        .from("customer_waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + page - 1);
      if (error) throw new Error(error.message);
      rows.push(...(chunk ?? []));
      if (!chunk || chunk.length < page) break;
    }
    const vendors: Array<(typeof rows)[number] & { business_name: string }> = [];
    for (let from = 0; from < 50000; from += page) {
      const { data: chunk, error } = await supabaseAdmin
        .from("vendor_waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + page - 1);
      if (error) throw new Error(error.message);
      vendors.push(...(chunk ?? []));
      if (!chunk || chunk.length < page) break;
    }
    return { ok: true as const, rows, vendors };
  });
