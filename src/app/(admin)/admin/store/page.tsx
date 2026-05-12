"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface StoreInfo {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  businessHours: string | null;
}

export default function StorePage() {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    businessHours: "",
  });

  useEffect(() => {
    fetchStore();
  }, []);

  async function fetchStore() {
    try {
      const res = await fetch("/api/stores");
      if (!res.ok) throw new Error("获取门店信息失败");
      const data = await res.json();
      setStore(data);
      setForm({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        businessHours: data.businessHours || "",
      });
    } catch {
      toast.error("获取门店信息失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("门店名称不能为空");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/stores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "保存失败");
      }

      const data = await res.json();
      setStore(data);
      toast.success("门店信息已保存");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        未找到门店信息
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">门店设置</h1>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">门店名称</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="请输入门店名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">门店地址</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="请输入门店地址"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">联系电话</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="请输入联系电话"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessHours">营业时间</Label>
            <Textarea
              id="businessHours"
              value={form.businessHours}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  businessHours: e.target.value,
                }))
              }
              placeholder="例如：周一至周日 09:00-21:00"
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "保存中..." : "保存"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
