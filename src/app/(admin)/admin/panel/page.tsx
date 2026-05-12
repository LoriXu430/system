"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";

interface Staff {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  customerName: string | null;
  serviceName: string | null;
  servicePrice: number | null;
  staffName: string | null;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  in_service: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  completed: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  pending: "待服务",
  confirmed: "已确认",
  in_service: "服务中",
  completed: "已完成",
  cancelled: "已取消",
};

const bgColors: Record<string, string> = {
  pending: "bg-blue-200/60 border-blue-300 dark:bg-blue-900/40 dark:border-blue-700",
  confirmed: "bg-green-200/60 border-green-300 dark:bg-green-900/40 dark:border-green-700",
  in_service: "bg-orange-200/60 border-orange-300 dark:bg-orange-900/40 dark:border-orange-700",
  completed: "bg-gray-200/60 border-gray-300 dark:bg-gray-800/40 dark:border-gray-600",
  cancelled: "bg-red-200/60 border-red-300 dark:bg-red-900/40 dark:border-red-700",
};

// 时间段：9:00 - 22:00，每30分钟
const timeSlots: string[] = [];
for (let h = 9; h < 22; h++) {
  timeSlots.push(`${String(h).padStart(2, "0")}:00`);
  timeSlots.push(`${String(h).padStart(2, "0")}:30`);
}
timeSlots.push("22:00");

function timeToIndex(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 9) * 2 + (m >= 30 ? 1 : 0);
}

