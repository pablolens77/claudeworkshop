import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json([]);

  const { data: categories } = await supabase
    .from("Category")
    .select("*")
    .or(`coupleId.eq.${user.coupleId},and(isDefault.eq.true,coupleId.is.null)`)
    .order("name");

  return NextResponse.json(categories ?? []);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const { name, icon, color } = await req.json();

  const { data: category, error } = await supabase
    .from("Category")
    .insert({ id: crypto.randomUUID(), name, icon, color, isDefault: false, coupleId: user.coupleId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(category, { status: 201 });
}
