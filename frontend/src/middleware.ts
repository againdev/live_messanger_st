import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("access_token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};