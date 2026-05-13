import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { orders, customers, users, services } from "@/lib/db/schema";
import { eq, like, and, sql, desc } from "drizzle-orm";

function generateOrderNo(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const date =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  const rand = Math.floor(1000 + Math.random() * 9000);
  return date + rand;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const channel = searchParams.get("channel");
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (type) conditions.push(eq(orders.type, type as any));
  if (channel) conditions.push(eq(orders.channel, channel as any));
  if (status) conditions.push(eq(orders.status, status as any));
  if (customerId) conditions.push(eq(orders.customerId, customerId));
  if (search) conditions.push(like(orders.orderNo, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const customer = db
    .select({ id: customers.id, name: customers.name, phone: customers.phone })
    .from(customers)
    .as("customer");

  const technician = db
    .select({ id: users.id, name: users.name })
    .from(users)
    .as("technician");

  const staff = db
    .select({ id: users.id, name: users.name })
    .from(users)
    .as("staff");

  const service = db
    .select({ id: services.id, name: services.name })
    .from(services)
    .as("service");

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        type: orders.type,
        customerId: orders.customerId,
        staffId: orders.staffId,
        technicianId: orders.technicianId,
        serviceId: orders.serviceId,
        amount: orders.amount,
        actualAmount: orders.actualAmount,
        paymentMethod: orders.paymentMethod,
        channel: orders.channel,
        verificationCode: orders.verificationCode,
        status: orders.status,
        storeId: orders.storeId,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        customerName: customer.name,
        customerPhone: customer.phone,
        technicianName: technician.name,
        staffName: staff.name,
        serviceName: service.name,
      })
      .from(orders)
      .leftJoin(customer, eq(orders.customerId, customer.id))
      .leftJoin(technician, eq(orders.technicianId, technician.id))
      .leftJoin(staff, eq(orders.staffId, staff.id))
      .leftJoin(service, eq(orders.serviceId, service.id))
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(where),
  ]);

  return NextResponse.json({
    data,
    total: countResult[0].count,
    page,
    pageSize,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const body = await request.json();
  const {
    type,
    customer_id,
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

  if (!type || !customer_id || !amount || !actual_amount || !payment_method) {
    return NextResponse.json(
      { error: "缺少必填字段" },
      { status: 400 }
    );
  }

  try {
    const result = await db
      .insert(orders)
      .values({
        orderNo: generateOrderNo(),
        type,
        customerId: customer_id,
        staffId: staff_id || null,
        technicianId: technician_id || null,
        serviceId: service_id || null,
        amount,
        actualAmount: actual_amount,
        paymentMethod: payment_method,
        channel: channel || "store",
        verificationCode: verification_code || null,
        status: "paid",
        storeId: (session.user as any).storeId || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ data: result[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "创建失败: " + (error?.message || "") }, { status: 500 });
  }
}
