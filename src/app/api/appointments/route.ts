import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { appointments, services, customers, users, frequencyCards } from "@/lib/db/schema";
import { eq, and, SQL, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const { searchParams } = request.nextUrl;
  const date = searchParams.get("date");
  const staffId = searchParams.get("staff_id");
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");

  const conditions: SQL[] = [];

  if (date) {
    conditions.push(eq(appointments.date, date));
  }
  if (staffId) {
    conditions.push(eq(appointments.staffId, staffId));
  }
  if (status) {
    conditions.push(eq(appointments.status, status as any));
  }
  if (customerId) {
    conditions.push(eq(appointments.customerId, customerId));
  }

  const result = await db
    .select({
      id: appointments.id,
      customerId: appointments.customerId,
      serviceId: appointments.serviceId,
      staffId: appointments.staffId,
      storeId: appointments.storeId,
      date: appointments.date,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      status: appointments.status,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      serviceName: services.name,
      servicePrice: services.price,
      serviceDuration: services.duration,
      staffName: users.name,
    })
    .from(appointments)
    .leftJoin(customers, eq(appointments.customerId, customers.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(users, eq(appointments.staffId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(appointments.createdAt));

  return NextResponse.json(result);
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function timeOverlaps(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 < e2 && s2 < e1;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const body = await request.json();
  const { customer_id, service_id, staff_id, date, start_time, notes, frequency_card_id } = body;

  if (!customer_id || !service_id || !staff_id || !date || !start_time) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  // 获取服务时长
  const service = await db.query.services.findFirst({
    where: eq(services.id, service_id),
  });
  if (!service) {
    return NextResponse.json({ error: "服务项目不存在" }, { status: 400 });
  }

  const endTime = addMinutesToTime(start_time, service.duration);

  // 检测时间冲突
  const existingAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.staffId, staff_id),
        eq(appointments.date, date),
        eq(appointments.status, "pending")
      )
    );

  // Also check in_service and confirmed
  const confirmedAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.staffId, staff_id),
        eq(appointments.date, date),
        eq(appointments.status, "confirmed")
      )
    );

  const inServiceAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.staffId, staff_id),
        eq(appointments.date, date),
        eq(appointments.status, "in_service")
      )
    );

  const allActive = [...existingAppointments, ...confirmedAppointments, ...inServiceAppointments];

  for (const apt of allActive) {
    if (timeOverlaps(start_time, endTime, apt.startTime, apt.endTime)) {
      return NextResponse.json(
        { error: `该手艺人在 ${apt.startTime}-${apt.endTime} 已有预约` },
        { status: 409 }
      );
    }
  }

  const storeId = (session.user as any).storeId || null;

  const [created] = await db
    .insert(appointments)
    .values({
      customerId: customer_id,
      serviceId: service_id,
      staffId: staff_id,
      date,
      startTime: start_time,
      endTime: endTime,
      notes: notes || null,
      storeId,
    })
    .returning();

  // 次卡自动抵扣
  if (frequency_card_id) {
    const card = await db.query.frequencyCards.findFirst({
      where: eq(frequencyCards.id, frequency_card_id),
    });
    if (card && card.status === "active" && card.remainingTimes > 0) {
      const newRemaining = card.remainingTimes - 1;
      await db
        .update(frequencyCards)
        .set({
          remainingTimes: newRemaining,
          status: newRemaining === 0 ? "exhausted" : "active",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(frequencyCards.id, frequency_card_id));
    }
  }

  return NextResponse.json(created, { status: 201 });
}
