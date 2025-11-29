import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __envitefyPrismaClient: PrismaClient | undefined;
}

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be defined in order to initialize the Prisma client."
    );
  }

  return new PrismaClient();
};

export function getPrismaClient() {
  if (globalThis.__envitefyPrismaClient) {
    return globalThis.__envitefyPrismaClient;
  }

  const client = createPrismaClient();
  globalThis.__envitefyPrismaClient = client;
  return client;
}

export default getPrismaClient;
