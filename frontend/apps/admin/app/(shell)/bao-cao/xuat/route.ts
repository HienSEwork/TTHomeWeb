import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { withQuery } from "@/lib/api";
import { ACCESS_COOKIE, apiBaseUrl } from "@/lib/session";

/** Streams report-service's Excel export to the browser, signed with the admin's session. */
export async function GET(req: NextRequest) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/admin/dang-nhap", req.url));
  const q = req.nextUrl.searchParams;
  const res = await fetch(`${apiBaseUrl()}${withQuery("/admin/reports/overview.xlsx", { from: q.get("from"), to: q.get("to") })}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return new NextResponse("Không xuất được báo cáo. Thử lại sau.", { status: res.status === 401 ? 401 : 502 });
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": res.headers.get("Content-Disposition") ?? 'attachment; filename="bao-cao.xlsx"',
    },
  });
}
