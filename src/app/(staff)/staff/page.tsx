"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Clock } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string | null;
  serviceName: string | null;
  servicePrice: number | null;
  notes: string | null;
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

export default function StaffHomePage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("pending");
  const today = new Date().toISOString().split("T")[0];

  const staffId = (session?.user as any)?.id;

  const fetchAppointments = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/appointments?staff_id=${staffId}&date=${today}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAppointments(data);
    } catch {
      toast.error("获取预约列表失败");
    } finally {
      setLoading(false);
    }
  }, [staffId, today]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        status === "in_service"
          ? "已上钟"
          : status === "completed"
          ? "已下钟"
          : "已取消"
      );
      fetchAppointments();
    } catch {
      toast.error("操作失败");
    }
  }

  const filtered = appointments.filter((a) => {
    if (tab === "pending") return a.status === "pending" || a.status === "confirmed";
    if (tab === "in_service") return a.status === "in_service";
    if (tab === "completed") return a.status === "completed" || a.status === "cancelled";
    return true;
  });

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">工作台</h1>
          <p className="text-sm text-muted-foreground">今日：{today}</p>
        </div>
        <Link href="/staff/appointment/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            新建预约
          </Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={(val) => setTab(val as string)}>
        <TabsList className="w-full">
          <TabsTrigger value="pending">待服务</TabsTrigger>
          <TabsTrigger value="in_service">服务中</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
              暂无{tab === "pending" ? "待服务" : tab === "in_service" ? "服务中" : "已完成"}预约
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((apt) => (
                <Card key={apt.id} size="sm">
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{apt.customerName || "未知客户"}</span>
                          <Badge className={statusColors[apt.status] || ""}>
                            {statusLabels[apt.status] || apt.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{apt.serviceName}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {apt.startTime} - {apt.endTime}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {(apt.status === "pending" || apt.status === "confirmed") && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(apt.id, "in_service")}
                            >
                              上钟
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(apt.id, "cancelled")}
                            >
                              取消
                            </Button>
                          </>
                        )}
                        {apt.status === "in_service" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(apt.id, "completed")}
                          >
                            下钟
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
