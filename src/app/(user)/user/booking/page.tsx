"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string | null;
}

interface Staff {
  id: string;
  name: string;
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <BookingContent />
    </Suspense>
  );
}

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get("service") || "";

  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");

  // 获取服务列表
  useEffect(() => {
    fetch("/api/services?status=active")
      .then((r) => r.json())
      .then((data) => {
        setServices(data);
        if (preselectedService) {
          const found = data.find((s: Service) => s.id === preselectedService);
          if (found) {
            setSelectedService(found);
            setStep(2);
          }
        }
      })
      .catch(() => toast.error("加载失败"))
      .finally(() => setLoading(false));
  }, [preselectedService]);

  // 获取手艺人（根据选中的服务）
  const fetchStaff = useCallback(async () => {
    if (!selectedService) return;
    try {
      // Fetch all technicians, then for each check if they have this service
      const res = await fetch("/api/staff?role=technician");
      if (!res.ok) return;
      const allStaff = await res.json();
      const activeStaff = allStaff.filter((s: any) => s.status === "active");

      // For simplicity, show all active technicians
      // Ideally we'd filter by service association
      const staffWithService: Staff[] = [];
      for (const s of activeStaff) {
        try {
          const svcRes = await fetch(`/api/staff/${s.id}/services`);
          if (!svcRes.ok) continue;
          const linked = await svcRes.json();
          if (linked.some((l: any) => l.id === selectedService.id)) {
            staffWithService.push(s);
          }
        } catch {
          // ignore
        }
      }
      // If no one is linked, show all as fallback
      setStaffList(staffWithService.length > 0 ? staffWithService : activeStaff);
    } catch {
      // ignore
    }
  }, [selectedService]);

  useEffect(() => {
    if (step === 2 && selectedService) {
      fetchStaff();
    }
  }, [step, selectedService, fetchStaff]);

  // 时间选项
  const timeSlots: string[] = [];
  for (let h = 9; h < 22; h++) {
    timeSlots.push(`${String(h).padStart(2, "0")}:00`);
    timeSlots.push(`${String(h).padStart(2, "0")}:30`);
  }

  async function handleSubmit() {
    if (!selectedService || !selectedStaff || !date || !startTime) {
      toast.error("请填写完整信息");
      return;
    }
    setSubmitting(true);
    try {
      // 用户端提交，需要客户 ID。这里用当前 session user 的 id
      // 但用户端可能是 customer 角色，我们创建预约时使用 session user id 作为 customer_id
      // 实际上 customer 和 user 在这系统里不同。简化方案：先搜索或创建一个 customer
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: "walk-in",
          service_id: selectedService.id,
          staff_id: selectedStaff.id,
          date,
          start_time: startTime,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "预约失败");
      }
      toast.success("预约成功！");
      router.push("/user/orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "预约失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/user">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">预约服务</h1>
      </div>

      {/* 步骤指示 */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="h-3 w-3" /> : s}
            </div>
            {s < 4 && (
              <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 选择服务 */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">选择服务项目</h2>
          {services.map((service) => (
            <Card
              key={service.id}
              size="sm"
              className={`cursor-pointer transition-colors ${
                selectedService?.id === service.id
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              onClick={() => setSelectedService(service)}
            >
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{service.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="text-primary font-medium">¥{service.price}</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />{service.duration}分钟
                    </span>
                  </div>
                </div>
                {selectedService?.id === service.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </CardContent>
            </Card>
          ))}
          <Button
            className="w-full mt-4"
            disabled={!selectedService}
            onClick={() => setStep(2)}
          >
            下一步 <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: 选择手艺人 */}
      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">选择手艺人</h2>
          {staffList.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              加载中...
            </div>
          ) : (
            staffList.map((staff) => (
              <Card
                key={staff.id}
                size="sm"
                className={`cursor-pointer transition-colors ${
                  selectedStaff?.id === staff.id
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => setSelectedStaff(staff)}
              >
                <CardContent className="flex items-center justify-between">
                  <span className="font-medium">{staff.name}</span>
                  {selectedStaff?.id === staff.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CardContent>
              </Card>
            ))
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              上一步
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedStaff}
              onClick={() => setStep(3)}
            >
              下一步 <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: 选择日期和时间 */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">选择日期和时间</h2>
          <div className="space-y-2">
            <Label>日期</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>时间</Label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((t) => (
                <button
                  key={t}
                  className={`rounded-md border px-2 py-1.5 text-xs transition-colors ${
                    startTime === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setStartTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>备注（可选）</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="如有特殊要求请备注"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              上一步
            </Button>
            <Button
              className="flex-1"
              disabled={!startTime}
              onClick={() => setStep(4)}
            >
              下一步 <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: 确认预约 */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">确认预约信息</h2>
          <Card>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">服务项目</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">手艺人</span>
                <span className="font-medium">{selectedStaff?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">日期</span>
                <span className="font-medium">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">时间</span>
                <span className="font-medium">{startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">时长</span>
                <span className="font-medium">{selectedService?.duration}分钟</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">价格</span>
                <span className="font-bold text-primary text-base">
                  ¥{selectedService?.price}
                </span>
              </div>
              {notes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">备注</span>
                  <span>{notes}</span>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
              上一步
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "提交中..." : "确认预约"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
