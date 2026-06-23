import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.transaction.delete({ where: { id } }),
    prisma.account.update({
      where: { id: tx.accountId },
      data: {
        balance: { increment: tx.direction === "IN" ? -Number(tx.amount) : Number(tx.amount) },
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
