"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ScanLine, CheckCircle2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Staff {
  id: string;
  name: string;
}

interface VerifyResult {
  id: string;
  orderNo: string;
  channel: string;
  status: string;
  customerName: string;
  customerPhone: string;
  needComplete: boolean;
}

export default function StaffVerifyPage() {
  const [platform, setPlatform] = useState<"douyin" | "meituan">("douyin");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Staff[]>([]);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : json.data || [];
        setServicesList(list.filter((s: any) => s.status === "active"));
      })
      .catch(() => {});

    fetch("/api/staff?role=technician")
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : json.data || [];
        setTechnicians(list);
      })
      .catch(() => {});
  }, []);

  const handleVerify = async () => {
    if (!phone.trim()) {
      toast.error("请输入手机号");
      return;
    }
    if (!verificationCode.trim()) {
      toast.error("请输入券码");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          phone: phone.trim(),
          verification_code: verificationCode.trim(),
          service_id: serviceId || undefined,
          technician_id: technicianId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "核销失败");
        return;
      }
      toast.success("核销成功");
      setResult(json.data);
    } catch {
      toast.error("核销失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setPhone("");
    setVerificationCode("");
    setServiceId("");
    setTechnicianId("");
  };

  if (result) {
    return (
      <div className="px-4 pt-6">
        <div className="flex flex-col items-center py-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">核销成功</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">订单信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">订单号</span>
                <span className="font-medium">{result.orderNo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">平台</span>
                <Badge variant="secondary">
                  {result.channel === "douyin" ? "抖音" : "美团"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">客户</span>
                <span>{result.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">手机号</span>
                <span>{result.customerPhone}</span>
              </div>
              {result.needComplete && (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-yellow-700 dark:text-yellow-400 text-xs">
                  该订单暂未选择服务项目和手艺人，可在管理端订单详情中补充完善。
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button className="w-full mt-6" onClick={handleReset}>
          继续核销
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">
        <ScanLine className="inline h-5 w-5 mr-1" />
        第三方核销
      </h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {/* 平台选择 */}
            <div className="grid gap-2">
              <Label>平台</Label>
              <div className="flex gap-2">
                <Button
                  variant={platform === "douyin" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPlatform("douyin")}
                >
                  抖音
                </Button>
                <Button
                  variant={platform === "meituan" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setPlatform("meituan")}
                >
                  美团
                </Button>
              </div>
            </div>

            {/* 手机号 */}
            <div className="grid gap-2">
              <Label>手机号 *</Label>
              <Input
                type="tel"
                placeholder="请输入客户手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* 券码 */}
            <div className="grid gap-2">
              <Label>券码 *</Label>
              <Input
                placeholder="请输入核销码"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>

            {/* 可选：服务项目 */}
            <div className="grid gap-2">
              <Label>
                服务项目 <span className="text-xs text-muted-foreground">(可选)</span>
              </Label>
              <Select value={serviceId} onValueChange={(val) => setServiceId(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择服务项目" />
                </SelectTrigger>
                <SelectContent>
                  {servicesList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} (¥{s.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 可选：手艺人 */}
            <div className="grid gap-2">
              <Label>
                手艺人 <span className="text-xs text-muted-foreground">(可选)</span>
              </Label>
              <Select value={technicianId} onValueChange={(v) => setTechnicianId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择手艺人" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="mt-2"
              onClick={handleVerify}
              disabled={submitting}
            >
              {submitting ? "核销中..." : "一键核销"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
