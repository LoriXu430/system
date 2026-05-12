"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
}

export default function NewCardPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer_id: "",
    service_id: "",
    name: "",
    total_times: "",
    total_amount: "",
    expire_date: "",
  });

  const searchCustomers = useCallback(async () => {
    if (!customerSearch.trim()) {
      setCustomers([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(customerSearch)}&pageSize=10`
      );
      if (!res.ok) return;
      const json = await res.json();
      setCustomers(json.data);
    } catch {
      /* ignore */
    }
  }, [customerSearch]);

  useEffect(() => {
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [searchCustomers]);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : json.data || [];
        setServicesList(list);
      })
      .catch(() => {});
  }, []);

  const selectedService = servicesList.find((s) => s.id === form.service_id);
  const selectedCustomer = customers.find((c) => c.id === form.customer_id);

  useEffect(() => {
    if (selectedService && !form.name) {
      setForm((prev) => ({
        ...prev,
        name: selectedService.name + "次卡",
      }));
    }
  }, [selectedService, form.name]);

  const handleSubmit = async () => {
    if (!form.customer_id) {
      toast.error("请选择客户");
      return;
    }
    if (!form.service_id) {
      toast.error("请选择服务项目");
      return;
    }
    if (!form.name.trim()) {
      toast.error("请输入次卡名称");
      return;
    }
    if (!form.total_times || Number(form.total_times) <= 0) {
      toast.error("请输入有效的总次数");
      return;
    }
    if (!form.total_amount || Number(form.total_amount) <= 0) {
      toast.error("请输入有效的总金额");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/frequency-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: form.customer_id,
          service_id: form.service_id,
          name: form.name,
          total_times: Number(form.total_times),
          total_amount: Number(form.total_amount),
          expire_date: form.expire_date || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "开单失败");
        return;
      }
      toast.success("次卡开单成功");
      router.push("/admin/cards");
    } catch {
      toast.error("开单失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1"
        onClick={() => router.push("/admin/cards")}
      >
        <ArrowLeft className="h-4 w-4" />
        返回次卡列表
      </Button>

      <h1 className="text-2xl font-bold">次卡开单</h1>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">次卡信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* 客户选择 */}
            <div className="grid gap-2">
              <Label>客户 *</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-sm">
                    {selectedCustomer.name} ({selectedCustomer.phone})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setForm({ ...form, customer_id: "" });
                      setCustomerSearch("");
                    }}
                  >
                    更换
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    placeholder="输入手机号搜索客户"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  {customers.length > 0 && !form.customer_id && (
                    <div className="mt-1 rounded-md border bg-popover shadow-md">
                      {customers.map((c) => (
                        <div
                          key={c.id}
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            setForm({ ...form, customer_id: c.id });
                            setCustomers([]);
                          }}
                        >
                          {c.name} ({c.phone})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 服务项目 */}
            <div className="grid gap-2">
              <Label>服务项目 *</Label>
              <Select
                value={form.service_id}
                onValueChange={(val) =>
                  setForm({ ...form, service_id: val as string, name: "" })
                }
              >
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

            {/* 次卡名称 */}
            <div className="grid gap-2">
              <Label>次卡名称 *</Label>
              <Input
                placeholder="例如：头皮护理次卡"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* 总次数 */}
            <div className="grid gap-2">
              <Label>总次数 *</Label>
              <Input
                type="number"
                placeholder="输入总次数"
                value={form.total_times}
                onChange={(e) =>
                  setForm({ ...form, total_times: e.target.value })
                }
              />
            </div>

            {/* 总金额 */}
            <div className="grid gap-2">
              <Label>总金额 *</Label>
              <Input
                type="number"
                placeholder="输入总金额"
                value={form.total_amount}
                onChange={(e) =>
                  setForm({ ...form, total_amount: e.target.value })
                }
              />
            </div>

            {/* 过期日期 */}
            <div className="grid gap-2">
              <Label>过期日期（可选）</Label>
              <Input
                type="date"
                value={form.expire_date}
                onChange={(e) =>
                  setForm({ ...form, expire_date: e.target.value })
                }
              />
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="mt-2">
              {submitting ? "提交中..." : "确认开单"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
