// app/api/media-proxy/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("Media proxy attivo");
}
