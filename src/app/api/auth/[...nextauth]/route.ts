import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth";

// Create the handler at runtime (so envs are read then).
const handler = NextAuth(getAuthOptions());
export { handler as GET, handler as POST };
