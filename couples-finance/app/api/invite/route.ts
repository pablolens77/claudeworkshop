import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const code = randomBytes(6).toString("hex").toUpperCase();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await prisma.inviteCode.create({
    data: { code, coupleId: user.coupleId, expiresAt },
  });

  return NextResponse.json({ code: invite.code });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code" }, { status: 400 });

  const invite = await prisma.inviteCode.findUnique({
    where: { code },
    include: { couple: { include: { users: { select: { name: true } } } } },
  });

  if (!invite || invite.used || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  return NextResponse.json({
    coupleId: invite.coupleId,
    coupleName: invite.couple.name,
    members: invite.couple.users.map((u) => u.name),
  });
}
