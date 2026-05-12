"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string | null;
  serviceName: string | null;
  servicePrice: number | null;
  staffName: string | null;
  createdAt: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  in_service: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  completed: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "待服务",
  confirmed: "已确认",
  in_service: "服务中",
  completed: "已完成",
  cancelled: "已取消",
};

export default function OrdersPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => setAppointments(data))
      .catch(() => toast.error("加载失败"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <h1 className="text-xl font-bold">我的预约</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm mb-4">暂无预约记录</p>
          <Link href="/user/booking">
            <Button>去预约</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id} size="sm">
              <CardContent>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{apt.serviceName || "未知项目"}</span>
                      <Badge className={statusColors[apt.status] || ""}>
                        {statusLabels[apt.status] || apt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      手艺人：{apt.staffName || "-"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {apt.date} {apt.startTime}-{apt.endTime}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-medium text-primary">
                      ¥{apt.servicePrice ?? "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
