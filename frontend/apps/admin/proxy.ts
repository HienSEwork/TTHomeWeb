import { NextResponse, type NextRequest } from "next/server";
import { refreshOnce } from "@/lib/refresh";
import { ACCESS_COOKIE, REFRESH_COOKIE, accessTokenFresh, cookieOptions } from "@/lib/session";

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dang-nhap")) return NextResponse.next();
  if (accessTokenFresh(req.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();

  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  const tokens = refreshToken ? await refreshOnce(refreshToken) : null;
  if (!tokens) {
    const url = req.nextUrl.clone();
    url.pathname = "/dang-nhap";
    url.search = "";
    const res = NextResponse.redirect(url);
    res.cookies.delete({ name: ACCESS_COOKIE, path: "/admin" });
    res.cookies.delete({ name: REFRESH_COOKIE, path: "/admin" });
    return res;
  }

  // Pages rendered for this very request must already see the new token.
  req.cookies.set(ACCESS_COOKIE, tokens.accessToken);
  req.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.accessExpiresAt));
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshExpiresAt));
  return res;
}

export const config = {
  matcher: ["/((?!_next/|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|ico|css|js|woff2?)$).*)"],
};
