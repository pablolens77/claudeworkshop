import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json({ noCouple: true });

  const [{ data: accounts }, { data: couple }] = await Promise.all([
    supabase.from("Account").select("*").eq("coupleId", user.coupleId),
    supabase.from("Couple").select("*, User(id, name, email)").eq("id", user.coupleId).single(),
  ]);

  const accountIds = (accounts ?? []).map((a) => a.id);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  const [{ data: monthTxs }, { data: recentTxs }, { data: allSixMonthTxs }] = await Promise.all([
    supabase.from("Transaction").select("*, Category(*)").in("accountId", accountIds).gte("date", monthStart.toISOString()).lte("date", monthEnd.toISOString()),
    supabase.from("Transaction").select("*, Category(*), User(name), Account(name)").in("accountId", accountIds).order("date", { ascending: false }).limit(15),
    supabase.from("Transaction").select("date, direction, amount").in("accountId", accountIds).gte("date", sixMonthsAgo.toISOString()),
  ]);

  const totalBalance = (accounts ?? []).reduce((sum, a) => sum + Number(a.balance), 0);
  const moneyIn = (monthTxs ?? []).filter((t) => t.direction === "IN").reduce((s, t) => s + Number(t.amount), 0);
  const moneyOut = (monthTxs ?? []).filter((t) => t.direction === "OUT").reduce((s, t) => s + Number(t.amount), 0);

  const categoryTotals: Record<string, { name: string; color: string; amount: number }> = {};
  for (const tx of (monthTxs ?? []).filter((t) => t.direction === "OUT")) {
    const cat = tx.Category as { name: string; color: string | null };
    if (!categoryTotals[tx.categoryId]) {
      categoryTotals[tx.categoryId] = { name: cat.name, color: cat.color ?? "#607D8B", amount: 0 };
    }
    categoryTotals[tx.categoryId].amount += Number(tx.amount);
  }

  const sixMonthData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const monthTxsSlice = (allSixMonthTxs ?? []).filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
    return {
      month: month.toLocaleString("default", { month: "short" }),
      in: monthTxsSlice.filter((t) => t.direction === "IN").reduce((s, t) => s + Number(t.amount), 0),
      out: monthTxsSlice.filter((t) => t.direction === "OUT").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  return NextResponse.json({
    totalBalance,
    moneyIn,
    moneyOut,
    netSavings: moneyIn - moneyOut,
    recentTransactions: recentTxs ?? [],
    categoryBreakdown: Object.values(categoryTotals),
    sixMonthData,
    accounts: accounts ?? [],
    couple,
  });
}
