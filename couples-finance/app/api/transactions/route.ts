import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const { data: accounts } = await supabase.from("Account").select("id").eq("coupleId", user.coupleId);
  const accountIds = (accounts ?? []).map((a) => a.id);

  let query = supabase
    .from("Transaction")
    .select("*, Category(*), User(name), Account(name)")
    .in("accountId", accountIds)
    .order("date", { ascending: false })
    .limit(limit);

  if (from) query = query.gte("date", new Date(from).toISOString());
  if (to) query = query.lte("date", new Date(to).toISOString());

  const { data: transactions } = await query;
  return NextResponse.json(transactions ?? []);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { accountId, amount, direction, categoryId, description, date } = await req.json();
  const parsedAmount = parseFloat(amount);

  const { data: tx, error } = await supabase
    .from("Transaction")
    .insert({
      id: crypto.randomUUID(),
      accountId,
      userId,
      amount: parsedAmount,
      direction,
      categoryId,
      description,
      date: new Date(date).toISOString(),
    })
    .select("*, Category(*), User(name), Account(name)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update account balance
  const { data: account } = await supabase.from("Account").select("balance").eq("id", accountId).single();
  const delta = direction === "IN" ? parsedAmount : -parsedAmount;
  await supabase.from("Account").update({ balance: Number(account!.balance) + delta }).eq("id", accountId);

  return NextResponse.json(tx, { status: 201 });
}
