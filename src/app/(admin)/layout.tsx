"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession, SessionProvider } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  UserCheck,
  Scissors,
  Package,
  CreditCard,
  CalendarDays,
  Store,
  BarChart3,
  CheckSquare,
  Menu,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  { label: "仪表盘", icon: LayoutDashboard, path: "/admin" },
  { label: "手艺人面板", icon: Users, path: "/admin/panel" },
  { label: "订单管理", icon: ClipboardList, path: "/admin/orders" },
  { label: "客户管理", icon: UserCheck, path: "/admin/customers" },
  { label: "服务项目", icon: Scissors, path: "/admin/services" },
  { label: "商品管理", icon: Package, path: "/admin/products" },
  { label: "卡券管理", icon: CreditCard, path: "/admin/cards" },
  { label: "排班管理", icon: CalendarDays, path: "/admin/schedule" },
  { label: "员工管理", icon: Users, path: "/admin/staff" },
  { label: "门店设置", icon: Store, path: "/admin/store" },
  { label: "数据中心", icon: BarChart3, path: "/admin/reports" },
  { label: "审批管理", icon: CheckSquare, path: "/admin/approvals" },
];

function SidebarContent({ pathname }: { pathname: string }) {
  const { data: session } = useSession();

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <h1 className="text-lg font-bold">深圳头道汤科技</h1>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-1 p-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-4">
        <div className="mb-3 text-sm">
          <p className="font-medium truncate">{session?.user?.name ?? "用户"}</p>
          <p className="text-muted-foreground text-xs truncate">
            {session?.user?.role === "owner" ? "店主" : "管理员"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          退出登录
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        {/* PC 端侧边栏 */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r bg-card md:block">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* 移动端顶部 Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">导航菜单</SheetTitle>
              <div className="h-full" onClick={() => setOpen(false)}>
                <SidebarContent pathname={pathname} />
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-base font-bold">深圳头道汤科技</h1>
        </header>

        {/* 主内容区 */}
        <main className="min-h-screen md:ml-60">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </SessionProvider>
  );
}
