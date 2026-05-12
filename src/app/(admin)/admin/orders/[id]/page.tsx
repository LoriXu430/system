"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Ban, RotateCcw } from "lucide-react";

interface OrderDetail {
  id: string;
  orderNo: string;
  type: string;
  customerId: string;
  staffId: string | null;
  technicianId: string | null;
  serviceId: string | null;
  amount: number;
  actualAmount: number;
  paymentMethod: string;
  channel: string;
  verificationCode: string | null;
  status: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  technicianName: string | null;
  staffName: string | null;
  serviceName: string | null;
}

const typeMap: Record<string, string> = {
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

const paymentMethodMap: Record<string, string> = {
  cash: "现金",
  wechat: "微信",
  alipay: "支付宝",
  balance: "余额",
  frequency_card: "次卡",
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [operating, setOperating] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setOrder(json.data);
    } catch {
      toast.error("获取订单详情失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (newStatus: "cancelled" | "refunded") => {
    setOperating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "操作失败");
        return;
      }
      toast.success(newStatus === "cancelled" ? "订单已取消" : "订单已退款");
      setCancelOpen(false);
      setRefundOpen(false);
      fetchOrder();
    } catch {
      toast.error("操作失败");
    } finally {
      setOperating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground">加载中...</div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center text-muted-foreground">订单不存在</div>
    );
  }

  const canOperate = !["cancelled", "refunded"].includes(order.status);

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

      {/* 订单基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">订单信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">订单号</span>
              <span className="font-medium">{order.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">类型</span>
              <span>{typeMap[order.type] || order.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">状态</span>
              <Badge className={statusClassName(order.status)}>
                {statusMap[order.status] || order.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">金额</span>
              <span>¥{order.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">实付</span>
              <span className="font-semibold">¥{order.actualAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">支付方式</span>
              <span>{paymentMethodMap[order.paymentMethod] || order.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">渠道</span>
              <Badge className={channelClassName(order.channel)}>
                {channelMap[order.channel] || order.channel}
              </Badge>
            </div>
            {order.verificationCode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">核销码</span>
                <span>{order.verificationCode}</span>
              </div>
            )}
            {order.notes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">备注</span>
                <span className="text-right max-w-[60%]">{order.notes}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 客户信息 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">客户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">客户姓名</span>
              <span>{order.customerName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">手机号</span>
              <span>{order.customerPhone || "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 服务信息 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">服务信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">服务项目</span>
              <span>{order.serviceName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">手艺人</span>
              <span>{order.technicianName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">开单人</span>
              <span>{order.staffName || "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 时间信息 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">时间信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">创建时间</span>
              <span>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString("zh-CN")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">更新时间</span>
              <span>
                {order.updatedAt
                  ? new Date(order.updatedAt).toLocaleString("zh-CN")
                  : "-"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作区 */}
      {canOperate && (
        <div className="mt-6 flex gap-3">
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" className="flex-1 gap-1">
                  <Ban className="h-4 w-4" />
                  取消订单
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认取消订单</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                确定要取消订单 {order.orderNo} 吗？此操作不可撤销。
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(false)}
                >
                  返回
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange("cancelled")}
                  disabled={operating}
                >
                  {operating ? "处理中..." : "确认取消"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
            <DialogTrigger
              render={
                <Button variant="outline" className="flex-1 gap-1">
                  <RotateCcw className="h-4 w-4" />
                  退款
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认退款</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                确定要对订单 {order.orderNo} 进行退款吗？退款金额：¥{order.actualAmount.toFixed(2)}。此操作不可撤销。
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRefundOpen(false)}
                >
                  返回
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange("refunded")}
                  disabled={operating}
                >
                  {operating ? "处理中..." : "确认退款"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
