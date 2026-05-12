"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Search, CreditCard } from "lucide-react";

interface FrequencyCard {
  id: string;
  customerId: string;
  serviceId: string;
  name: string;
  totalTimes: number;
  remainingTimes: number;
  totalAmount: number;
  status: string;
  expireDate: string | null;
  createdAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  serviceName: string | null;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "使用中", variant: "default" },
  expired: { label: "已过期", variant: "destructive" },
  exhausted: { label: "已用完", variant: "secondary" },
};

export default function CardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<FrequencyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // 升单 Dialog
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeCard, setUpgradeCard] = useState<FrequencyCard | null>(null);
  const [upgradeForm, setUpgradeForm] = useState({ additional_times: "", additional_amount: "" });
  const [upgrading, setUpgrading] = useState(false);

  // 延期 Dialog
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendCard, setExtendCard] = useState<FrequencyCard | null>(null);
  const [extendDate, setExtendDate] = useState("");
  const [extending, setExtending] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/frequency-cards?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCards(data);
    } catch {
      toast.error("获取次卡列表失败");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const filtered = cards.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (c.customerName?.toLowerCase().includes(s)) ||
      (c.customerPhone?.includes(s)) ||
      c.name.toLowerCase().includes(s)
    );
  });

  const handleUpgrade = async () => {
    if (!upgradeCard) return;
    if (!upgradeForm.additional_times || !upgradeForm.additional_amount) {
      toast.error("请填写增加的次数和金额");
      return;
    }
    setUpgrading(true);
    try {
      const res = await fetch(`/api/frequency-cards/${upgradeCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upgrade",
          additional_times: Number(upgradeForm.additional_times),
          additional_amount: Number(upgradeForm.additional_amount),
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "升单失败");
        return;
      }
      toast.success("升单成功");
      setUpgradeOpen(false);
      setUpgradeForm({ additional_times: "", additional_amount: "" });
      fetchCards();
    } catch {
      toast.error("升单失败");
    } finally {
      setUpgrading(false);
    }
  };

  const handleExtend = async () => {
    if (!extendCard || !extendDate) {
      toast.error("请选择新的过期日期");
      return;
    }
    setExtending(true);
    try {
      const res = await fetch(`/api/frequency-cards/${extendCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend",
          new_expire_date: extendDate,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "延期失败");
        return;
      }
      toast.success("延期成功");
      setExtendOpen(false);
      setExtendDate("");
      fetchCards();
    } catch {
      toast.error("延期失败");
    } finally {
      setExtending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">次卡管理</h1>
        <Button size="sm" className="gap-1" onClick={() => router.push("/admin/cards/new")}>
          <Plus className="h-4 w-4" />
          开次卡
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索客户或次卡名称"
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
            <SelectItem value="active">使用中</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
            <SelectItem value="exhausted">已用完</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 次卡列表 */}
      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">暂无数据</div>
        ) : (
          filtered.map((card) => {
            const st = statusMap[card.status] || { label: card.status, variant: "outline" as const };
            return (
              <Card key={card.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{card.name}</span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {card.customerName} ({card.customerPhone})
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-lg font-bold text-primary">
                        {card.remainingTimes}/{card.totalTimes}次
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ¥{card.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {card.expireDate ? `到期：${card.expireDate}` : "永久有效"}
                      {card.serviceName && ` · ${card.serviceName}`}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUpgradeCard(card);
                          setUpgradeOpen(true);
                        }}
                      >
                        升单
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExtendCard(card);
                          setExtendDate(card.expireDate || "");
                          setExtendOpen(true);
                        }}
                      >
                        延期
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 升单 Dialog */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>次卡升单 - {upgradeCard?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>增加次数</Label>
              <Input
                type="number"
                placeholder="输入增加的次数"
                value={upgradeForm.additional_times}
                onChange={(e) =>
                  setUpgradeForm({ ...upgradeForm, additional_times: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>增加金额</Label>
              <Input
                type="number"
                placeholder="输入增加的金额"
                value={upgradeForm.additional_amount}
                onChange={(e) =>
                  setUpgradeForm({ ...upgradeForm, additional_amount: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? "提交中..." : "确认升单"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 延期 Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>次卡延期 - {extendCard?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>新过期日期</Label>
              <Input
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleExtend} disabled={extending}>
              {extending ? "提交中..." : "确认延期"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
