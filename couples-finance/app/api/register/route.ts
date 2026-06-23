import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { DEFAULT_CATEGORIES } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: existing } = await supabase.from("User").select("id").eq("email", email).single();
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const coupleId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  const { error: coupleError } = await supabase
    .from("Couple")
    .insert({ id: coupleId, name: `${name}'s Household` });
  if (coupleError) return NextResponse.json({ error: coupleError.message }, { status: 500 });

  await supabase.from("Category").insert(
    DEFAULT_CATEGORIES.map((c) => ({ id: crypto.randomUUID(), ...c, isDefault: true, coupleId }))
  );

  const { data: user, error: userError } = await supabase
    .from("User")
    .insert({ id: userId, name, email, passwordHash, coupleId })
    .select("id, email")
    .single();
  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
