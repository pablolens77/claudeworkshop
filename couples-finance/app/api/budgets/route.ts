import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json([]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [{ data: budgets }, { data: accounts }] = await Promise.all([
    supabase.from("Budget").select("*, Category(*)").eq("coupleId", user.coupleId).gte("month", monthStart.toISOString()),
    supabase.from("Account").select("id").eq("coupleId", user.coupleId),
  ]);

  const accountIds = (accounts ?? []).map((a) => a.id);

  const { data: txs } = await supabase
    .from("Transaction")
    .select("categoryId, amount")
    .in("accountId", accountIds)
    .eq("direction", "OUT")
    .gte("date", monthStart.toISOString())
    .lte("date", monthEnd.toISOString());

  const spendingMap: Record<string, number> = {};
  for (const t of txs ?? []) {
    spendingMap[t.categoryId] = (spendingMap[t.categoryId] ?? 0) + Number(t.amount);
  }

  return NextResponse.json(
    (budgets ?? []).map((b) => ({ ...b, spent: spendingMap[b.categoryId] ?? 0 }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const { categoryId, monthlyLimit, month } = await req.json();
  const monthDate = new Date(month).toISOString();

  const { data: existing } = await supabase
    .from("Budget")
    .select("id")
    .eq("coupleId", user.coupleId)
    .eq("categoryId", categoryId)
    .eq("month", monthDate)
    .single();

  let budget;
  if (existing) {
    const { data } = await supabase
      .from("Budget")
      .update({ monthlyLimit: parseFloat(monthlyLimit) })
      .eq("id", existing.id)
      .select("*, Category(*)")
      .single();
    budget = data;
  } else {
    const { data } = await supabase
      .from("Budget")
      .insert({ id: crypto.randomUUID(), coupleId: user.coupleId, categoryId, monthlyLimit: parseFloat(monthlyLimit), month: monthDate })
      .select("*, Category(*)")
      .single();
    budget = data;
  }

  return NextResponse.json(budget, { status: 201 });
}
