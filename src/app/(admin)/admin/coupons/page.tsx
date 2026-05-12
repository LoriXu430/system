"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Ticket } from "lucide-react";

interface Coupon {
  id: string;
  customerId: string | null;
  name: string;
  type: string;
  value: number;
  minAmount: number | null;
  serviceId: string | null;
  status: string;
  expireDate: string;
  createdAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  serviceName: string | null;
}

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

const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  discount: { label: "折扣券", variant: "default" },
  fixed: { label: "满减券", variant: "secondary" },
  free_service: { label: "免单券", variant: "outline" },
};

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available: { label: "可用", variant: "default" },
  used: { label: "已使用", variant: "secondary" },
  expired: { label: "已过期", variant: "destructive" },
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // 发放 Dialog
  const [issueOpen, setIssueOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [issueForm, setIssueForm] = useState({
    customer_id: "",
    name: "",
    type: "fixed",
    value: "",
    min_amount: "",
    service_id: "",
    expire_date: "",
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/coupons?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCoupons(data);
    } catch {
      toast.error("获取优惠券列表失败");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : json.data || [];
        setServicesList(list);
      })
      .catch(() => {});
  }, []);

  const searchCustomersHandler = useCallback(async () => {
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
    const timer = setTimeout(searchCustomersHandler, 300);
    return () => clearTimeout(timer);
  }, [searchCustomersHandler]);

  const filtered = coupons.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (c.customerName?.toLowerCase().includes(s)) ||
      (c.customerPhone?.includes(s)) ||
      c.name.toLowerCase().includes(s)
    );
  });

  const selectedCustomer = customers.find((c) => c.id === issueForm.customer_id);

  const handleIssue = async () => {
    if (!issueForm.customer_id) {
      toast.error("请选择客户");
      return;
    }
    if (!issueForm.name.trim()) {
      toast.error("请输入优惠券名称");
      return;
    }
    if (!issueForm.value || Number(issueForm.value) <= 0) {
      toast.error("请输入有效的面值");
      return;
    }
    if (!issueForm.expire_date) {
      toast.error("请选择过期日期");
      return;
    }

    setIssuing(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: issueForm.customer_id,
          name: issueForm.name,
          type: issueForm.type,
          value: Number(issueForm.value),
          min_amount: issueForm.min_amount ? Number(issueForm.min_amount) : undefined,
          service_id: issueForm.service_id && issueForm.service_id !== "none" ? issueForm.service_id : undefined,
          expire_date: issueForm.expire_date,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "发放失败");
        return;
      }
      toast.success("优惠券发放成功");
      setIssueOpen(false);
      setIssueForm({ customer_id: "", name: "", type: "fixed", value: "", min_amount: "", service_id: "", expire_date: "" });
      setCustomerSearch("");
      fetchCoupons();
    } catch {
      toast.error("发放失败");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">优惠券管理</h1>
        <Button size="sm" className="gap-1" onClick={() => setIssueOpen(true)}>
          <Plus className="h-4 w-4" />
          发放优惠券
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索客户或优惠券名称"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? "")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="available">可用</SelectItem>
            <SelectItem value="used">已使用</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 优惠券列表 */}
      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">暂无数据</div>
        ) : (
          filtered.map((coupon) => {
            const tp = typeMap[coupon.type] || { label: coupon.type, variant: "outline" as const };
            const st = statusMap[coupon.status] || { label: coupon.status, variant: "outline" as const };
            return (
              <Card key={coupon.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <Ticket className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{coupon.name}</span>
                          <Badge variant={tp.variant}>{tp.label}</Badge>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {coupon.customerName} ({coupon.customerPhone})
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-lg font-bold text-orange-600">
                        {coupon.type === "discount"
                          ? `${coupon.value}折`
                          : `¥${coupon.value}`}
                      </div>
                      {coupon.minAmount && (
                        <div className="text-xs text-muted-foreground">
                          满¥{coupon.minAmount}可用
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    到期：{coupon.expireDate}
                    {coupon.serviceName && ` · 限${coupon.serviceName}`}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 发放优惠券 Dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发放优惠券</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
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
                      setIssueForm({ ...issueForm, customer_id: "" });
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
                  {customers.length > 0 && !issueForm.customer_id && (
                    <div className="mt-1 rounded-md border bg-popover shadow-md max-h-40 overflow-y-auto">
                      {customers.map((c) => (
                        <div
                          key={c.id}
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            setIssueForm({ ...issueForm, customer_id: c.id });
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

            <div className="grid gap-2">
              <Label>优惠券名称 *</Label>
              <Input
                placeholder="例如：新客满减券"
                value={issueForm.name}
                onChange={(e) => setIssueForm({ ...issueForm, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>类型 *</Label>
              <Select
                value={issueForm.type}
                onValueChange={(val) => setIssueForm({ ...issueForm, type: val || "fixed" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">折扣券</SelectItem>
                  <SelectItem value="fixed">满减券</SelectItem>
                  <SelectItem value="free_service">免单券</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>{issueForm.type === "discount" ? "折扣（如 8.5 表示八五折）" : "面值"} *</Label>
              <Input
                type="number"
                placeholder={issueForm.type === "discount" ? "例如 8.5" : "例如 50"}
                value={issueForm.value}
                onChange={(e) => setIssueForm({ ...issueForm, value: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>最低消费金额（可选）</Label>
              <Input
                type="number"
                placeholder="满多少可用"
                value={issueForm.min_amount}
                onChange={(e) => setIssueForm({ ...issueForm, min_amount: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>限定服务项目（可选）</Label>
              <Select
                value={issueForm.service_id}
                onValueChange={(val) => setIssueForm({ ...issueForm, service_id: val ?? "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="不限" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不限</SelectItem>
                  {servicesList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>过期日期 *</Label>
              <Input
                type="date"
                value={issueForm.expire_date}
                onChange={(e) => setIssueForm({ ...issueForm, expire_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleIssue} disabled={issuing}>
              {issuing ? "发放中..." : "确认发放"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
