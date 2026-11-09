import { NextResponse, connection } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  await connection();
  const { code } = await params;
  const cleanCode = (code || "").trim().toUpperCase();

  const url = new URL(req.url);
  const targetApp = url.searchParams.get("app");
  
  let destination = "/";
  if (targetApp === "gug") {
    destination = "https://growurgold.vercel.app";
  }

  const response = NextResponse.redirect(new URL(destination, req.url));

  if (cleanCode) {
    response.cookies.set("civix_ref", cleanCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
