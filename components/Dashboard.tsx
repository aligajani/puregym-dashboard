"use client";

import { useEffect, useState, useCallback } from "react";
import type { PureGymData } from "@/lib/puregym";

interface Props {
  email: string;
  pin: string;
  onClearCredentials: () => void;
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function Dashboard({ email, pin, onClearCredentials }: Props) {
  const [data, setData]           = useState<PureGymData | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
      setLastUpdated(new Date().toLocaleTimeString("en-GB"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [email, pin]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.3px" }}>
          Pure<span style={{ color: "#e63946" }}>Gym</span> Dashboard
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} disabled={loading} style={btnStyle(false)}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button
            onClick={() => {
              if (confirm("Clear saved credentials and sign out?")) onClearCredentials();
            }}
            style={btnStyle(true)}
          >
            Sign out
          </button>
        </div>
      </header>

      {lastUpdated && (
        <p style={{ fontSize: 12, color: "#666", marginBottom: 28 }}>Last updated: {lastUpdated}</p>
      )}

      {error && (
        <div style={{ background: "#2e0d0f", border: "1px solid #5a1a1e", borderRadius: 12, padding: "16px 20px", marginBottom: 24, color: "#e63946", fontSize: 14 }}>
          {error.includes("401") || error.includes("Auth failed")
            ? "Invalid email or PIN. Please sign out and try again."
            : error}
        </div>
      )}

      {loading && !data && (
        <div style={{ textAlign: "center", padding: 60, color: "#555" }}>Fetching data from PureGym…</div>
      )}

      {data && <DataView data={data} />}
    </div>
  );
}

function DataView({ data }: { data: PureGymData }) {
  const { member: m, membership: mem, sessions: sess, history: hist } = data;

  const totalVisits   = hist.Summary.Total.Visits;
  const totalDuration = hist.Summary.Total.Duration;
  const weekVisits    = hist.Summary.ThisWeek.Visits;
  const weekDuration  = hist.Summary.ThisWeek.Duration;
  const peopleInGym   = sess.TotalPeopleInGym ?? "—";

  return (
    <>
      {/* Stat cards */}
      <div style={grid}>
        <StatCard
          label={<><span className="pulse-dot" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#e63946", marginRight: 6 }} />People in gym now</>}
          value={String(peopleInGym)}
          valueColor="#e63946"
          sub={`Last refreshed ${fmt(sess.LastRefreshed)}`}
        />
        <StatCard
          label="People in classes"
          value={String(sess.TotalPeopleInClasses)}
          sub={`Max capacity: ${sess.MaximumCapacity ?? "—"}`}
        />
        <StatCard
          label="Total visits"
          value={String(totalVisits)}
          valueColor="#2dc653"
          sub={`${fmtDuration(totalDuration)} total gym time`}
        />
        <StatCard
          label="This week"
          value={String(weekVisits)}
          sub={weekDuration > 0 ? fmtDuration(weekDuration) : "No visits yet"}
        />
      </div>

      {/* Info cards row */}
      <div style={{ ...grid, marginBottom: 24 }}>
        <InfoSection title="Member">
          <InfoRow k="Name"  v={`${m.PersonalDetails.FirstName} ${m.PersonalDetails.LastName}`} />
          <InfoRow k="Date of birth" v={m.PersonalDetails.DateOfBirth} />
          <InfoRow k="Email" v={m.PersonalDetails.ContactDetails.EmailAddress} />
          <InfoRow k="Phone" v={m.PersonalDetails.ContactDetails.PhoneNumber} />
          <InfoRow k="Status" v={<Badge active={m.MemberStatus === "Active"}>{m.MemberStatus}</Badge>} />
        </InfoSection>

        <InfoSection title="Membership">
          <InfoRow k="Plan"  v={mem.Name} />
          <InfoRow k="Level" v={mem.Level} />
          <InfoRow k="Payment day" v={`${mem.PaymentDayOfMonth}${mem.PaymentDayOfMonth === 31 ? " (last day)" : ""}`} />
          <InfoRow k="Frozen" v={mem.FreezeDetails ? "Yes" : "No"} />
        </InfoSection>

        <InfoSection title="Home Gym">
          <InfoRow k="Name"     v={m.HomeGym.Name} />
          <InfoRow k="Status"   v={<Badge active={m.HomeGym.Status === "Open"}>{m.HomeGym.Status}</Badge>} />
          <InfoRow k="Address"  v={m.HomeGym.Location.Address.Line1} />
          <InfoRow k="Postcode" v={m.HomeGym.Location.Address.Postcode} />
          <InfoRow k="Phone"    v={m.HomeGym.ContactInfo.PhoneNumber} />
        </InfoSection>
      </div>

      {/* Visit history */}
      <div style={{ marginBottom: 24 }}>
        <p style={sectionTitle}>Visit History ({totalVisits} visits)</p>
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {["Date & Time", "Gym", "Duration"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.6px", color: "#555", borderBottom: "1px solid #252525" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hist.Visits.map((v, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1e1e1e" }}>
                  <td style={{ padding: "11px 14px", color: "#f0f0f0" }}>{fmt(v.StartTime)}</td>
                  <td style={{ padding: "11px 14px", color: "#ccc" }}>{v.Gym.Name}</td>
                  <td style={{ padding: "11px 14px", color: "#ccc" }}>{fmtDuration(v.Duration)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, valueColor, sub }: { label: React.ReactNode; value: string; valueColor?: string; sub: string }) {
  return (
    <div style={card}>
      <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "#666", marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", color: valueColor ?? "#f0f0f0" }}>{value}</p>
      <p style={{ fontSize: 13, color: "#888", marginTop: 4 }}>{sub}</p>
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={sectionTitle}>{title}</p>
      <div style={card}>{children}</div>
    </div>
  );
}

function InfoRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: "1px solid #1f1f1f", fontSize: 14 }}>
      <span style={{ color: "#888" }}>{k}</span>
      <span style={{ fontWeight: 500 }}>{v}</span>
    </div>
  );
}

function Badge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 500,
      background: active ? "#0d2e18" : "#2e0d0f",
      color:      active ? "#2dc653" : "#e63946",
    }}>
      {children}
    </span>
  );
}

// Shared styles
const card: React.CSSProperties = {
  background: "#1a1a1a",
  border: "1px solid #252525",
  borderRadius: 12,
  padding: "20px 24px",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
  marginBottom: 24,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "#555",
  marginBottom: 12,
};

function btnStyle(danger: boolean): React.CSSProperties {
  return {
    background: danger ? "transparent" : "#1e1e1e",
    border: danger ? "1px solid #3a1a1a" : "1px solid #2e2e2e",
    color: danger ? "#e63946" : "#f0f0f0",
    padding: "8px 18px",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
  };
}
