import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { couple: { include: { users: { select: { id: true, name: true, email: true } } } } },
  });
  if (!user?.coupleId) return NextResponse.json({ noCouple: true });

  const accounts = await prisma.account.findMany({
    where: { coupleId: user.coupleId },
  });
  const accountIds = accounts.map((a) => a.id);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [monthTransactions, recentTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { accountId: { in: accountIds }, date: { gte: monthStart, lte: monthEnd } },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { accountId: { in: accountIds } },
      include: { category: true, user: { select: { name: true } }, account: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 15,
    }),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const moneyIn = monthTransactions.filter((t) => t.direction === "IN").reduce((s, t) => s + Number(t.amount), 0);
  const moneyOut = monthTransactions.filter((t) => t.direction === "OUT").reduce((s, t) => s + Number(t.amount), 0);

  // Category breakdown (this month, spending only)
  const categoryTotals: Record<string, { name: string; color: string; amount: number }> = {};
  for (const tx of monthTransactions.filter((t) => t.direction === "OUT")) {
    const key = tx.categoryId;
    if (!categoryTotals[key]) {
      categoryTotals[key] = { name: tx.category.name, color: tx.category.color ?? "#607D8B", amount: 0 };
    }
    categoryTotals[key].amount += Number(tx.amount);
  }

  // 6-month bar chart
  const sixMonthData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      return prisma.transaction.groupBy({
        by: ["direction"],
        where: { accountId: { in: accountIds }, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }).then((rows) => ({
        month: month.toLocaleString("default", { month: "short" }),
        in: rows.find((r) => r.direction === "IN")?._sum.amount ?? 0,
        out: rows.find((r) => r.direction === "OUT")?._sum.amount ?? 0,
      }));
    })
  );

  return NextResponse.json({
    totalBalance,
    moneyIn,
    moneyOut,
    netSavings: moneyIn - moneyOut,
    recentTransactions,
    categoryBreakdown: Object.values(categoryTotals),
    sixMonthData,
    accounts,
    couple: user.couple,
  });
}
