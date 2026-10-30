import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isAdminSession } from "@/lib/session";

/** Every admin page needs the demo admin session; visitors without it go to the sign-in page. */
export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dang-nhap")) return NextResponse.next();
  if (isAdminSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/dang-nhap";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // "/" is listed on its own: with basePath the catch-all only matches paths below /admin/.
  matcher: ["/", "/((?!_next/|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|ico|css|js|woff2?)$).*)"],
};
