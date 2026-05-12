"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string | null;
  description: string | null;
  status: "active" | "inactive";
  storeId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

const CATEGORIES = ["头皮护理", "身体护理", "足部护理", "特色项目"];

export default function ServicesPage() {
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formDescription, setFormDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCategory) params.set("category", filterCategory);
    if (filterStatus) params.set("status", filterStatus);
    const qs = params.toString();
    try {
      const res = await fetch(`/api/services${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        setServiceList(await res.json());
      } else {
        toast.error("获取服务列表失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  function openCreate() {
    setEditingService(null);
    setFormName("");
    setFormPrice("");
    setFormDuration("");
    setFormCategory("");
    setFormDescription("");
    setDialogOpen(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setFormName(service.name);
    setFormPrice(String(service.price));
    setFormDuration(String(service.duration));
    setFormCategory(service.category ?? "");
    setFormDescription(service.description ?? "");
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formName.trim() || !formPrice || !formDuration) {
      toast.error("请填写必填字段");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        price: Number(formPrice),
        duration: Number(formDuration),
        category: formCategory || null,
        description: formDescription.trim() || null,
      };

      let res: Response;
      if (editingService) {
        res = await fetch(`/api/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        toast.success(editingService ? "更新成功" : "创建成功");
        setDialogOpen(false);
        fetchServices();
      } else {
        const data = await res.json();
        toast.error(data.error || "操作失败");
      }
    } catch {
      toast.error("网络错误");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(service: Service) {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success(
          service.status === "active" ? "已下架" : "已上架"
        );
        fetchServices();
      } else {
        toast.error("操作失败");
      }
    } catch {
      toast.error("网络错误");
    }
  }

  async function handleDelete(service: Service) {
    if (!confirm(`确认删除「${service.name}」？`)) return;
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("删除成功");
        fetchServices();
      } else {
        toast.error("删除失败");
      }
    } catch {
      toast.error("网络错误");
    }
  }

  return (
    <div>
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">服务项目管理</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          添加项目
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Select value={filterCategory} onValueChange={(val) => setFilterCategory(val ?? "")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部分类</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val ?? "")}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部</SelectItem>
            <SelectItem value="active">上架</SelectItem>
            <SelectItem value="inactive">下架</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="mt-8 text-center text-muted-foreground">加载中…</div>
      ) : serviceList.length === 0 ? (
        <div className="mt-8 text-center text-muted-foreground">
          暂无服务项目
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceList.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                <CardAction>
                  <Badge
                    variant={
                      service.status === "active" ? "default" : "secondary"
                    }
                    className={
                      service.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }
                  >
                    {service.status === "active" ? "上架" : "下架"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-primary">
                    ¥{service.price}
                  </span>
                  <span className="text-muted-foreground">
                    {service.duration}分钟
                  </span>
                  {service.category && (
                    <Badge variant="outline">{service.category}</Badge>
                  )}
                </div>
                {service.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => openEdit(service)}
                  >
                    <Pencil className="h-3 w-3" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleToggleStatus(service)}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {service.status === "active" ? "下架" : "上架"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={() => handleDelete(service)}
                  >
                    <Trash2 className="h-3 w-3" />
                    删除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 创建/编辑 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "编辑服务项目" : "添加服务项目"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "修改服务项目信息"
                : "填写以下信息创建新的服务项目"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="service-name">
                项目名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="service-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="请输入项目名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="service-price">
                  价格（元）<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="service-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-duration">
                  时长（分钟）<span className="text-destructive">*</span>
                </Label>
                <Input
                  id="service-duration"
                  type="number"
                  min="1"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>分类</Label>
              <Select value={formCategory} onValueChange={(val) => setFormCategory(val ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无分类</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service-desc">描述</Label>
              <Textarea
                id="service-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="项目描述（可选）"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中…" : editingService ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
