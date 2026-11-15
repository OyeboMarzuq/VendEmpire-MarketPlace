import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Eye, Loader2, Lock, LogOut, RefreshCw, Search, Users, TrendingUp, CalendarDays, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { VipPassCard } from "@/components/vip-pass-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAdminData } from "@/lib/admin.functions";
import { INTERESTS, PERSONAS, VENDOR_TYPES, labelFor } from "@/lib/waitlist";
import { downloadVipPass, type VipPassDetails } from "@/lib/vip-pass";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin · VendEmpire Marketplace" },
      { name: "description", content: "Customer and vendor waitlist dashboard for VendEmpire Marketplace." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin · VendEmpire Marketplace" },
      { property: "og:description", content: "Customer and vendor waitlist dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type Row = Awaited<ReturnType<typeof getAdminData>> extends infer R ? (R extends { rows: infer X } ? X extends Array<infer Y> ? Y : never : never) : never;

type Kind = "customers" | "vendors";
const KEY = "ve-mkt-admin";
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Admin() {
  const fetchData = useServerFn(getAdminData);
  const [pw, setPw] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [vendors, setVendors] = useState<Row[]>([]);
  const [kind, setKind] = useState<Kind>("customers");
  const [loading, setLoading] = useState(false);

  async function load(password: string, silent = false) {
    setLoading(true);
    try {
      const res = await fetchData({ data: { password } });
      if (!res.ok) {
        sessionStorage.removeItem(KEY);
        setPw(null);
        if (!silent) toast.error("Wrong password");
        return;
      }
      sessionStorage.setItem(KEY, password);
      setPw(password);
      setRows(res.rows);
      setVendors(
        res.vendors.map((v) => ({
          ...v,
          full_name: v.business_name,
          note: `Owner: ${v.full_name}${v.note ? ` · ${v.note}` : ""}`,
        })),
      );
    } catch {
      toast.error("Couldn't load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved) load(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pw || !rows) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(String(new FormData(e.currentTarget).get("password") ?? ""));
          }}
          className="glass animate-rise w-full max-w-sm rounded-3xl p-8 shadow-glow"
        >
          <div className="mb-4 flex justify-end">
            <ThemeToggle />
          </div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[image:var(--gradient-hero)] text-primary-foreground">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-extrabold">Marketplace Admin</h1>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Admin password"
            className="mt-6 w-full rounded-xl border border-input bg-background/60 px-4 py-3 outline-none focus:border-primary"
          />
          <button
            disabled={loading}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-[image:var(--gradient-hero)] py-3 font-bold text-primary-foreground"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enter dashboard"}
          </button>
          <Link to="/" className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground">
            ← Back to site
          </Link>
        </form>
      </main>
    );
  }

  return (
    <Dashboard
      key={kind}
      kind={kind}
      onKind={setKind}
      rows={kind === "vendors" ? vendors : rows}
      loading={loading}
      onRefresh={() => load(pw)}
      onLogout={() => {
        sessionStorage.removeItem(KEY);
        setPw(null);
        setRows(null);
      }}
    />
  );
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function Dashboard({ kind, onKind, rows, loading, onRefresh, onLogout }: { kind: Kind; onKind: (k: Kind) => void; rows: Row[]; loading: boolean; onRefresh: () => void; onLogout: () => void }) {
  const isVendor = kind === "vendors";
  const TYPES: ReadonlyArray<{ id: string; label: string }> = isVendor ? VENDOR_TYPES : PERSONAS;
  const noun = isVendor ? "vendors" : "customers";
  const [range, setRange] = useState(30);
  const [q, setQ] = useState("");
  const [persona, setPersona] = useState("all");
  const [interest, setInterest] = useState("all");
  const [selectedPass, setSelectedPass] = useState<VipPassDetails | null>(null);
  const [customerPage, setCustomerPage] = useState(0);
  const pageSize = 100;

  const stats = useMemo(() => {
    const today = dayKey(new Date());
    const days: { day: string; label: string; signups: number; total: number }[] = [];
    const byDay = new Map<string, number>();
    for (const r of rows) byDay.set(dayKey(new Date(r.created_at)), (byDay.get(dayKey(new Date(r.created_at))) ?? 0) + 1);
    const startTs = Date.now() - (range - 1) * 86400000;
    let running = rows.filter((r) => new Date(r.created_at).getTime() < new Date(dayKey(new Date(startTs))).getTime()).length;
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const k = dayKey(d);
      const n = byDay.get(k) ?? 0;
      running += n;
      days.push({ day: k, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), signups: n, total: running });
    }
    const week = rows.filter((r) => Date.now() - new Date(r.created_at).getTime() < 7 * 86400000).length;
    const countries = new Set(rows.map((r) => r.country)).size;
    const interestCounts = INTERESTS.map((i) => ({ name: i.label, emoji: i.emoji, value: rows.filter((r) => r.interests.includes(i.id)).length })).sort(
      (a, b) => b.value - a.value,
    );
    const personaCounts = TYPES.map((p) => ({ name: p.label, value: rows.filter((r) => r.persona === p.id).length })).filter((p) => p.value);
    return { days, today: byDay.get(today) ?? 0, week, countries, interestCounts, personaCounts };
  }, [rows, range, TYPES]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (persona === "all" || r.persona === persona) &&
        (interest === "all" || r.interests.includes(interest)) &&
        (!s || [r.full_name, r.email, r.city, r.country, r.phone].some((v) => v?.toLowerCase().includes(s))),
    );
  }, [rows, q, persona, interest]);

  useEffect(() => {
    setCustomerPage(0);
  }, [q, persona, interest]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(customerPage * pageSize, (customerPage + 1) * pageSize);

  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Name", "Email", "Phone", "City", "Country", "Persona", "Interests", "Note", "Joined"];
    const lines = filtered.map((r) =>
      [r.full_name, r.email, r.phone, r.city, r.country, labelFor(r.persona), r.interests.map(labelFor).join("; "), r.note, r.created_at].map(esc).join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vendempire-${noun}-${dayKey(new Date())}.csv`;
    a.click();
  }

  const select = "rounded-xl border border-input bg-background/60 px-3 py-2 text-sm outline-none";

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">
            {isVendor ? "Vendor" : "Customer"} <span className="text-gradient">Waitlist</span>
          </h1>
          <p className="text-sm text-muted-foreground">VendEmpire Marketplace · {isVendor ? "vendors" : "shoppers"} dashboard</p>
          <div className="mt-3 inline-flex gap-1 rounded-xl bg-muted p-1">
            {(["customers", "vendors"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onKind(k)}
                aria-pressed={kind === k}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${kind === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <ThemeToggle />
          <button onClick={onRefresh} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { I: Users, l: `Total ${noun}`, v: rows.length },
          { I: CalendarDays, l: "Joined today", v: stats.today },
          { I: TrendingUp, l: "Last 7 days", v: stats.week },
          { I: Globe2, l: "Countries", v: stats.countries },
        ].map(({ I, l, v }, i) => (
          <div key={l} className="glass animate-rise rounded-2xl p-5" style={{ animationDelay: `${i * 70}ms` }}>
            <I className="h-5 w-5 text-primary" />
            <div className="mt-3 font-display text-3xl font-extrabold">{v.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="glass mt-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">New {noun}, day by day</h2>
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`rounded-lg px-3 py-1 text-sm transition ${range === d ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.days}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} />
              <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} width={32} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "var(--foreground)" }} />
              <Area type="monotone" dataKey="signups" name={`New ${noun}`} stroke="var(--chart-1)" strokeWidth={3} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-lg font-bold">{isVendor ? "What vendors sell" : "What customers want to buy"}</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.interestCounts} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis type="category" dataKey="name" width={170} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "var(--foreground)" }} />
                <Bar dataKey="value" name={isVendor ? "Vendors" : "Customers"} radius={[0, 8, 8, 0]}>
                  {stats.interestCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg font-bold">Who's joining</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.personaCounts} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {stats.personaCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "var(--foreground)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1 text-sm">
            {stats.personaCounts.map((p, i) => (
              <li key={p.name} className="flex justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {p.name}
                </span>
                <b>{p.value}</b>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="glass mt-6 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mr-auto text-lg font-bold">Recent customers ({filtered.length})</h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={`${select} pl-9`} />
          </div>
          <select value={persona} onChange={(e) => setPersona(e.target.value)} className={select}>
            <option value="all">All shoppers</option>
            {TYPES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select value={interest} onChange={(e) => setInterest(e.target.value)} className={select}>
            <option value="all">All categories</option>
            {INTERESTS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-2 pr-3">Customer</th>
                <th className="pr-3">Contact</th>
                <th className="pr-3">Location</th>
                <th className="pr-3">Type</th>
                <th className="pr-3">{isVendor ? "Selling" : "Buying"}</th>
                <th>Joined</th>
                <th className="pl-3">Pass</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 align-top transition hover:bg-muted/40">
                  <td className="py-3 pr-3 font-medium">
                    {r.full_name}
                    {r.note && <div className="max-w-xs text-xs text-muted-foreground">"{r.note}"</div>}
                  </td>
                  <td className="pr-3">
                    <div>{r.email}</div>
                    <div className="text-xs text-muted-foreground">{r.phone}</div>
                  </td>
                  <td className="pr-3">{[r.city, r.country].filter(Boolean).join(", ")}</td>
                  <td className="pr-3">{labelFor(r.persona)}</td>
                  <td className="pr-3">
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {r.interests.map((i) => (
                        <span key={i} className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{labelFor(i)}</span>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="pl-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const index = rows.findIndex((row) => row.id === r.id);
                        setSelectedPass({
                          name: r.full_name,
                          rank: index < 0 ? rows.length : rows.length - index,
                          interests: r.interests.map(labelFor),
                          joinedAt: r.created_at,
                          kind: isVendor ? "vendor" : "shopper",
                        });
                      }}
                    >
                      <Eye aria-hidden="true" /> View pass
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">No {noun} yet.</td>
                </tr>
              )}
            </tbody>
          </table>
          {filtered.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Showing {customerPage * pageSize + 1}–{Math.min((customerPage + 1) * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={customerPage === 0} onClick={() => setCustomerPage((page) => page - 1)}>
                  Previous
                </Button>
                <span>Page {customerPage + 1} of {pageCount}</span>
                <Button type="button" variant="outline" size="sm" disabled={customerPage + 1 >= pageCount} onClick={() => setCustomerPage((page) => page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Dialog open={selectedPass !== null} onOpenChange={(open) => { if (!open) setSelectedPass(null); }}>
        {selectedPass && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{isVendor ? "Founding vendor pass" : "VIP shopper pass"}</DialogTitle>
              <DialogDescription>Pass for {selectedPass.name}.</DialogDescription>
            </DialogHeader>
            <VipPassCard details={selectedPass} />
            <div className="flex justify-end">
              <Button type="button" onClick={() => downloadVipPass(selectedPass)}>
                <Download aria-hidden="true" /> Download pass
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </main>
  );
}
