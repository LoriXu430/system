"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const staffId = (session?.user as any)?.id || "";

  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    service_id: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/services?status=active")
      .then((r) => r.json())
      .then(setServicesList)
      .catch(() => {});
  }, []);

  async function searchCustomers(query: string) {
    if (!query.trim()) {
      setCustomerResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
      if (!res.ok) return;
      const data = await res.json();
      setCustomerResults(data.data || []);
    } catch {
      // ignore
    }
  }

  async function handleSubmit() {
    if (!selectedCustomer || !form.service_id || !form.date || !form.start_time) {
      toast.error("请填写完整信息");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          service_id: form.service_id,
          staff_id: staffId,
          date: form.date,
          start_time: form.start_time,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }
      toast.success("预约创建成功");
      router.push("/staff");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/staff">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">新建预约</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          {/* 搜索客户 */}
          <div className="space-y-2">
            <Label>客户（手机号搜索）</Label>
            <Input
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                searchCustomers(e.target.value);
              }}
              placeholder="输入手机号搜索客户"
            />
            {customerResults.length > 0 && !selectedCustomer && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {customerResults.map((c) => (
                  <div
                    key={c.id}
                    className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerSearch(`${c.name} (${c.phone})`);
                      setCustomerResults([]);
                    }}
                  >
                    {c.name} - {c.phone}
                  </div>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="text-xs text-muted-foreground">
                已选：{selectedCustomer.name} ({selectedCustomer.phone})
                <button
                  className="ml-2 text-primary underline"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch("");
                  }}
                >
                  重选
                </button>
              </div>
            )}
          </div>

          {/* 服务项目 */}
          <div className="space-y-2">
            <Label>服务项目</Label>
            <Select
              value={form.service_id}
              onValueChange={(val) =>
                setForm((f) => ({ ...f, service_id: val ?? "" }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择服务项目" />
              </SelectTrigger>
              <SelectContent>
                {servicesList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} (¥{s.price} / {s.duration}分钟)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 日期 */}
          <div className="space-y-2">
            <Label>日期</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((f) => ({ ...f, date: e.target.value }))
              }
            />
          </div>

          {/* 时间 */}
          <div className="space-y-2">
            <Label>开始时间</Label>
            <Input
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, start_time: e.target.value }))
              }
            />
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="可选"
              rows={2}
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={creating}>
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            {creating ? "提交中..." : "创建预约"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
