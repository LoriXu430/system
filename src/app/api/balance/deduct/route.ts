import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customer_id),
  });

  if (!customer) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  const currentBalance = customer.balance ?? 0;
  if (currentBalance < amount) {
    return NextResponse.json({ error: "余额不足" }, { status: 400 });
  }

  const newBalance = currentBalance - amount;
  await db
    .update(customers)
    .set({
      balance: newBalance,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(customers.id, customer_id));

  return NextResponse.json({ balance: newBalance });
}
