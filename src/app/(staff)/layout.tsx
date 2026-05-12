"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SessionProvider } from "next-auth/react";
import { LayoutDashboard, ClipboardList, ScanLine, User } from "lucide-react";

const tabs = [
  { label: "工作台", icon: LayoutDashboard, path: "/staff" },
  { label: "订单", icon: ClipboardList, path: "/staff/orders" },
  { label: "核销", icon: ScanLine, path: "/staff/verify" },
  { label: "我的", icon: User, path: "/staff/profile" },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SessionProvider>
      <div className="mx-auto w-full md:max-w-md min-h-screen flex flex-col bg-background">
        <main className="flex-1 pb-20">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
          <div className="mx-auto md:max-w-md flex">
            {tabs.map((tab) => {
              const isActive = pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </SessionProvider>
  );
}
