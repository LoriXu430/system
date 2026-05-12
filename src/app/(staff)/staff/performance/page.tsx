"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

interface OrderItem {
  id: string;
  orderNo: string;
  type: string;
  amount: number;
  actualAmount: number;
  status: string;
  createdAt: string | null;
  customerName: string | null;
  serviceName: string | null;
}

const typeMap: Record<string, string> = {
  service: "项目",
  frequency_card: "次卡",
  recharge: "充值",
  product: "商品",
};

const statusMap: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

export default function StaffPerformancePage() {
  const { data: session } = useSession();
  const staffId = (session?.user as any)?.id;

  const [monthOrders, setMonthOrders] = useState(0);
  const [monthAmount, setMonthAmount] = useState(0);
  const [monthCommission, setMonthCommission] = useState(0);
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      const [staffRes, ordersRes] = await Promise.all([
        fetch(
          `/api/reports?type=staff&staff_id=${staffId}&start_date=${monthStart}&end_date=${monthEnd}`
        ),
        fetch(`/api/orders?pageSize=10`),
      ]);

      if (staffRes.ok) {
        const json = await staffRes.json();
        const myData = json.data?.[0];
        if (myData) {
          setMonthOrders(myData.count);
          setMonthAmount(myData.amount);
          setMonthCommission(myData.commission);
        }
      }

      if (ordersRes.ok) {
        const json = await ordersRes.json();
        setRecentOrders(json.data || []);
      }
    } catch {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="px-4 pt-6">
        <div className="py-20 text-center text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">我的业绩</h1>

      {/* 本月概览 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <ShoppingCart className="mx-auto h-6 w-6 text-blue-500 mb-1" />
            <p className="text-xs text-muted-foreground">本月订单</p>
            <p className="text-xl font-bold">{monthOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <DollarSign className="mx-auto h-6 w-6 text-green-500 mb-1" />
            <p className="text-xs text-muted-foreground">总金额</p>
            <p className="text-xl font-bold">¥{monthAmount.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-purple-500 mb-1" />
            <p className="text-xs text-muted-foreground">提成</p>
            <p className="text-xl font-bold">¥{monthCommission.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 最近订单 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">最近订单</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无订单</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {typeMap[o.type] || o.type}
                      </Badge>
                      <span className="text-sm font-medium">
                        {o.customerName || o.orderNo}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleString("zh-CN")
                        : "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">¥{o.actualAmount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {statusMap[o.status] || o.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
