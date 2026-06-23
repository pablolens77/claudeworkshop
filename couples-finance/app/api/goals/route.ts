import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json([]);

  const goals = await prisma.goal.findMany({
    where: { coupleId: user.coupleId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const { title, targetAmount, currentAmount, targetDate } = await req.json();

  const goal = await prisma.goal.create({
    data: {
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount ?? "0"),
      targetDate: targetDate ? new Date(targetDate) : null,
      coupleId: user.coupleId,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
