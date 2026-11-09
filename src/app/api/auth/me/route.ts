import { NextResponse } from "next/server";
import { getCurrentCitizen } from "@/lib/auth";

export async function GET() {
  const citizen = await getCurrentCitizen();
  if (!citizen) {
    return NextResponse.json({ authenticated: false, citizen: null });
  }
  return NextResponse.json({ authenticated: true, citizen });
}
