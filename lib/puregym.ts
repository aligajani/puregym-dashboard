export interface PureGymData {
  member: Member;
  membership: Membership;
  sessions: Sessions;
  history: History;
}

export interface Member {
  PersonalDetails: {
    FirstName: string;
    LastName: string;
    DateOfBirth: string;
    ContactDetails: {
      EmailAddress: string;
      PhoneNumber: string;
    };
  };
  MemberStatus: string;
  HomeGym: {
    Id: number;
    Name: string;
    Status: string;
    Location: {
      Address: {
        Line1: string;
        Postcode: string;
      };
    };
    ContactInfo: {
      PhoneNumber: string;
    };
  };
}

export interface Membership {
  Name: string;
  Level: string;
  PaymentDayOfMonth: number;
  FreezeDetails: unknown | null;
}

export interface Sessions {
  TotalPeopleInGym: number | null;
  TotalPeopleInClasses: number;
  MaximumCapacity: number | null;
  LastRefreshed: string;
}

export interface History {
  Summary: {
    Total: { Visits: number; Duration: number };
    ThisWeek: { Visits: number; Duration: number };
  };
  Visits: Array<{
    StartTime: string;
    Duration: number;
    Gym: { Name: string };
  }>;
}

const AUTH_URL = "https://auth.puregym.com/connect/token";
const API_BASE = "https://capi.puregym.com/api/v2";

/** Same as `puregym_attendance.PuregymAPIClient` (no client Basic header; scope is `pgcapi` only). */
const HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded",
  "User-Agent": "PureGym/1523 CFNetwork/1312 Darwin/21.0.0",
};

function isTransientOutboundFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  if (m.includes("auth failed")) return false;
  return (
    m.includes("fetch failed") ||
    m.includes("econnreset") ||
    m.includes("econnrefused") ||
    m.includes("etimedout") ||
    m.includes("socket") ||
    m.includes("network") ||
    m.includes("getaddrinfo")
  );
}

function toOutboundError(err: unknown): Error {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    if (m.includes("auth failed")) return err;
    if (
      err.message === "fetch failed" ||
      m.includes("fetch failed") ||
      (err.name === "TypeError" && m.includes("fetch"))
    ) {
      return new Error(
        "Could not reach PureGym. Check your internet connection, then try Refresh again.",
      );
    }
    return err;
  }
  return new Error("Could not load data from PureGym.");
}

/** Node/undici often surfaces TLS/DNS blips as `fetch failed`; retry a few times. */
async function fetchRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      last = e;
      if (i < attempts - 1 && isTransientOutboundFailure(e)) {
        await new Promise(r => setTimeout(r, 350 * (i + 1)));
        continue;
      }
      throw toOutboundError(e);
    }
  }
  throw toOutboundError(last);
}

export async function fetchPureGymData(email: string, pin: string): Promise<PureGymData> {
  const username = email.trim().toLowerCase();
  const password = pin.trim();
  return fetchPureGymDataInner(username, password);
}

async function fetchPureGymDataInner(username: string, password: string): Promise<PureGymData> {
  // 1. Authenticate
  const authBody = new URLSearchParams({
    grant_type: "password",
    username,
    password,
    scope: "pgcapi",
    client_id: "ro.client",
  });

  const authRes = await fetchRetry(AUTH_URL, { method: "POST", headers: HEADERS, body: authBody });
  if (!authRes.ok) {
    const text = await authRes.text();
    throw new Error(`Auth failed (${authRes.status}): ${text}`);
  }

  const { access_token } = await authRes.json();
  const authHeaders = { ...HEADERS, Authorization: `Bearer ${access_token}` };

  // 2. Get home gym ID from member endpoint
  const memberRes = await fetchRetry(`${API_BASE}/member`, { headers: authHeaders });
  if (!memberRes.ok) throw new Error(`Member fetch failed (${memberRes.status})`);
  const member: Member = await memberRes.json();
  const gymId = member.HomeGym.Id;

  // 3. Fetch remaining data in parallel
  const [membershipRes, sessionsRes, historyRes] = await Promise.all([
    fetchRetry(`${API_BASE}/member/membership`, { headers: authHeaders }),
    fetchRetry(`${API_BASE}/gymSessions/gym?gymId=${gymId}`, { headers: authHeaders }),
    fetchRetry(
      `${API_BASE}/gymSessions/member?fromDate=2020-01-01T00:00:00&toDate=2030-01-01T00:00:00`,
      { headers: authHeaders },
    ),
  ]);

  if (!membershipRes.ok) throw new Error(`Membership fetch failed (${membershipRes.status})`);
  if (!sessionsRes.ok) throw new Error(`Sessions fetch failed (${sessionsRes.status})`);
  if (!historyRes.ok) throw new Error(`History fetch failed (${historyRes.status})`);

  const [membership, sessions, history] = await Promise.all([
    membershipRes.json(),
    sessionsRes.json(),
    historyRes.json(),
  ]);

  return { member, membership, sessions, history };
}
