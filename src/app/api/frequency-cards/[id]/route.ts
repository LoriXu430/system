import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { frequencyCards, customers, services } from "@/lib/db/schema";
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
    .where(eq(frequencyCards.id, id));

  if (!result) {
    return NextResponse.json({ error: "次卡不存在" }, { status: 404 });
  }

  return NextResponse.json(result);
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
  const { action } = body;

  // 获取当前次卡
  const card = await db.query.frequencyCards.findFirst({
    where: eq(frequencyCards.id, id),
  });

  if (!card) {
    return NextResponse.json({ error: "次卡不存在" }, { status: 404 });
  }

  if (action === "deduct") {
    if (card.status !== "active") {
      return NextResponse.json({ error: "次卡状态不可用" }, { status: 400 });
    }
    if (card.remainingTimes <= 0) {
      return NextResponse.json({ error: "次卡次数已用完" }, { status: 400 });
    }

    const newRemaining = card.remainingTimes - 1;
    const newStatus = newRemaining === 0 ? "exhausted" : "active";

    const [updated] = await db
      .update(frequencyCards)
      .set({
        remainingTimes: newRemaining,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(frequencyCards.id, id))
      .returning();

    return NextResponse.json(updated);
  }

  if (action === "upgrade") {
    const { additional_times, additional_amount } = body;
    if (!additional_times || !additional_amount) {
      return NextResponse.json({ error: "缺少升单参数" }, { status: 400 });
    }

    const [updated] = await db
      .update(frequencyCards)
      .set({
        totalTimes: card.totalTimes + additional_times,
        remainingTimes: card.remainingTimes + additional_times,
        totalAmount: card.totalAmount + additional_amount,
        status: "active",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(frequencyCards.id, id))
      .returning();

    return NextResponse.json(updated);
  }

  if (action === "extend") {
    const { new_expire_date } = body;
    if (!new_expire_date) {
      return NextResponse.json({ error: "缺少新过期日期" }, { status: 400 });
    }

    const [updated] = await db
      .update(frequencyCards)
      .set({
        expireDate: new_expire_date,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(frequencyCards.id, id))
      .returning();

    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "无效的操作" }, { status: 400 });
}
