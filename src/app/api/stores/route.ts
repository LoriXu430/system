import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { stores } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const db = await getDb();

  const store = await db.query.stores.findFirst({
    where: eq(stores.id, session.user.storeId),
  });

  if (!store) {
    return NextResponse.json({ error: "门店不存在" }, { status: 404 });
  }

  return NextResponse.json(store);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const db = await getDb();

  const body = await request.json();
  const { name, address, phone, businessHours } = body;

  if (!name) {
    return NextResponse.json({ error: "门店名称不能为空" }, { status: 400 });
  }

  await db
    .update(stores)
    .set({
      name,
      address: address || null,
      phone: phone || null,
      businessHours: businessHours || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(stores.id, session.user.storeId));

  const updated = await db.query.stores.findFirst({
    where: eq(stores.id, session.user.storeId),
  });

  return NextResponse.json(updated);
}
