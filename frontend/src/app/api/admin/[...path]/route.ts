import type { NextRequest } from "next/server";
import { forward } from "@/lib/bff";

type Ctx = { params: Promise<{ path: string[] }> };

// Admin calls go through the gateway with the session cookie turned into a bearer token.
const run = async (req: NextRequest, ctx: Ctx) => {
  const path = (await ctx.params).path.join("/");
  const body = req.method === "GET" || req.method === "DELETE" ? undefined : await req.text();
  return forward(req, `/api/v1/admin/${path}${req.nextUrl.search}`, body);
};

export { run as GET, run as POST, run as PUT, run as PATCH, run as DELETE };
