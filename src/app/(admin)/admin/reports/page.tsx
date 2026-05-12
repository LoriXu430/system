"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Overview {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  todayOrders: number;
  todayCustomers: number;
}

interface ChannelData {
  channel: string;
  count: number;
  amount: number;
}

interface StaffData {
  staffId: string | null;
  staffName: string | null;
  count: number;
  amount: number;
  commission: number;
}

const channelNames: Record<string, string> = {
  store: "门店",
  douyin: "抖音",
  meituan: "美团",
  kuaishou: "快手",
  tmall: "天猫",
};

const channelColors: Record<string, string> = {
  store: "bg-blue-500",
  douyin: "bg-gray-800",
  meituan: "bg-yellow-500",
  kuaishou: "bg-orange-500",
  tmall: "bg-red-500",
};

export default function AdminReportsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [staffData, setStaffData] = useState<StaffData[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const dateParams = new URLSearchParams();
      if (startDate) dateParams.set("start_date", startDate);
      if (endDate) dateParams.set("end_date", endDate);
      const qs = dateParams.toString() ? `&${dateParams.toString()}` : "";

      const [ovRes, chRes, stRes] = await Promise.all([
        fetch("/api/reports?type=overview"),
        fetch(`/api/reports?type=channels${qs}`),
        fetch(`/api/reports?type=staff${qs}`),
      ]);

      if (ovRes.ok) {
        const json = await ovRes.json();
        setOverview(json.data);
      }
      if (chRes.ok) {
        const json = await chRes.json();
        setChannels(json.data);
      }
      if (stRes.ok) {
        const json = await stRes.json();
        setStaffData(json.data);
      }
    } catch {
      toast.error("获取报表数据失败");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalChannelAmount = channels.reduce((s, c) => s + c.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">数据中心</h1>
        <Link href="/admin/reports/staff" className="text-sm text-primary hover:underline">
          员工业绩详情 →
        </Link>
      </div>

      {/* 日期筛选 */}
      <div className="mt-4 flex gap-3 items-end">
        <div className="grid gap-1">
          <Label className="text-xs">开始日期</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="grid gap-1">
          <Label className="text-xs">结束日期</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">加载中...</div>
      ) : (
        <>
          {/* 营收概览 */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">今日营收</p>
                    <p className="text-2xl font-bold">¥{(overview?.todayRevenue || 0).toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">本周营收</p>
                    <p className="text-2xl font-bold">¥{(overview?.weekRevenue || 0).toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">本月营收</p>
                    <p className="text-2xl font-bold">¥{(overview?.monthRevenue || 0).toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">今日订单</p>
                    <p className="text-2xl font-bold">{overview?.todayOrders || 0}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-orange-500 opacity-70" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 渠道分析 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">渠道分析</CardTitle>
            </CardHeader>
            <CardContent>
              {channels.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无数据</p>
              ) : (
                <div className="space-y-4">
                  {channels.map((ch) => {
                    const pct = totalChannelAmount > 0
                      ? (ch.amount / totalChannelAmount) * 100
                      : 0;
                    return (
                      <div key={ch.channel}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">
                            {channelNames[ch.channel] || ch.channel}
                          </span>
                          <span className="text-muted-foreground">
                            {ch.count}单 / ¥{ch.amount.toFixed(2)} ({pct.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${channelColors[ch.channel] || "bg-gray-500"}`}
                            style={{ width: `${Math.max(pct, 1)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 员工业绩排行 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">员工业绩排行</CardTitle>
            </CardHeader>
            <CardContent>
              {staffData.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无数据</p>
              ) : (
                <div className="space-y-3">
                  {staffData.map((s, idx) => (
                    <div
                      key={s.staffId || idx}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{s.staffName || "未知"}</p>
                          <p className="text-xs text-muted-foreground">{s.count} 单</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">¥{s.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
