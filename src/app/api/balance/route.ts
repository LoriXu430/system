import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

  const customerId = request.nextUrl.searchParams.get("customer_id");
  if (!customerId) {
    return NextResponse.json({ error: "缺少 customer_id" }, { status: 400 });
  }

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  });

  if (!customer) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  return NextResponse.json({ balance: customer.balance ?? 0 });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { customer_id, amount } = body;

  if (!customer_id || !amount || amount <= 0) {
    return NextResponse.json({ error: "缺少必填字段或金额无效" }, { status: 400 });
  }

  try {
    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, customer_id),
    });

    if (!customer) {
      return NextResponse.json({ error: "客户不存在" }, { status: 404 });
    }

    const storeId = (session.user as any).storeId || null;
    const newBalance = (customer.balance ?? 0) + amount;

    // 更新余额
    await db
      .update(customers)
      .set({
        balance: newBalance,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customers.id, customer_id));

    // 创建充值订单
    const [order] = await db
      .insert(orders)
      .values({
        orderNo: generateOrderNo(),
        type: "recharge",
        customerId: customer_id,
        amount,
        actualAmount: amount,
        paymentMethod: "cash",
        channel: "store",
        status: "paid",
        storeId,
      })
      .returning();

    return NextResponse.json({ data: order, balance: newBalance }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "充值失败: " + (error?.message || "") }, { status: 500 });
  }
}
