// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";

const handler = NextAuth(getAuthOptions()); // ← only one argument
export { handler as GET, handler as POST };
