import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shifts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, start_time, end_time } = body;

  if (!name || !start_time || !end_time) {
    return NextResponse.json({ error: "名称、开始时间、结束时间不能为空" }, { status: 400 });
  }

  const [updated] = await db
    .update(shifts)
    .set({ name, startTime: start_time, endTime: end_time })
    .where(eq(shifts.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "班次不存在" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  await db.delete(shifts).where(eq(shifts.id, id));

  return NextResponse.json({ success: true });
}
