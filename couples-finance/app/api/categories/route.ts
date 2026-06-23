import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json([]);

  const categories = await prisma.category.findMany({
    where: {
      OR: [{ coupleId: user.coupleId }, { isDefault: true, coupleId: null }],
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id!;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.coupleId) return NextResponse.json({ error: "No couple" }, { status: 400 });

  const { name, icon, color } = await req.json();

  const category = await prisma.category.create({
    data: { name, icon, color, isDefault: false, coupleId: user.coupleId },
  });

  return NextResponse.json(category, { status: 201 });
}
