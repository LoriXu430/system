import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { coupons, customers, services } from "@/lib/db/schema";
import { eq, and, SQL, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const { searchParams } = request.nextUrl;
  const customerId = searchParams.get("customer_id");
  const status = searchParams.get("status");

  const conditions: SQL[] = [];
  if (customerId) conditions.push(eq(coupons.customerId, customerId));
  if (status) conditions.push(eq(coupons.status, status as any));

  const result = await db
    .select({
      id: coupons.id,
      customerId: coupons.customerId,
      name: coupons.name,
      type: coupons.type,
      value: coupons.value,
      minAmount: coupons.minAmount,
      serviceId: coupons.serviceId,
      status: coupons.status,
      expireDate: coupons.expireDate,
      storeId: coupons.storeId,
      createdAt: coupons.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      serviceName: services.name,
    })
    .from(coupons)
    .leftJoin(customers, eq(coupons.customerId, customers.id))
    .leftJoin(services, eq(coupons.serviceId, services.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(coupons.createdAt));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const body = await request.json();
  const { customer_id, name, type, value, min_amount, service_id, expire_date } = body;

  if (!customer_id || !name || !type || value === undefined || !expire_date) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  try {
    const storeId = (session.user as any).storeId || null;

    const [coupon] = await db
      .insert(coupons)
      .values({
        customerId: customer_id,
        name,
        type,
        value,
        minAmount: min_amount ?? null,
        serviceId: service_id || null,
        expireDate: expire_date,
        storeId,
      })
      .returning();

    return NextResponse.json({ data: coupon }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "发放失败: " + (error?.message || "") }, { status: 500 });
  }
}
