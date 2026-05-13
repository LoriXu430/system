import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const db = await getDb();

  const { id } = await params;

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.storeId, session.user.storeId)),
  });

  if (!user) {
    return NextResponse.json({ error: "员工不存在" }, { status: 404 });
  }

  const { passwordHash, ...safeUser } = user;
  return NextResponse.json(safeUser);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const db = await getDb();

  const { id } = await params;
  const body = await request.json();
  const { name, phone, role } = body;

  if (!name || !phone || !role) {
    return NextResponse.json({ error: "姓名、手机号、角色不能为空" }, { status: 400 });
  }

  // 检查手机号是否被其他用户占用
  const existing = await db.query.users.findFirst({
    where: eq(users.phone, phone),
  });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: "手机号已被其他用户使用" }, { status: 400 });
  }

  await db
    .update(users)
    .set({
      name,
      phone,
      role,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(users.id, id), eq(users.storeId, session.user.storeId)));

  const updated = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!updated) {
    return NextResponse.json({ error: "员工不存在" }, { status: 404 });
  }

  const { passwordHash, ...safeUser } = updated;
  return NextResponse.json(safeUser);
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const db = await getDb();

  const { id } = await params;

  const user = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.storeId, session.user.storeId)),
  });

  if (!user) {
    return NextResponse.json({ error: "员工不存在" }, { status: 404 });
  }

  const newStatus = user.status === "active" ? "disabled" : "active";

  await db
    .update(users)
    .set({
      status: newStatus,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(users.id, id));

  const { passwordHash, ...safeUser } = { ...user, status: newStatus };
  return NextResponse.json(safeUser);
}
