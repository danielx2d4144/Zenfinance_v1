import { NextResponse } from "next/server";

import { getTrackerData } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getTrackerData();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tracker data" }, { status: 500 });
  }
}