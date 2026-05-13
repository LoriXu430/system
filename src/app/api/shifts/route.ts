import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { shifts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const result = await db
    .select()
    .from(shifts)
    .orderBy(shifts.startTime);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const body = await request.json();
  const { name, start_time, end_time } = body;

  if (!name || !start_time || !end_time) {
    return NextResponse.json({ error: "名称、开始时间、结束时间不能为空" }, { status: 400 });
  }

  const storeId = (session.user as any).storeId || null;

  const [created] = await db
    .insert(shifts)
    .values({
      name,
      startTime: start_time,
      endTime: end_time,
      storeId,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
