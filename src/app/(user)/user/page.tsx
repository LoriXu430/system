"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Clock, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string | null;
  description: string | null;
}

export default function UserHomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/services?status=active")
      .then((r) => r.json())
      .then((data) => setServices(data))
      .catch(() => toast.error("加载失败"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-6">
      {/* 门店信息 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">头道汤</h1>
        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>欢迎来到头道汤，探索我们的服务吧！</span>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="flex gap-3 mb-6">
        <Link href="/user/booking" className="flex-1">
          <Button className="w-full">立即预约</Button>
        </Link>
        <Link href="/user/orders" className="flex-1">
          <Button variant="outline" className="w-full">我的订单</Button>
        </Link>
      </div>

      {/* 热门服务 */}
      <div className="mb-3">
        <h2 className="text-base font-bold">热门服务</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          暂无服务项目
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <Link key={service.id} href={`/user/booking?service=${service.id}`}>
              <Card size="sm" className="mb-3">
                <CardContent className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{service.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-medium text-primary">
                        ¥{service.price}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {service.duration}分钟
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
