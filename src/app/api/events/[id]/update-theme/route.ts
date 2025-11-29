import getPrismaClient from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { templateId } = await req.json();
  const prisma = getPrismaClient();

  await prisma.event.update({
    where: { id: params.id },
    data: { templateId },
  });

  return NextResponse.json({ ok: true });
}
