import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { templateId } = await req.json();

  await (prisma as any).event.update({
    where: { id: params.id },
    data: { templateId },
  });

  return NextResponse.json({ ok: true });
}
