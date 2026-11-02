import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { isMockMode } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Liveness for the container healthcheck. Add ?db=1 to also check the PROMIS connection.
export async function GET(request: NextRequest) {
  const mock = isMockMode();
  if (request.nextUrl.searchParams.get("db") !== "1" || mock) {
    return NextResponse.json({ status: "ok", mock });
  }

  try {
    await query("SELECT 1 FROM DUAL");
    return NextResponse.json({ status: "ok", mock, db: "ok" });
  } catch (err) {
    console.error("[health] PROMIS check failed:", err);
    return NextResponse.json({ status: "error", mock, db: "error" }, { status: 503 });
  }
}
