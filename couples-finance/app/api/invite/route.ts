import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { randomBytes } from "crypto";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const code = randomBytes(6).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await supabase
    .from("InviteCode")
    .insert({ id: crypto.randomUUID(), code, coupleId: user.coupleId, expiresAt })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ code: invite.code });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const { data: invite } = await supabase
    .from("InviteCode")
    .select("*, Couple(name, User(name))")
    .eq("code", code)
    .single();

  if (!invite || invite.used || new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  const couple = invite.Couple as { name: string; User: { name: string }[] };
  return NextResponse.json({
    coupleId: invite.coupleId,
    coupleName: couple.name,
    members: couple.User.map((u) => u.name),
  });
}
