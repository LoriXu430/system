import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { appointments, services, customers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const { id } = await params;

  const [result] = await db
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
    .where(eq(appointments.id, id));

  if (!result) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(appointments)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(appointments.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  const validStatuses = ["pending", "confirmed", "in_service", "completed", "cancelled"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "无效的状态" }, { status: 400 });
  }

  const [updated] = await db
    .update(appointments)
    .set({
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(appointments.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
