"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface StaffDetail {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string | null;
  status: string;
}

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "",
  });

  const [allServices, setAllServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [savingServices, setSavingServices] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, [id]);

  async function fetchStaff() {
    try {
      const res = await fetch(`/api/staff/${id}`);
      if (!res.ok) throw new Error("获取员工信息失败");
      const data: StaffDetail = await res.json();
      setForm({
        name: data.name,
        phone: data.phone,
        role: data.role,
      });
    } catch {
      toast.error("获取员工信息失败");
    } finally {
      setLoading(false);
    }
  }

  async function fetchServices() {
    try {
      const [allRes, linkedRes] = await Promise.all([
        fetch("/api/services"),
        fetch(`/api/staff/${id}/services`),
      ]);

      if (!allRes.ok) throw new Error("获取服务项目失败");
      if (!linkedRes.ok) throw new Error("获取关联项目失败");

      const allData: Service[] = await allRes.json();
      const linkedData: Service[] = await linkedRes.json();

      setAllServices(allData);
      setSelectedServiceIds(new Set(linkedData.map((s) => s.id)));
    } catch {
      toast.error("获取服务项目数据失败");
    } finally {
      setServicesLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim() || !form.role) {
      toast.error("请填写完整信息");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存失败");
      }

      toast.success("员工信息已保存");
      router.push("/admin/staff");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  function handleServiceToggle(serviceId: string, checked: boolean) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(serviceId);
      } else {
        next.delete(serviceId);
      }
      return next;
    });
  }

  async function handleSaveServices() {
    setSavingServices(true);
    try {
      const res = await fetch(`/api/staff/${id}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceIds: Array.from(selectedServiceIds) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存关联失败");
      }

      toast.success("关联项目已保存");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存关联失败");
    } finally {
      setSavingServices(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/staff">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">编辑员工</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="请输入姓名"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="请输入手机号"
            />
          </div>

          <div className="space-y-2">
            <Label>角色</Label>
            <Select
              value={form.role}
              onValueChange={(val) =>
                setForm((prev) => ({ ...prev, role: val ?? "" }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">店主</SelectItem>
                <SelectItem value="manager">管理员</SelectItem>
                <SelectItem value="receptionist">前台</SelectItem>
                <SelectItem value="technician">手艺人</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "保存中..." : "保存"}
            </Button>
            <Link href="/admin/staff">
              <Button variant="outline">返回列表</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>关联服务项目</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {servicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : allServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无服务项目</p>
          ) : (
            <>
              <div className="space-y-3">
                {allServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedServiceIds.has(service.id)}
                      onCheckedChange={(checked) =>
                        handleServiceToggle(service.id, !!checked)
                      }
                    />
                    <span className="text-sm">
                      {service.name}
                      <span className="text-muted-foreground ml-2">
                        ¥{service.price} / {service.duration}分钟
                        {service.category ? ` · ${service.category}` : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <Button onClick={handleSaveServices} disabled={savingServices}>
                {savingServices && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {savingServices ? "保存中..." : "保存关联"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
