"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Clock } from "lucide-react";
import { useSession } from "next-auth/react";

interface Approval {
  id: string;
  type: string;
  status: string;
  reason: string | null;
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

export default function StaffApprovalsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "card_extension",
    target_id: "",
    reason: "",
  });

  const fetchApprovals = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/approvals?applicant_id=${userId}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setApprovals(json.data);
    } catch {
      toast.error("获取审批记录失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleSubmit = async () => {
    if (!form.target_id.trim()) {
      toast.error("请输入关联 ID");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "提交失败");
        return;
      }
      toast.success("审批已提交");
      setDialogOpen(false);
      setForm({ type: "card_extension", target_id: "", reason: "" });
      fetchApprovals();
    } catch {
      toast.error("提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">我的审批</h1>
        <Button size="sm" className="gap-1" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          提交审批
        </Button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">加载中...</div>
      ) : approvals.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">暂无审批记录</div>
      ) : (
        <div className="space-y-3">
          {approvals.map((a) => (
            <Card key={a.id} size="sm">
              <CardContent>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{typeMap[a.type] || a.type}</Badge>
                      <Badge className={statusColors[a.status] || ""}>
                        {statusLabels[a.status] || a.status}
                      </Badge>
                    </div>
                    {a.reason && (
                      <p className="text-sm text-muted-foreground">{a.reason}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {a.createdAt
                        ? new Date(a.createdAt).toLocaleString("zh-CN")
                        : "-"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提交审批</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>类型</Label>
              <Select
                value={form.type}
                onValueChange={(val) => setForm({ ...form, type: val || "card_extension" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card_extension">次卡延期</SelectItem>
                  <SelectItem value="phone_change">更换手机号</SelectItem>
                  <SelectItem value="refund">退款</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>关联 ID *</Label>
              <Input
                placeholder="次卡/客户/订单 ID"
                value={form.target_id}
                onChange={(e) => setForm({ ...form, target_id: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>原因</Label>
              <Textarea
                placeholder="请描述申请原因"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "提交"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
