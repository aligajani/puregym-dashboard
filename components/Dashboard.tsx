"use client";

import { JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import type { PureGymData } from "@/lib/puregym";
import { PUREGYM_LOGO_URL } from "@/lib/puregym-logo";

/** Logged-in header title only — not used elsewhere */
const dashboardHeaderTitle = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

interface Props {
  email: string;
  pin: string;
  onClearCredentials: () => void;
  /** Stored credentials rejected by PureGym — return user to sign-in. */
  onInvalidCredentials: () => void;
}

/** Time only, 12-hour with AM/PM */
function fmtTimeAmPm(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Calendar date only (visit local time). */
function fmtDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** PureGym sometimes omits or zeroes live count; show a floor instead of 0 / blank. */
function formatPeopleInGymLive(n: number | null | undefined): string {
  if (n == null || n === 0) return "< 10";
  return String(n);
}

/** Milliseconds until the next clock-aligned 10-minute mark (…:00, …:10, …:20, …). */
function msUntilNextTenMinuteBoundary(now = new Date()): number {
  const next = new Date(now);
  next.setMilliseconds(0);
  next.setSeconds(0);
  const m = next.getMinutes();
  const r = m % 10;
  if (r === 0 && next.getTime() <= now.getTime()) {
    next.setMinutes(m + 10);
  } else {
    next.setMinutes(m + (10 - r));
  }
  return Math.max(0, next.getTime() - now.getTime());
}

type TimeOfDaySlot = "morning" | "afternoon" | "evening" | "night";

function getTimeOfDaySlot(iso: string): TimeOfDaySlot {
  const h = new Date(iso).getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

const TIME_OF_DAY_META: Record<
  TimeOfDaySlot,
  { label: string; className: string; Icon: ComponentType<{ className?: string }> }
> = {
  morning: {
    label: "Morning",
    className: "text-amber-700",
    Icon: IconSunrise,
  },
  afternoon: {
    label: "Afternoon",
    className: "text-sky-700",
    Icon: IconSun,
  },
  evening: {
    label: "Evening",
    className: "text-violet-700",
    Icon: IconSunset,
  },
  night: {
    label: "Night",
    className: "text-slate-600",
    Icon: IconMoon,
  },
};

function IconSunrise({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2v4" />
      <path d="m4.93 4.93 2.83 2.83" />
      <path d="M2 12h4" />
      <path d="m4.93 19.07 2.83-2.83" />
      <path d="M12 22v-4" />
      <path d="m19.07 19.07-2.83-2.83" />
      <path d="M22 12h-4" />
      <path d="m19.07 4.93-2.83 2.83" />
      <path d="M18 12a6 6 0 0 0-12 0" />
    </svg>
  );
}

function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function IconSunset({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 10V2" />
      <path d="m4.93 10.93 2.83 2.83" />
      <path d="M2 18h1.5" />
      <path d="M2 22h20" />
      <path d="m20.5 18 1.5 1.5" />
      <path d="m19.07 10.93-2.83 2.83" />
      <path d="M22 18h-1.5" />
      <path d="m16 6-1.5 1.5" />
      <path d="M9.5 18h5" />
      <path d="m8 6 1.5 1.5" />
      <path d="M18 12a6 6 0 0 0-12 0" />
    </svg>
  );
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
    </svg>
  );
}

/** Mobile-only right fade; hidden when scrolled to the end or when content doesn’t overflow. */
function VisitHistoryScroll({
  visitCount,
  children,
}: {
  visitCount: number;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightFade, setShowRightFade] = useState(true);

  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const canScroll = scrollWidth > clientWidth + 1;
    if (!canScroll) {
      setShowRightFade(false);
      return;
    }
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 6;
    setShowRightFade(!atEnd);
  }, []);

  useLayoutEffect(() => {
    updateFade();
    const id = requestAnimationFrame(() => updateFade());
    return () => cancelAnimationFrame(id);
  }, [visitCount, updateFade]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateFade());
    ro.observe(el);
    el.addEventListener("scroll", updateFade, { passive: true });
    window.addEventListener("resize", updateFade);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateFade);
      window.removeEventListener("resize", updateFade);
    };
  }, [updateFade]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-puregym-border bg-white shadow-md shadow-puregym-ink/5">
      <div ref={scrollRef} className="overflow-x-auto">
        {children}
      </div>
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white from-25% via-white/75 to-transparent backdrop-blur-[3px] transition-opacity duration-200 md:hidden ${
          showRightFade ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
    </div>
  );
}

