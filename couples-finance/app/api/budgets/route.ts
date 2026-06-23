import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json([]);

  const now = new Date();
  const monthStart = startOfMonth(now);

  const budgets = await prisma.budget.findMany({
    where: { coupleId: user.coupleId, month: { gte: monthStart } },
    include: { category: true },
  });

  const accounts = await prisma.account.findMany({
    where: { coupleId: user.coupleId },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  const spending = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      accountId: { in: accountIds },
      direction: "OUT",
      date: { gte: monthStart, lte: endOfMonth(now) },
    },
    _sum: { amount: true },
  });

  const spendingMap: Record<string, number> = {};
  for (const s of spending) {
    spendingMap[s.categoryId] = Number(s._sum.amount ?? 0);
  }

  return NextResponse.json(
    budgets.map((b) => ({
      ...b,
      spent: spendingMap[b.categoryId] ?? 0,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const { categoryId, monthlyLimit, month } = await req.json();

  const budget = await prisma.budget.upsert({
    where: {
      id: (await prisma.budget.findFirst({
        where: { coupleId: user.coupleId, categoryId, month: new Date(month) },
      }))?.id ?? "new",
    },
    update: { monthlyLimit: parseFloat(monthlyLimit) },
    create: {
      coupleId: user.coupleId,
      categoryId,
      monthlyLimit: parseFloat(monthlyLimit),
      month: new Date(month),
    },
    include: { category: true },
  });

  return NextResponse.json(budget, { status: 201 });
}
