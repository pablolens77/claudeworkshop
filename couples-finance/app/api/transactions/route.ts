import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const accounts = await prisma.account.findMany({
    where: { coupleId: user.coupleId },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  const transactions = await prisma.transaction.findMany({
    where: {
      accountId: { in: accountIds },
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { category: true, user: { select: { name: true } }, account: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { accountId, amount, direction, categoryId, description, date } = await req.json();

  const tx = await prisma.$transaction(async (db) => {
    const transaction = await db.transaction.create({
      data: {
        accountId,
        userId,
        amount: parseFloat(amount),
        direction,
        categoryId,
        description,
        date: new Date(date),
      },
      include: { category: true, user: { select: { name: true } }, account: { select: { name: true } } },
    });

    const delta = direction === "IN" ? parseFloat(amount) : -parseFloat(amount);
    await db.account.update({
      where: { id: accountId },
      data: { balance: { increment: delta } },
    });

    return transaction;
  });

  return NextResponse.json(tx, { status: 201 });
}
