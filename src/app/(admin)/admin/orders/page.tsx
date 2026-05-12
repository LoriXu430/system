"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight, Plus, FileText } from "lucide-react";

interface OrderItem {
  id: string;
  orderNo: string;
  type: string;
  amount: number;
  actualAmount: number;
  channel: string;
  status: string;
  customerName: string | null;
  createdAt: string | null;
}

const typeTabMap: Record<string, string> = {
  service: "项目订单",
  frequency_card: "次卡订单",
  recharge: "充值订单",
  product: "商品订单",
};

const channelMap: Record<string, string> = {
  store: "门店",
  douyin: "抖音",
  meituan: "美团",
  kuaishou: "快手",
  tmall: "天猫",
};

const statusMap: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

function channelClassName(channel: string): string {
  switch (channel) {
    case "store":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "douyin":
      return "bg-gray-900 text-white dark:bg-gray-700 dark:text-gray-100";
    case "meituan":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    case "kuaishou":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
    case "tmall":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    default:
      return "";
  }
}

function statusClassName(status: string): string {
  switch (status) {
    case "pending":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
    case "paid":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    case "completed":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    case "refunded":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
    default:
      return "";
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const [activeType, setActiveType] = useState("service");
  const [ordersList, setOrdersList] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        type: activeType,
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setOrdersList(json.data);
      setTotal(json.total);
    } catch {
      toast.error("获取订单列表失败");
    } finally {
      setLoading(false);
    }
  }, [page, search, activeType]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTabChange = (value: string | number | null) => {
    if (value && typeof value === "string") {
      setActiveType(value);
      setPage(1);
      setSearch("");
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">订单管理</h1>
        <Button
          size="sm"
          className="gap-1"
          onClick={() => router.push("/admin/orders/supplement")}
        >
          <Plus className="h-4 w-4" />
          补单
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索订单号"
          className="pl-9"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeType} onValueChange={handleTabChange} className="mt-4">
        <TabsList className="w-full">
          {Object.entries(typeTabMap).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(typeTabMap).map((typeKey) => (
          <TabsContent key={typeKey} value={typeKey} className="mt-4">
            {loading ? (
              <div className="py-20 text-center text-muted-foreground">
                加载中...
              </div>
            ) : ordersList.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                暂无数据
              </div>
            ) : (
              <div className="grid gap-3">
                {ordersList.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium truncate">
                              {order.orderNo}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {order.customerName || "未知客户"}
                          </div>
                          {order.createdAt && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString("zh-CN")}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                          <span className="font-semibold">
                            ¥{order.actualAmount.toFixed(2)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              className={channelClassName(order.channel)}
                            >
                              {channelMap[order.channel] || order.channel}
                            </Badge>
                            <Badge
                              className={statusClassName(order.status)}
                            >
                              {statusMap[order.status] || order.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
