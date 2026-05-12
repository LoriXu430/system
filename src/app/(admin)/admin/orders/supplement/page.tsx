"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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

interface Staff {
  id: string;
  name: string;
}

export default function SupplementOrderPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Staff[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customer_id: "",
    service_id: "",
    technician_id: "",
    amount: "",
    actual_amount: "",
    channel: "store",
    verification_code: "",
    payment_method: "cash",
    notes: "",
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

  useEffect(() => {
    fetch("/api/staff?role=technician")
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : json.data || [];
        setTechnicians(list);
      })
      .catch(() => {});
  }, []);

  const selectedService = servicesList.find((s) => s.id === form.service_id);

  useEffect(() => {
    if (selectedService) {
      setForm((prev) => ({
        ...prev,
        amount: String(selectedService.price),
        actual_amount: String(selectedService.price),
      }));
    }
  }, [selectedService]);

  const showVerificationCode = ["douyin", "meituan"].includes(form.channel);

  const handleSubmit = async () => {
    if (!form.customer_id) {
      toast.error("请选择客户");
      return;
    }
    if (!form.amount || !form.actual_amount) {
      toast.error("请输入金额");
      return;
    }

    setSubmitting(true);
    try {
      // 余额支付时先扣减余额
      if (form.payment_method === "balance") {
        const deductRes = await fetch("/api/balance/deduct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: form.customer_id,
            amount: Number(form.actual_amount),
          }),
        });
        if (!deductRes.ok) {
          const deductJson = await deductRes.json();
          toast.error(deductJson.error || "余额扣减失败");
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service",
          customer_id: form.customer_id,
          service_id: form.service_id || undefined,
          technician_id: form.technician_id || undefined,
          amount: Number(form.amount),
          actual_amount: Number(form.actual_amount),
          channel: form.channel,
          verification_code: form.verification_code || undefined,
          payment_method: form.payment_method,
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "创建失败");
        return;
      }
      toast.success("补单成功");
      router.push("/admin/orders");
    } catch {
      toast.error("创建失败");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === form.customer_id);

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1"
        onClick={() => router.push("/admin/orders")}
      >
        <ArrowLeft className="h-4 w-4" />
        返回订单列表
      </Button>

      <h1 className="text-2xl font-bold">补单</h1>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">订单信息</CardTitle>
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
                  {customers.length > 0 && (
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
              <Label>服务项目</Label>
              <Select
                value={form.service_id}
                onValueChange={(val) =>
                  setForm({ ...form, service_id: val as string })
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

            {/* 手艺人 */}
            <div className="grid gap-2">
              <Label>手艺人</Label>
              <Select
                value={form.technician_id}
                onValueChange={(val) =>
                  setForm({ ...form, technician_id: val as string })
                }
              >
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

            {/* 金额 */}
            <div className="grid gap-2">
              <Label>金额 *</Label>
              <Input
                type="number"
                placeholder="订单金额"
                value={form.amount}
                onChange={(e) =>
                  setForm({ ...form, amount: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>实付金额 *</Label>
              <Input
                type="number"
                placeholder="实际支付金额"
                value={form.actual_amount}
                onChange={(e) =>
                  setForm({ ...form, actual_amount: e.target.value })
                }
              />
            </div>

            {/* 渠道 */}
            <div className="grid gap-2">
              <Label>渠道</Label>
              <Select
                value={form.channel}
                onValueChange={(val) =>
                  setForm({ ...form, channel: val as string })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">门店</SelectItem>
                  <SelectItem value="douyin">抖音</SelectItem>
                  <SelectItem value="meituan">美团</SelectItem>
                  <SelectItem value="kuaishou">快手</SelectItem>
                  <SelectItem value="tmall">天猫</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 核销码 */}
            {showVerificationCode && (
              <div className="grid gap-2">
                <Label>核销码</Label>
                <Input
                  placeholder="输入核销码"
                  value={form.verification_code}
                  onChange={(e) =>
                    setForm({ ...form, verification_code: e.target.value })
                  }
                />
              </div>
            )}

            {/* 支付方式 */}
            <div className="grid gap-2">
              <Label>支付方式</Label>
              <Select
                value={form.payment_method}
                onValueChange={(val) =>
                  setForm({ ...form, payment_method: val as string })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">现金</SelectItem>
                  <SelectItem value="wechat">微信</SelectItem>
                  <SelectItem value="alipay">支付宝</SelectItem>
                  <SelectItem value="balance">余额</SelectItem>
                  <SelectItem value="frequency_card">次卡</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 备注 */}
            <div className="grid gap-2">
              <Label>备注</Label>
              <Textarea
                placeholder="备注信息（选填）"
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
              />
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="mt-2">
              {submitting ? "提交中..." : "提交补单"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
