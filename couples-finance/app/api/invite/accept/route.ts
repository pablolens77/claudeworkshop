import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const { code } = await req.json();

  const invite = await prisma.inviteCode.findUnique({ where: { code } });
  if (!invite || invite.used || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.coupleId === invite.coupleId) {
    return NextResponse.json({ error: "Already in this couple" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { coupleId: invite.coupleId },
    }),
    prisma.inviteCode.update({
      where: { id: invite.id },
      data: { used: true },
    }),
  ]);

  return NextResponse.json({ success: true, coupleId: invite.coupleId });
}
