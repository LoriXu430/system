import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { frequencyCards, customers, services, orders } from "@/lib/db/schema";
import { eq, and, SQL, desc } from "drizzle-orm";

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

  const { searchParams } = request.nextUrl;
  const customerId = searchParams.get("customer_id");
  const status = searchParams.get("status");

  const conditions: SQL[] = [];
  if (customerId) conditions.push(eq(frequencyCards.customerId, customerId));
  if (status) conditions.push(eq(frequencyCards.status, status as any));

  const result = await db
    .select({
      id: frequencyCards.id,
      customerId: frequencyCards.customerId,
      serviceId: frequencyCards.serviceId,
      name: frequencyCards.name,
      totalTimes: frequencyCards.totalTimes,
      remainingTimes: frequencyCards.remainingTimes,
      totalAmount: frequencyCards.totalAmount,
      status: frequencyCards.status,
      expireDate: frequencyCards.expireDate,
      storeId: frequencyCards.storeId,
      orderId: frequencyCards.orderId,
      createdAt: frequencyCards.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      serviceName: services.name,
    })
    .from(frequencyCards)
    .leftJoin(customers, eq(frequencyCards.customerId, customers.id))
    .leftJoin(services, eq(frequencyCards.serviceId, services.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(frequencyCards.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { customer_id, service_id, name, total_times, total_amount, expire_date } = body;

  if (!customer_id || !service_id || !name || !total_times || !total_amount) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  try {
    const storeId = (session.user as any).storeId || null;

    // 创建订单
    const [order] = await db
      .insert(orders)
      .values({
        orderNo: generateOrderNo(),
        type: "frequency_card",
        customerId: customer_id,
        serviceId: service_id,
        amount: total_amount,
        actualAmount: total_amount,
        paymentMethod: "cash",
        channel: "store",
        status: "paid",
        storeId,
      })
      .returning();

    // 创建次卡
    const [card] = await db
      .insert(frequencyCards)
      .values({
        customerId: customer_id,
        serviceId: service_id,
        name,
        totalTimes: total_times,
        remainingTimes: total_times,
        totalAmount: total_amount,
        expireDate: expire_date || null,
        storeId,
        orderId: order.id,
      })
      .returning();

    return NextResponse.json({ data: card }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "创建失败: " + (error?.message || "") }, { status: 500 });
  }
}
