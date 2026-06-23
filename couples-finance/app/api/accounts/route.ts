import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json([]);

  const { data: accounts } = await supabase
    .from("Account")
    .select("*, Transaction(count)")
    .eq("coupleId", user.coupleId);

  const normalized = (accounts ?? []).map((a) => {
    const { Transaction, ...rest } = a as typeof a & { Transaction: { count: number }[] };
    return { ...rest, _count: { transactions: Transaction?.[0]?.count ?? 0 } };
  });

  return NextResponse.json(normalized);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const { name, type, balance } = await req.json();

  const { data: account, error } = await supabase
    .from("Account")
    .insert({ id: crypto.randomUUID(), name, type, balance: parseFloat(balance) || 0, coupleId: user.coupleId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(account, { status: 201 });
}
