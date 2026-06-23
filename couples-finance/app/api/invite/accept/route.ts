import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { code } = await req.json();

  const { data: invite } = await supabase.from("InviteCode").select("*").eq("code", code).single();
  if (!invite || invite.used || new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  const { data: user } = await supabase.from("User").select("coupleId").eq("id", userId).single();
  if (user?.coupleId === invite.coupleId) {
    return NextResponse.json({ error: "Already in this couple" }, { status: 400 });
  }

  await supabase.from("User").update({ coupleId: invite.coupleId }).eq("id", userId);
  await supabase.from("InviteCode").update({ used: true }).eq("id", invite.id);

  return NextResponse.json({ success: true, coupleId: invite.coupleId });
}
