"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

interface Staff {
  id: string;
  name: string;
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

interface Schedule {
  id: string;
  staffId: string;
  shiftId: string;
  date: string;
  shiftName: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
}

function getWeekDates(dateStr: string) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    dates.push(dt.toISOString().split("T")[0]);
  }
  return dates;
}

const dayLabels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates(currentDate);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, shiftsRes, schedulesRes] = await Promise.all([
        fetch("/api/staff?role=technician"),
        fetch("/api/shifts"),
        fetch(`/api/schedules?week=${weekDates[0]}`),
      ]);
      if (!staffRes.ok || !shiftsRes.ok || !schedulesRes.ok) throw new Error();
      const [staffData, shiftsData, schedulesData] = await Promise.all([
        staffRes.json(),
        shiftsRes.json(),
        schedulesRes.json(),
      ]);
      setStaffList(staffData);
      setShifts(shiftsData);
      setSchedules(schedulesData);
    } catch {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [weekDates[0]]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function changeWeek(offset: number) {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + offset * 7);
    setCurrentDate(d.toISOString().split("T")[0]);
  }

  function getScheduleForCell(staffId: string, date: string) {
    return schedules.find(
      (s) => s.staffId === staffId && s.date === date
    );
  }

  async function handleAssign(staffId: string, date: string, shiftId: string) {
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: staffId, shift_id: shiftId, date }),
      });
      if (!res.ok) throw new Error();
      toast.success("排班成功");
      fetchData();
    } catch {
      toast.error("排班失败");
    }
  }

  async function handleRemove(scheduleId: string) {
    try {
      const res = await fetch("/api/schedules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scheduleId }),
      });
      if (!res.ok) throw new Error();
      toast.success("已移除排班");
      fetchData();
    } catch {
      toast.error("操作失败");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">排班管理</h1>
        <Link href="/admin/schedule/shifts">
          <Button variant="outline" size="sm">
            班次设置
          </Button>
        </Link>
      </div>

      {/* 周选择 */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => changeWeek(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          {weekDates[0]} ~ {weekDates[6]}
        </div>
        <Button variant="outline" size="icon-sm" onClick={() => changeWeek(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={currentDate}
          onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          暂无手艺人
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">手艺人</TableHead>
              {weekDates.map((date, i) => (
                <TableHead key={date} className="text-center min-w-[100px]">
                  <div>{dayLabels[i]}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {date.slice(5)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffList.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium">{staff.name}</TableCell>
                {weekDates.map((date) => {
                  const schedule = getScheduleForCell(staff.id, date);
                  return (
                    <TableCell key={date} className="text-center">
                      {schedule ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">
                            {schedule.shiftName}
                          </span>
                          <button
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(schedule.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <Select
                          onValueChange={(val) => {
                            if (val) handleAssign(staff.id, date, val as string);
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs w-full">
                            <SelectValue placeholder="选择班次" />
                          </SelectTrigger>
                          <SelectContent>
                            {shifts.map((shift) => (
                              <SelectItem key={shift.id} value={shift.id}>
                                {shift.name} ({shift.startTime}-{shift.endTime})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
