import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { orders, customers } from "@/lib/db/schema";
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
  return "V" + date + rand;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const body = await request.json();
  const {
    platform,
    phone,
    verification_code,
    service_id,
    staff_id,
    technician_id,
  } = body;

  if (!platform || !["douyin", "meituan"].includes(platform)) {
    return NextResponse.json({ error: "平台参数无效" }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "手机号必填" }, { status: 400 });
  }
  if (!verification_code) {
    return NextResponse.json({ error: "核销码必填" }, { status: 400 });
  }

  try {
    // 查找或创建客户
    let customer = await db.query.customers.findFirst({
      where: eq(customers.phone, phone),
    });

    if (!customer) {
      const result = await db
        .insert(customers)
        .values({
          name: "核销客户_" + phone.slice(-4),
          phone,
          storeId: (session.user as any).storeId || null,
        })
        .returning();
      customer = result[0];
    }

    // 判断订单状态：如果没有服务和手艺人，pending（先核销再完善）
    const needComplete = !service_id && !technician_id;
    const orderStatus = needComplete ? "pending" : "paid";

    const result = await db
      .insert(orders)
      .values({
        orderNo: generateOrderNo(),
        type: "service",
        customerId: customer.id,
        staffId: staff_id || (session.user as any).id || null,
        technicianId: technician_id || null,
        serviceId: service_id || null,
        amount: 0,
        actualAmount: 0,
        paymentMethod: "wechat",
        channel: platform,
        verificationCode: verification_code,
        status: orderStatus,
        storeId: (session.user as any).storeId || null,
        notes: needComplete ? "第三方核销，待完善信息" : "第三方核销",
      })
      .returning();

    return NextResponse.json({
      data: {
        ...result[0],
        customerName: customer.name,
        customerPhone: customer.phone,
        needComplete,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "核销失败: " + (error?.message || "") },
      { status: 500 }
    );
  }
}