function VisitTimeOfDayCell({ iso }: { iso: string }) {
  const slot = getTimeOfDaySlot(iso);
  const meta = TIME_OF_DAY_META[slot];
  const Icon = meta.Icon;
  return (
    <span
      className={`inline-flex items-center gap-2 font-medium ${meta.className}`}
      title={`${meta.label} — based on visit start time in your local timezone`}
    >
      <Icon className="shrink-0 opacity-90" aria-hidden />
      <span>{meta.label}</span>
    </span>
  );
}

const SLOT_ORDER: TimeOfDaySlot[] = ["morning", "afternoon", "evening", "night"];

const TYPICAL_WINDOW: Record<TimeOfDaySlot, string> = {
  morning: "5am–12pm",
  afternoon: "12pm–5pm",
  evening: "5pm–9pm",
  night: "9pm–5am",
};

function mondayStartOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = x.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + offset);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatWeekRangeFromMonday(monday: Date): string {
  const sun = new Date(monday);
  sun.setDate(sun.getDate() + 6);
  const sameMonth = monday.getMonth() === sun.getMonth() && monday.getFullYear() === sun.getFullYear();
  if (sameMonth) {
    return `${monday.getDate()}–${sun.getDate()} ${monday.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
  }
  return `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${sun.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

interface VisitInsights {
  total: number;
  avgDurationMins: number;
  slotCounts: Record<TimeOfDaySlot, number>;
  slotPct: Record<TimeOfDaySlot, number>;
  favoriteSlot: TimeOfDaySlot;
  favoriteCount: number;
  favoritePct: number;
  busiestMonth: { label: string; count: number } | null;
  busiestYear: { label: string; count: number } | null;
  busiestWeek: { label: string; count: number } | null;
}

function computeVisitInsights(visits: PureGymData["history"]["Visits"]): VisitInsights | null {
  const n = visits.length;
  if (n === 0) return null;

  const slotCounts: Record<TimeOfDaySlot, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };
  let durSum = 0;
  const monthMap = new Map<string, number>();
  const yearMap = new Map<number, number>();
  const weekMap = new Map<string, { monday: Date; count: number }>();

  for (const v of visits) {
    durSum += v.Duration;
    slotCounts[getTimeOfDaySlot(v.StartTime)]++;

    const d = new Date(v.StartTime);
    const y = d.getFullYear();
    const m = d.getMonth();
    yearMap.set(y, (yearMap.get(y) ?? 0) + 1);
    const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
    monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + 1);

    const mon = mondayStartOfWeek(d);
    const wk = `${mon.getFullYear()}-${mon.getMonth()}-${mon.getDate()}`;
    const prev = weekMap.get(wk);
    if (prev) prev.count++;
    else weekMap.set(wk, { monday: new Date(mon), count: 1 });
  }

  const avgDurationMins = Math.round(durSum / n);

  const slotPct = {} as Record<TimeOfDaySlot, number>;
  for (const s of SLOT_ORDER) {
    slotPct[s] = Math.round((slotCounts[s] / n) * 1000) / 10;
  }

  let favoriteSlot: TimeOfDaySlot = "morning";
  let favoriteCount = 0;
  for (const s of SLOT_ORDER) {
    if (slotCounts[s] > favoriteCount) {
      favoriteCount = slotCounts[s];
      favoriteSlot = s;
    }
  }
  const favoritePct = Math.round((favoriteCount / n) * 1000) / 10;

  const pickMax = <K,>(map: Map<K, number>, labelFn: (k: K) => string): { label: string; count: number } | null => {
    let bestK: K | undefined;
    let bestC = -1;
    for (const [k, c] of map) {
      if (c > bestC) {
        bestC = c;
        bestK = k;
      } else if (c === bestC && bestK !== undefined) {
        // Prefer more recent period when tied
        if (String(k) > String(bestK)) bestK = k;
      }
    }
    if (bestK === undefined || bestC <= 0) return null;
    return { label: labelFn(bestK), count: bestC };
  };

  const busiestMonth = pickMax(monthMap, key => {
    const [ys, calMonth] = key.split("-").map(Number);
    return new Date(ys, calMonth - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  });

  const busiestYear = pickMax(yearMap, y => String(y));

  let busiestWeek: { label: string; count: number } | null = null;
  let bestW = -1;
  let bestMonday: Date | null = null;
  for (const { monday, count } of weekMap.values()) {
    if (count > bestW) {
      bestW = count;
      bestMonday = monday;
    } else if (count === bestW && bestMonday && monday > bestMonday) {
      bestMonday = monday;
    }
  }
  if (bestMonday && bestW > 0) {
    busiestWeek = { label: formatWeekRangeFromMonday(bestMonday), count: bestW };
  }

  return {
    total: n,
    avgDurationMins,
    slotCounts,
    slotPct,
    favoriteSlot,
    favoriteCount,
    favoritePct,
    busiestMonth,
    busiestYear,
    busiestWeek,
  };
}

function InsightMostCommonTime({ insights }: { insights: VisitInsights }) {
  const slot = insights.favoriteSlot;
  const meta = TIME_OF_DAY_META[slot];
  const Icon = meta.Icon;
  return (
    <div className="min-w-0 rounded-xl border border-puregym-border/80 bg-puregym-surface/50 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-puregym-muted">Most common time</p>
      <div className={`flex items-center gap-2 text-lg font-bold leading-snug ${meta.className}`}>
        <Icon className="h-7 w-7 shrink-0" aria-hidden />
        <span>{meta.label}</span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-puregym-muted">
        Common hours: <span className="font-medium text-puregym-ink">{TYPICAL_WINDOW[slot]}</span>
      </p>
    </div>
  );
}

function VisitInsightsPanel({ insights }: { insights: VisitInsights }) {
  return (
    <div className="mb-6 rounded-2xl border border-puregym-border bg-white p-6 shadow-md shadow-puregym-ink/5">
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-puregym-muted">Visits by time of day</p>
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {SLOT_ORDER.map(slot => {
            const meta = TIME_OF_DAY_META[slot];
            const Icon = meta.Icon;
            const pct = insights.slotPct[slot];
            const count = insights.slotCounts[slot];
            return (
              <div key={slot} className="flex items-center gap-3 sm:gap-4">
                <span
                  className={`flex w-[7.5rem] shrink-0 items-center gap-2 text-sm font-semibold sm:w-36 ${meta.className}`}
                >
                  <Icon className="h-6 w-6 shrink-0 sm:h-7 sm:w-7" aria-hidden />
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="h-4 overflow-hidden rounded-full border border-puregym-border/60 bg-puregym-surface shadow-inner sm:h-5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-puregym to-puregym-hover shadow-sm transition-[width] duration-300"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
                <span className="w-[5.5rem] shrink-0 text-right text-sm tabular-nums text-puregym-ink sm:w-24">
                  <span className="font-semibold">{count}</span>
                  <span className="text-puregym-muted"> ({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <InsightMostCommonTime insights={insights} />
        <InsightStat label="Average visit length" value={fmtDuration(insights.avgDurationMins)} hint="Per visit" />
        {insights.busiestMonth && (
          <InsightStat label="Busiest month" value={insights.busiestMonth.label} hint={`${insights.busiestMonth.count} visits`} />
        )}
        {insights.busiestYear && (
          <InsightStat label="Busiest year" value={insights.busiestYear.label} hint={`${insights.busiestYear.count} visits`} />
        )}
        {insights.busiestWeek && (
          <InsightStat
            label="Busiest week"
            value={insights.busiestWeek.label}
            hint={`${insights.busiestWeek.count} visits`}
          />
        )}
      </div>
    </div>
  );
}

function InsightStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-puregym-border/80 bg-puregym-surface/50 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-puregym-muted">{label}</p>
      <p className="text-lg font-bold leading-snug text-puregym-ink">{value}</p>
      <p className="mt-0.5 text-xs text-puregym-muted">{hint}</p>
    </div>
  );
}

export default function Dashboard({ email, pin, onClearCredentials, onInvalidCredentials }: Props) {
  const [data, setData] = useState<PureGymData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 401) {
          onInvalidCredentials();
          return;
        }
        let msg = `Request failed (${res.status})`;
        try {
          const j = (await res.json()) as { error?: string };
          if (j.error) msg = j.error;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(msg);
      }
      setData(await res.json());
      setLastUpdated(fmtTimeAmPm(new Date()));
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Unknown error";
      const msg =
        raw === "Failed to fetch" || raw === "fetch failed"
          ? "Could not reach this app’s server. If you are offline, reconnect and try Refresh again."
          : raw;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [email, pin, onInvalidCredentials]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const tenMinutes = 10 * 60 * 1000;
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      load();
      intervalId = window.setInterval(() => {
        load();
      }, tenMinutes);
    }, msUntilNextTenMinuteBoundary());
    return () => {
      clearTimeout(timeoutId);
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [load]);

  return (
    <div className="min-h-screen bg-puregym-surface">
      <header className="sticky top-0 z-10 border-b border-puregym-border bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Image
              src={PUREGYM_LOGO_URL}
              alt="PureGym"
              width={120}
              height={48}
              className="h-9 w-auto shrink-0 object-contain object-left"
            />
            <div className="hidden min-w-0 sm:block">
              <h1
                className={`${dashboardHeaderTitle.className} truncate text-lg font-bold tracking-tight text-puregym-ink`}
              >
                Pure<span className="text-puregym">Gym</span> Dashboard
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {lastUpdated && (
              <span className="hidden text-xs text-puregym-muted sm:inline" title="When this page last finished loading data from PureGym">
                Fetched {lastUpdated}
              </span>
            )}
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="rounded-lg border border-puregym-border bg-white px-4 py-2 text-sm font-medium text-puregym-ink transition-colors hover:bg-puregym-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear saved credentials and sign out?")) onClearCredentials();
              }}
              className="rounded-lg border border-puregym/25 bg-puregym-soft px-4 py-2 text-sm font-medium text-puregym transition-colors hover:bg-puregym/15"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="py-20 text-center text-sm text-puregym-muted">Fetching data from PureGym…</div>
        )}

        {data && <DataView data={data} />}
      </main>
    </div>
  );
}

