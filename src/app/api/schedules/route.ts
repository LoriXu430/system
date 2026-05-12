import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { schedules, shifts, users } from "@/lib/db/schema";
import { eq, and, gte, lte, SQL } from "drizzle-orm";

function getWeekRange(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) => dt.toISOString().split("T")[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const staffId = searchParams.get("staff_id");
  const week = searchParams.get("week");

  const conditions: SQL[] = [];

  if (date) {
    conditions.push(eq(schedules.date, date));
  }

  if (staffId) {
    conditions.push(eq(schedules.staffId, staffId));
  }

  if (week) {
    const { start, end } = getWeekRange(week);
    conditions.push(gte(schedules.date, start));
    conditions.push(lte(schedules.date, end));
  }

  const result = await db
    .select({
      id: schedules.id,
      staffId: schedules.staffId,
      shiftId: schedules.shiftId,
      date: schedules.date,
      storeId: schedules.storeId,
      createdAt: schedules.createdAt,
      shiftName: shifts.name,
      shiftStart: shifts.startTime,
      shiftEnd: shifts.endTime,
      staffName: users.name,
    })
    .from(schedules)
    .leftJoin(shifts, eq(schedules.shiftId, shifts.id))
    .leftJoin(users, eq(schedules.staffId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schedules.date);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { staff_id, shift_id, date } = body;

  if (!staff_id || !shift_id || !date) {
    return NextResponse.json({ error: "员工、班次、日期不能为空" }, { status: 400 });
  }

  const storeId = (session.user as any).storeId || null;

  const [created] = await db
    .insert(schedules)
    .values({
      staffId: staff_id,
      shiftId: shift_id,
      date,
      storeId,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "缺少排班 ID" }, { status: 400 });
  }

  await db.delete(schedules).where(eq(schedules.id, id));

  return NextResponse.json({ success: true });
}
