import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { staffServices, services } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;

  const linked = await db
    .select({
      id: services.id,
      name: services.name,
      price: services.price,
      duration: services.duration,
      category: services.category,
      status: services.status,
    })
    .from(staffServices)
    .innerJoin(services, eq(staffServices.serviceId, services.id))
    .where(eq(staffServices.staffId, id));

  return NextResponse.json(linked);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { serviceIds } = body as { serviceIds: string[] };

  if (!Array.isArray(serviceIds)) {
    return NextResponse.json({ error: "serviceIds 必须是数组" }, { status: 400 });
  }

  // 先删除旧关联
  await db.delete(staffServices).where(eq(staffServices.staffId, id));

  // 插入新关联
  if (serviceIds.length > 0) {
    await db.insert(staffServices).values(
      serviceIds.map((serviceId) => ({
        staffId: id,
        serviceId,
      }))
    );
  }

  return NextResponse.json({ success: true });
}
