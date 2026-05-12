"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface Approval {
  id: string;
  type: string;
  status: string;
  reason: string | null;
  targetId: string;
  createdAt: string | null;
  applicantName: string | null;
  reviewerName: string | null;
}

const typeMap: Record<string, string> = {
  card_extension: "次卡延期",
  phone_change: "更换手机号",
  refund: "退款",
};

const statusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  approved: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusLabels: Record<string, string> = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已拒绝",
};

export default function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [operating, setOperating] = useState<string | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/approvals");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setApprovals(json.data);
    } catch {
      toast.error("获取审批列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setOperating(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "操作失败");
        return;
      }
      toast.success(action === "approve" ? "已通过" : "已拒绝");
      fetchApprovals();
    } catch {
      toast.error("操作失败");
    } finally {
      setOperating(null);
    }
  };

  const filtered = approvals.filter((a) => {
    if (tab === "pending") return a.status === "pending";
    if (tab === "processed") return a.status !== "pending";
    return true;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">审批管理</h1>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList>
          <TabsTrigger value="pending">
            待审批 ({approvals.filter((a) => a.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="processed">已处理</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              暂无{tab === "pending" ? "待审批" : "已处理"}记录
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <Card key={a.id} size="sm">
                  <CardContent>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant="secondary">{typeMap[a.type] || a.type}</Badge>
                          <Badge className={statusColors[a.status] || ""}>
                            {statusLabels[a.status] || a.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">
                          申请人：{a.applicantName || "未知"}
                        </p>
                        {a.reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            原因：{a.reason}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleString("zh-CN")
                            : "-"}
                        </div>
                        {a.reviewerName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            审批人：{a.reviewerName}
                          </p>
                        )}
                      </div>
                      {a.status === "pending" && (
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button
                            size="sm"
                            className="gap-1"
                            disabled={operating === a.id}
                            onClick={() => handleAction(a.id, "approve")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={operating === a.id}
                            onClick={() => handleAction(a.id, "reject")}
                          >
                            <XCircle className="h-4 w-4" />
                            拒绝
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
