import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, customers, users, services } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
  });

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  const [customer, technician, staffUser, service] = await Promise.all([
    order.customerId
      ? db.query.customers.findFirst({ where: eq(customers.id, order.customerId) })
      : null,
    order.technicianId
      ? db.query.users.findFirst({ where: eq(users.id, order.technicianId) })
      : null,
    order.staffId
      ? db.query.users.findFirst({ where: eq(users.id, order.staffId) })
      : null,
    order.serviceId
      ? db.query.services.findFirst({ where: eq(services.id, order.serviceId) })
      : null,
  ]);

  return NextResponse.json({
    data: {
      ...order,
      customerName: customer?.name || null,
      customerPhone: customer?.phone || null,
      technicianName: technician?.name || null,
      staffName: staffUser?.name || null,
      serviceName: service?.name || null,
    },
  });
}

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

  const {
    staff_id,
    technician_id,
    service_id,
    amount,
    actual_amount,
    payment_method,
    channel,
    verification_code,
    notes,
  } = body;

  try {
    const result = await db
      .update(orders)
      .set({
        ...(staff_id !== undefined && { staffId: staff_id }),
        ...(technician_id !== undefined && { technicianId: technician_id }),
        ...(service_id !== undefined && { serviceId: service_id }),
        ...(amount !== undefined && { amount }),
        ...(actual_amount !== undefined && { actualAmount: actual_amount }),
        ...(payment_method !== undefined && { paymentMethod: payment_method }),
        ...(channel !== undefined && { channel }),
        ...(verification_code !== undefined && { verificationCode: verification_code }),
        ...(notes !== undefined && { notes }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !["cancelled", "refunded"].includes(status)) {
    return NextResponse.json(
      { error: "无效的状态值，仅支持 cancelled 或 refunded" },
      { status: 400 }
    );
  }

  try {
    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (existing.status === "cancelled" || existing.status === "refunded") {
      return NextResponse.json(
        { error: "订单已取消或已退款，无法操作" },
        { status: 400 }
      );
    }

    const result = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, id))
      .returning();

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
