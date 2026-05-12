"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface StaffPerf {
  staffId: string | null;
  staffName: string | null;
  count: number;
  amount: number;
  commission: number;
}

export default function StaffPerformancePage() {
  const [data, setData] = useState<StaffPerf[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = `${month}-01`;
      const [year, mon] = month.split("-").map(Number);
      const lastDay = new Date(year, mon, 0).getDate();
      const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

      const res = await fetch(
        `/api/reports?type=staff&start_date=${startDate}&end_date=${endDate}`
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.data);
    } catch {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/reports">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">员工业绩</h1>
      </div>

      <div className="flex gap-3 items-end mb-4">
        <div className="grid gap-1">
          <Label className="text-xs">月份</Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">加载中...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead className="text-right">订单数</TableHead>
                <TableHead className="text-right">总金额</TableHead>
                <TableHead className="text-right">提成金额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                data.map((s, idx) => (
                  <TableRow key={s.staffId || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{s.staffName || "未知"}</TableCell>
                    <TableCell className="text-right">{s.count}</TableCell>
                    <TableCell className="text-right">¥{s.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">¥{s.commission.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
