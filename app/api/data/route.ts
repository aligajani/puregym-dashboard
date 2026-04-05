import { NextRequest, NextResponse } from "next/server";
import { fetchPureGymData } from "@/lib/puregym";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";

  if (!email || !pin) {
    return NextResponse.json({ error: "Email and PIN are required" }, { status: 400 });
  }

  try {
    const data = await fetchPureGymData(email, pin);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("Auth failed") ? 401 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
