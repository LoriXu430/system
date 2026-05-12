"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Pencil, User, Phone } from "lucide-react";

interface FrequencyCard {
  id: string;
  name: string;
  totalTimes: number;
  remainingTimes: number;
  status: string;
  expireDate: string | null;
}

interface Coupon {
  id: string;
  name: string;
  type: string;
  value: number;
  status: string;
  expireDate: string;
}

interface Order {
  id: string;
  orderNo: string;
  type: string;
  amount: number;
  actualAmount: number;
  status: string;
  createdAt: string | null;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  gender: string | null;
  balance: number | null;
  notes: string | null;
  frequencyCards: FrequencyCard[];
  coupons: Coupon[];
  orders: Order[];
}

const orderTypeMap: Record<string, string> = {
  service: "服务",
  frequency_card: "次卡",
  recharge: "充值",
  product: "商品",
};

const orderStatusMap: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

const cardStatusMap: Record<string, string> = {
  active: "使用中",
  expired: "已过期",
  exhausted: "已用完",
};

const couponTypeMap: Record<string, string> = {
  discount: "折扣券",
  fixed: "满减券",
  free_service: "免单券",
};

const couponStatusMap: Record<string, string> = {
  available: "可用",
  used: "已使用",
  expired: "已过期",
};

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
    case "available":
    case "completed":
    case "paid":
      return "default";
    case "expired":
    case "cancelled":
    case "refunded":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    notes: "",
  });

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCustomer(json.data);
      setForm({
        name: json.data.name,
        phone: json.data.phone,
        gender: json.data.gender || "",
        notes: json.data.notes || "",
      });
    } catch {
      toast.error("获取客户信息失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("姓名和手机号必填");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "更新失败");
        return;
      }
      toast.success("更新成功");
      setEditing(false);
      fetchCustomer();
    } catch {
      toast.error("更新失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground">加载中...</div>
    );
  }

  if (!customer) {
    return (
      <div className="py-20 text-center text-muted-foreground">客户不存在</div>
    );
  }

  return (
    <div>
      {/* 返回按钮 */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-1"
        onClick={() => router.push("/admin/customers")}
      >
        <ArrowLeft className="h-4 w-4" />
        返回客户列表
      </Button>

      {/* 客户基本信息卡片 */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{customer.name}</span>
                {customer.gender && (
                  <Badge variant="secondary">{customer.gender}</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{customer.phone}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">余额</div>
            <div className="text-xl font-bold">
              ¥{(customer.balance ?? 0).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="cards" className="mt-6">
        <TabsList className="w-full">
          <TabsTrigger value="cards">次卡</TabsTrigger>
          <TabsTrigger value="coupons">优惠券</TabsTrigger>
          <TabsTrigger value="orders">订单记录</TabsTrigger>
          <TabsTrigger value="info">基本信息</TabsTrigger>
        </TabsList>

        {/* 次卡 Tab */}
        <TabsContent value="cards" className="mt-4">
          {customer.frequencyCards.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              暂无数据
            </div>
          ) : (
            <div className="grid gap-3">
              {customer.frequencyCards.map((card) => (
                <Card key={card.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{card.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          总次数 {card.totalTimes} / 剩余{" "}
                          <span className="font-semibold text-foreground">
                            {card.remainingTimes}
                          </span>{" "}
                          次
                        </div>
                        {card.expireDate && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            到期：{card.expireDate}
                          </div>
                        )}
                      </div>
                      <Badge variant={statusVariant(card.status)}>
                        {cardStatusMap[card.status] || card.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 优惠券 Tab */}
        <TabsContent value="coupons" className="mt-4">
          {customer.coupons.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              暂无数据
            </div>
          ) : (
            <div className="grid gap-3">
              {customer.coupons.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{coupon.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {couponTypeMap[coupon.type] || coupon.type}
                          {coupon.type === "discount"
                            ? ` ${coupon.value}折`
                            : ` ¥${coupon.value}`}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          到期：{coupon.expireDate}
                        </div>
                      </div>
                      <Badge variant={statusVariant(coupon.status)}>
                        {couponStatusMap[coupon.status] || coupon.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 订单记录 Tab */}
        <TabsContent value="orders" className="mt-4">
          {customer.orders.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              暂无数据
            </div>
          ) : (
            <div className="grid gap-3">
              {customer.orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">
                          {order.orderNo}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {orderTypeMap[order.type] || order.type}
                          </span>
                          <span>¥{order.actualAmount.toFixed(2)}</span>
                        </div>
                        {order.createdAt && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString("zh-CN")}
                          </div>
                        )}
                      </div>
                      <Badge variant={statusVariant(order.status)}>
                        {orderStatusMap[order.status] || order.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 基本信息 Tab */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">基本信息</CardTitle>
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  编辑
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>姓名</Label>
                  <Input
                    value={form.name}
                    disabled={!editing}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>手机号</Label>
                  <Input
                    value={form.phone}
                    disabled={!editing}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>性别</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(val) =>
                      setForm({ ...form, gender: val as string })
                    }
                    disabled={!editing}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="请选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="男">男</SelectItem>
                      <SelectItem value="女">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>备注</Label>
                  <Textarea
                    value={form.notes}
                    disabled={!editing}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
                {editing && (
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        if (customer) {
                          setForm({
                            name: customer.name,
                            phone: customer.phone,
                            gender: customer.gender || "",
                            notes: customer.notes || "",
                          });
                        }
                      }}
                    >
                      取消
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? "保存中..." : "保存"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
