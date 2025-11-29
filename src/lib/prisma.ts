import { PrismaClient } from "@prisma/client";

// Allow using models that may not be captured in the generated typings yet.
const prisma = (global as any).prisma || new PrismaClient();
(global as any).prisma = prisma;

export default prisma as any;
