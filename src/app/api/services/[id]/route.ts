import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
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

  const service = await db.query.services.findFirst({
    where: eq(services.id, id),
  });

  if (!service) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  return NextResponse.json(service);
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
  const { name, price, duration, category, description } = body;

  if (!name || price == null || !duration) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const [updated] = await db
    .update(services)
    .set({
      name,
      price: Number(price),
      duration: Number(duration),
      category: category || null,
      description: description || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(services.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const { id } = await params;

  const service = await db.query.services.findFirst({
    where: eq(services.id, id),
  });

  if (!service) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  const newStatus = service.status === "active" ? "inactive" : "active";

  const [updated] = await db
    .update(services)
    .set({
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(services.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const db = await getDb();

  const { id } = await params;

  const [deleted] = await db
    .delete(services)
    .where(eq(services.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
