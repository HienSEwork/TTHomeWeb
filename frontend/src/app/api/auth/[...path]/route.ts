import type { NextRequest } from "next/server";
import { handle } from "@/lib/bff";

type Ctx = { params: Promise<{ path: string[] }> };
const run = async (req: NextRequest, ctx: Ctx) => handle(req, (await ctx.params).path);

export { run as GET, run as POST };
