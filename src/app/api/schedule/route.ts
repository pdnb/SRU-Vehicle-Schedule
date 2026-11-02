import { NextResponse, type NextRequest } from "next/server";
import { canViewPhones, getViewerSession, redactContacts } from "@/lib/auth0";
import { getSchedule } from "@/lib/queries";
import type { ScheduleResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function todayInBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? todayInBangkok();
  if (!isValidDate(date)) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const [data, session] = await Promise.all([getSchedule(date), getViewerSession()]);
    const phonesHidden = !canViewPhones(session?.user);
    const body: ScheduleResponse = {
      ...data,
      bookings: phonesHidden ? redactContacts(data.bookings) : data.bookings,
      phonesHidden,
    };
    // The body depends on who is signed in, so no shared caches
    return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[schedule] PROMIS query failed:", err);
    // Show the Oracle/driver code (e.g. NJS-138, ORA-12541) outside production to speed up setup
    const detail = process.env.NODE_ENV !== "production" && err instanceof Error ? err.message : undefined;
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลจาก PROMIS ได้", detail }, { status: 500 });
  }
}
