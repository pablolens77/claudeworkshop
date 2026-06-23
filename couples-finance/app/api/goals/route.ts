import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json([]);

  const { data: goals } = await supabase
    .from("Goal")
    .select("*")
    .eq("coupleId", user.coupleId)
    .order("createdAt", { ascending: false });

  return NextResponse.json(goals ?? []);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const { title, targetAmount, currentAmount, targetDate } = await req.json();

  const { data: goal, error } = await supabase
    .from("Goal")
    .insert({
      id: crypto.randomUUID(),
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount ?? "0"),
      targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      coupleId: user.coupleId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(goal, { status: 201 });
}
