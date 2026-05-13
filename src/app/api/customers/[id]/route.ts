import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { customers, frequencyCards, coupons, orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, id),
  });

  if (!customer) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  const [cards, couponList, orderList] = await Promise.all([
    db
      .select()
      .from(frequencyCards)
      .where(eq(frequencyCards.customerId, id))
      .orderBy(desc(frequencyCards.createdAt)),
    db
      .select()
      .from(coupons)
      .where(eq(coupons.customerId, id))
      .orderBy(desc(coupons.createdAt)),
    db
      .select()
      .from(orders)
      .where(eq(orders.customerId, id))
      .orderBy(desc(orders.createdAt))
      .limit(50),
  ]);

  return NextResponse.json({
    data: {
      ...customer,
      frequencyCards: cards,
      coupons: couponList,
      orders: orderList,
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
  const db = await getDb();

  const { id } = await params;
  const body = await request.json();
  const { name, phone, gender, notes } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "姓名和手机号必填" }, { status: 400 });
  }

  try {
    const result = await db
      .update(customers)
      .set({
        name,
        phone,
        gender: gender || null,
        notes: notes || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customers.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: result[0] });
  } catch (error: any) {
    if (error?.message?.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "该手机号已存在" }, { status: 409 });
    }
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