export default function PanelPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // 新建预约
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_id: "",
    service_id: "",
    staff_id: "",
    start_time: "",
    notes: "",
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // 预约详情
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, aptRes, svcRes] = await Promise.all([
        fetch("/api/staff?role=technician"),
        fetch(`/api/appointments?date=${date}`),
        fetch("/api/services?status=active"),
      ]);
      if (!staffRes.ok || !aptRes.ok || !svcRes.ok) throw new Error();
      const [staffData, aptData, svcData] = await Promise.all([
        staffRes.json(),
        aptRes.json(),
        svcRes.json(),
      ]);
      setStaffList(staffData.filter((s: any) => s.status === "active"));
      setAppointments(aptData);
      setServicesList(svcData);
    } catch {
      toast.error("获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function changeDate(offset: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split("T")[0]);
  }

  function getAppointmentsForStaff(staffId: string) {
    return appointments.filter((a) => a.staffId === staffId && a.status !== "cancelled");
  }

  // 搜索客户
  async function searchCustomers(query: string) {
    if (!query.trim()) {
      setCustomerResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomerResults(data.data || []);
    } catch {
      // ignore
    }
  }

  function openCreate(staffId: string, time: string) {
    setCreateForm({
      customer_id: "",
      service_id: "",
      staff_id: staffId,
      start_time: time,
      notes: "",
    });
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomerResults([]);
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!createForm.customer_id || !createForm.service_id || !createForm.staff_id || !createForm.start_time) {
      toast.error("请填写完整信息");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, date }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }
      toast.success("预约创建成功");
      setCreateOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("状态更新成功");
      setDetailOpen(false);
      fetchData();
    } catch {
      toast.error("操作失败");
    }
  }

  function openDetail(apt: Appointment) {
    setSelectedAppointment(apt);
    setDetailOpen(true);
  }

  // Check if a timeslot is occupied by any appointment for a staff
  function isSlotOccupied(staffId: string, time: string): Appointment | undefined {
    return getAppointmentsForStaff(staffId).find(
      (a) => time >= a.startTime && time < a.endTime
    );
  }

  // Check if this timeslot is the start of an appointment
  function isSlotStart(staffId: string, time: string): Appointment | undefined {
    return getAppointmentsForStaff(staffId).find((a) => a.startTime === time);
  }

  // Calculate span in terms of 30min slots
  function getSpan(apt: Appointment): number {
    const si = timeToIndex(apt.startTime);
    const ei = timeToIndex(apt.endTime);
    return Math.max(1, ei - si);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">手艺人面板</h1>
      </div>

      {/* 日期选择 */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{date}</span>
        <Button variant="outline" size="icon-sm" onClick={() => changeDate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">暂无手艺人</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="inline-grid" style={{
            gridTemplateColumns: `64px repeat(${staffList.length}, minmax(120px, 1fr))`,
          }}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-muted/50 border-b p-2 text-xs font-medium text-muted-foreground">
              时间
            </div>
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="sticky top-0 z-10 bg-muted/50 border-b p-2 text-center text-xs font-medium"
              >
                {staff.name}
              </div>
            ))}

            {/* Time rows */}
            {timeSlots.map((time) => (
              <>
                <div
                  key={`time-${time}`}
                  className="border-b border-r p-1 text-xs text-muted-foreground flex items-center"
                >
                  {time}
                </div>
                {staffList.map((staff) => {
                  const startApt = isSlotStart(staff.id, time);
                  const occupied = isSlotOccupied(staff.id, time);

                  if (startApt) {
                    const span = getSpan(startApt);
                    return (
                      <div
                        key={`${staff.id}-${time}`}
                        className={`border-b border-r p-0.5 cursor-pointer`}
                        style={{ gridRow: `span ${span}` }}
                      >
                        <div
                          className={`h-full rounded p-1 border text-xs ${bgColors[startApt.status] || ""}`}
                          onClick={() => openDetail(startApt)}
                        >
                          <div className="font-medium truncate">
                            {startApt.customerName}
                          </div>
                          <div className="truncate text-[10px] opacity-70">
                            {startApt.serviceName}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (occupied) {
                    return null; // spanned by previous cell
                  }

                  return (
                    <div
                      key={`${staff.id}-${time}`}
                      className="border-b border-r p-0.5 min-h-[28px] cursor-pointer hover:bg-muted/30"
                      onClick={() => openCreate(staff.id, time)}
                    />
                  );
                })}
              </>
            ))}
          </div>

          {/* 图例 */}
          <div className="flex gap-3 mt-3 flex-wrap">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1 text-xs">
                <span className={`inline-block w-3 h-3 rounded ${bgColors[key] || ""} border`} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 新建预约 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建预约</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 搜索客户 */}
            <div className="space-y-2">
              <Label>客户（手机号搜索）</Label>
              <Input
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  searchCustomers(e.target.value);
                }}
                placeholder="输入手机号搜索"
              />
              {customerResults.length > 0 && !selectedCustomer && (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {customerResults.map((c) => (
                    <div
                      key={c.id}
                      className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCreateForm((f) => ({ ...f, customer_id: c.id }));
                        setCustomerSearch(`${c.name} (${c.phone})`);
                        setCustomerResults([]);
                      }}
                    >
                      {c.name} - {c.phone}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 服务项目 */}
            <div className="space-y-2">
              <Label>服务项目</Label>
              <Select
                value={createForm.service_id}
                onValueChange={(val) =>
                  setCreateForm((f) => ({ ...f, service_id: val ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择服务项目" />
                </SelectTrigger>
                <SelectContent>
                  {servicesList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} (¥{s.price} / {s.duration}分钟)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 手艺人 */}
            <div className="space-y-2">
              <Label>手艺人</Label>
              <Select
                value={createForm.staff_id}
                onValueChange={(val) =>
                  setCreateForm((f) => ({ ...f, staff_id: val ?? "" }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择手艺人" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 时间 */}
            <div className="space-y-2">
              <Label>开始时间</Label>
              <Input
                type="time"
                value={createForm.start_time}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, start_time: e.target.value }))
                }
              />
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="可选"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">取消</Button>} />
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              {creating ? "创建中..." : "创建预约"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预约详情 Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>预约详情</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedAppointment.status] || ""}>
                  {statusLabels[selectedAppointment.status] || selectedAppointment.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">客户：</span>
                  {selectedAppointment.customerName}
                </div>
                <div>
                  <span className="text-muted-foreground">项目：</span>
                  {selectedAppointment.serviceName}
                </div>
                <div>
                  <span className="text-muted-foreground">手艺人：</span>
                  {selectedAppointment.staffName}
                </div>
                <div>
                  <span className="text-muted-foreground">价格：</span>
                  ¥{selectedAppointment.servicePrice}
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">时间：</span>
                  {selectedAppointment.date} {selectedAppointment.startTime}-{selectedAppointment.endTime}
                </div>
                {selectedAppointment.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">备注：</span>
                    {selectedAppointment.notes}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">关闭</Button>} />
            {selectedAppointment?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange(selectedAppointment.id, "cancelled")}
                >
                  取消预约
                </Button>
                <Button onClick={() => handleStatusChange(selectedAppointment.id, "in_service")}>
                  上钟
                </Button>
              </>
            )}
            {selectedAppointment?.status === "confirmed" && (
              <Button onClick={() => handleStatusChange(selectedAppointment.id, "in_service")}>
                上钟
              </Button>
            )}
            {selectedAppointment?.status === "in_service" && (
              <Button onClick={() => handleStatusChange(selectedAppointment.id, "completed")}>
                下钟（完成）
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
