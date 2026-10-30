import { NextResponse, type NextRequest } from "next/server";
import { WEB_SESSION_COOKIE } from "@tthome/data";
import { isDemoUser } from "@/lib/demo-session";

/** Account pages need the demo session cookie; everyone else is sent to sign in first. */
export function proxy(req: NextRequest) {
  if (isDemoUser(req.cookies.get(WEB_SESSION_COOKIE)?.value)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/dang-nhap";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/tai-khoan", "/tai-khoan/:path*"] };
