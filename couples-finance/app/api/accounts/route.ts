import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json([]);

  const accounts = await prisma.account.findMany({
    where: { coupleId: user.coupleId },
    include: { _count: { select: { transactions: true } } },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const { name, type, balance } = await req.json();

  const account = await prisma.account.create({
    data: {
      name,
      type,
      balance: parseFloat(balance) || 0,
      coupleId: user.coupleId,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
