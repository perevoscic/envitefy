// src/app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";

const handler = NextAuth(getAuthOptions()); // v4: single-arg
export { handler as GET, handler as POST };
