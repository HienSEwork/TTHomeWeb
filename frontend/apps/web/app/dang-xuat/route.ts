import { NextResponse, type NextRequest } from "next/server";
import { WEB_SESSION_COOKIE } from "@tthome/data";

/** Ends the demo session and goes back to the sign-in page. */
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/dang-nhap", req.url));
  res.cookies.delete({ name: WEB_SESSION_COOKIE, path: "/" });
  return res;
}