function DataView({ data }: { data: PureGymData }) {
  const { member: m, membership: mem, sessions: sess, history: hist } = data;

  const totalVisits = hist.Summary.Total.Visits;
  const totalDuration = hist.Summary.Total.Duration;
  const weekVisits = hist.Summary.ThisWeek.Visits;
  const weekDuration = hist.Summary.ThisWeek.Duration;
  const peopleInGym = formatPeopleInGymLive(sess.TotalPeopleInGym);

  const visitInsights = useMemo(() => computeVisitInsights(hist.Visits), [hist.Visits]);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-puregym-ink">
          Welcome back, {m.PersonalDetails.FirstName}
        </h2>
        <p className="mt-1 text-sm text-puregym-muted">{m.HomeGym.Name}</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          live
          label="In the gym now"
          value={peopleInGym}
          sub={`PureGym live data · ${fmtTimeAmPm(sess.LastRefreshed)}`}
          accentClass="bg-puregym"
          valueClass="text-puregym"
        />
        <StatCard
          label="Total visits"
          value={String(totalVisits)}
          sub={`${fmtDuration(totalDuration)} total`}
          accentClass="bg-emerald-500"
          valueClass="text-emerald-700"
        />
        <StatCard
          label="This week"
          value={String(weekVisits)}
          sub={weekDuration > 0 ? fmtDuration(weekDuration) : "No visits yet"}
          accentClass="bg-violet-500"
          valueClass="text-violet-700"
        />
        <StatCard
          label="In classes"
          value={String(sess.TotalPeopleInClasses)}
          sub={`Capacity ${sess.MaximumCapacity ?? "—"}`}
          accentClass="bg-amber-400"
          valueClass="text-amber-700"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
        <InfoSection title="Member">
          <InfoRow k="Name" v={`${m.PersonalDetails.FirstName} ${m.PersonalDetails.LastName}`} />
          <InfoRow k="Date of birth" v={m.PersonalDetails.DateOfBirth} />
          <InfoRow k="Email" v={m.PersonalDetails.ContactDetails.EmailAddress} />
          <InfoRow k="Phone" v={m.PersonalDetails.ContactDetails.PhoneNumber} />
          <InfoRow k="Status" v={<Badge active={m.MemberStatus === "Active"}>{m.MemberStatus}</Badge>} last />
        </InfoSection>

        <InfoSection title="Membership">
          <InfoRow k="Plan" v={mem.Name} />
          <InfoRow k="Level" v={mem.Level} />
          <InfoRow
            k="Payment day"
            v={`${mem.PaymentDayOfMonth}${mem.PaymentDayOfMonth === 31 ? " (last day)" : ""}`}
          />
          <InfoRow k="Frozen" v={mem.FreezeDetails ? "Yes" : "No"} last />
        </InfoSection>

        <InfoSection title="Home Gym">
          <InfoRow k="Name" v={m.HomeGym.Name} />
          <InfoRow k="Status" v={<Badge active={m.HomeGym.Status === "Open"}>{m.HomeGym.Status}</Badge>} />
          <InfoRow k="Address" v={m.HomeGym.Location.Address.Line1} />
          <InfoRow k="Postcode" v={m.HomeGym.Location.Address.Postcode} />
          <InfoRow k="Phone" v={m.HomeGym.ContactInfo.PhoneNumber} last />
        </InfoSection>
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold text-puregym-ink">
          Visit history <span className="font-normal text-puregym-muted">({totalVisits})</span>
        </h3>
        {visitInsights && <VisitInsightsPanel insights={visitInsights} />}
        <VisitHistoryScroll visitCount={hist.Visits.length}>
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-puregym-border bg-puregym-surface/80">
                {["Date", "Time", "Time of day", "Gym", "Duration"].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-puregym-muted sm:px-5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hist.Visits.map((v, i) => (
                <tr
                  key={i}
                  className="border-b border-puregym-border/80 transition-colors last:border-0 hover:bg-puregym-surface/50"
                >
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-puregym-ink sm:px-5">
                    {fmtDateOnly(v.StartTime)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-puregym-ink sm:px-5">
                    {fmtTimeAmPm(v.StartTime)}
                  </td>
                  <td className="px-4 py-3.5 sm:px-5">
                    <VisitTimeOfDayCell iso={v.StartTime} />
                  </td>
                  <td className="px-4 py-3.5 text-puregym-muted sm:px-5">{v.Gym.Name}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-puregym-muted sm:px-5">
                    {fmtDuration(v.Duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </VisitHistoryScroll>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  sub,
  accentClass,
  valueClass,
  live,
}: {
  label: string;
  value: string;
  sub: string;
  accentClass: string;
  valueClass: string;
  live?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-puregym-border bg-white shadow-md shadow-puregym-ink/5">
      <div className={`h-1 ${accentClass}`} />
      <div className="p-5">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-puregym-muted">
          {live && (
            <span className="pulse-dot inline-block h-2 w-2 shrink-0 rounded-full bg-puregym" aria-hidden />
          )}
          {label}
        </p>
        <p className={`text-4xl font-bold leading-none tracking-tight ${valueClass}`}>{value}</p>
        <p className="mt-2 text-xs text-puregym-muted">{sub}</p>
      </div>
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <h3 className="mb-3 shrink-0 text-xs font-semibold uppercase tracking-wide text-puregym-muted">{title}</h3>
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-puregym-border bg-white px-5 py-4 shadow-md shadow-puregym-ink/5">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ k, v, last }: { k: string; v: React.ReactNode; last?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 py-3 text-sm ${last ? "" : "border-b border-puregym-border/80"}`}
    >
      <span className="shrink-0 text-puregym-muted">{k}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-puregym-ink">{v}</span>
    </div>
  );
}

function Badge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
      }`}
    >
      {children}
    </span>
  );
}
