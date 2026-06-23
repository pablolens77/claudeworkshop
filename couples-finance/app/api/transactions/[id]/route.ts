import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: tx } = await supabase.from("Transaction").select("*").eq("id", id).single();
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("Transaction").delete().eq("id", id);

  // Reverse the balance effect
  const { data: account } = await supabase.from("Account").select("balance").eq("id", tx.accountId).single();
  const delta = tx.direction === "IN" ? -Number(tx.amount) : Number(tx.amount);
  await supabase.from("Account").update({ balance: Number(account!.balance) + delta }).eq("id", tx.accountId);

  return NextResponse.json({ success: true });
}
