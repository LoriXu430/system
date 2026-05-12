"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "sonner";
import { Loader2, Plus, Search, Pencil } from "lucide-react";
import Link from "next/link";

interface Staff {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: string;
  storeId: string | null;
  createdAt: string | null;
}

const roleLabels: Record<string, string> = {
  owner: "店主",
  manager: "管理员",
  receptionist: "前台",
  technician: "手艺人",
};

const roleColors: Record<string, string> = {
  owner: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  receptionist: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  technician: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  disabled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    phone: "",
    role: "technician",
  });

  const fetchStaff = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/staff?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setStaffList(data);
    } catch {
      toast.error("获取员工列表失败");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  async function handleCreate() {
    if (!newStaff.name.trim() || !newStaff.phone.trim()) {
      toast.error("请填写完整信息");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }

      toast.success("员工创建成功，默认密码 123456");
      setDialogOpen(false);
      setNewStaff({ name: "", phone: "", role: "technician" });
      fetchStaff();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(staff: Staff) {
    try {
      const res = await fetch(`/api/staff/${staff.id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      toast.success(
        staff.status === "active" ? "已禁用该员工" : "已启用该员工"
      );
      fetchStaff();
    } catch {
      toast.error("操作失败");
    }
  }

  function handleSearch() {
    setLoading(true);
    fetchStaff();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">员工管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="h-4 w-4" />
                添加员工
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加员工</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-name">姓名</Label>
                <Input
                  id="new-name"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-phone">手机号</Label>
                <Input
                  id="new-phone"
                  value={newStaff.phone}
                  onChange={(e) =>
                    setNewStaff((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="请输入手机号"
                />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <Select
                  value={newStaff.role}
                  onValueChange={(val) =>
                    setNewStaff((prev) => ({ ...prev, role: val ?? "technician" }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">管理员</SelectItem>
                    <SelectItem value="receptionist">前台</SelectItem>
                    <SelectItem value="technician">手艺人</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                默认密码：123456
              </p>
            </div>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline">取消</Button>}
              />
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {creating ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索姓名或手机号"
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          搜索
        </Button>
      </div>

      {/* 员工列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          暂无员工数据
        </div>
      ) : (
        <div className="space-y-3">
          {staffList.map((staff) => (
            <Card key={staff.id} size="sm">
              <CardContent className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {staff.name.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{staff.name}</span>
                    <Badge
                      className={roleColors[staff.role] || ""}
                    >
                      {roleLabels[staff.role] || staff.role}
                    </Badge>
                    <Badge
                      className={statusColors[staff.status] || ""}
                    >
                      {staff.status === "active" ? "启用" : "禁用"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {staff.phone}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/admin/staff/${staff.id}`}>
                    <Button variant="ghost" size="icon-sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(staff)}
                  >
                    {staff.status === "active" ? "禁用" : "启用"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
