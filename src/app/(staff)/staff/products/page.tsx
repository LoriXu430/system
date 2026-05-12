"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string | null;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

export default function StaffProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/products?status=active&pageSize=100")
      .then((r) => r.json())
      .then((json) => setProducts(json.data || []))
      .catch(() => toast.error("获取商品列表失败"))
      .finally(() => setLoading(false));
  }, []);

  const searchCustomers = useCallback(async () => {
    if (!customerSearch.trim()) {
      setCustomers([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(customerSearch)}&pageSize=10`
      );
      if (!res.ok) return;
      const json = await res.json();
      setCustomers(json.data);
    } catch {
      /* ignore */
    }
  }, [customerSearch]);

  useEffect(() => {
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [searchCustomers]);

  const openOrder = (p: Product) => {
    setSelected(p);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setQuantity(1);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      toast.error("请选择客户");
      return;
    }
    if (!selected) return;

    if (quantity > selected.stock) {
      toast.error("库存不足");
      return;
    }

    setSubmitting(true);
    try {
      // Create product order
      const totalAmount = selected.price * quantity;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "product",
          customer_id: selectedCustomer.id,
          amount: totalAmount,
          actual_amount: totalAmount,
          payment_method: "wechat",
          notes: `商品: ${selected.name} x${quantity}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "开单失败");
        return;
      }

      // Deduct stock
      await fetch(`/api/products/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: selected.stock - quantity }),
      });

      toast.success("开单成功");
      setDialogOpen(false);
      // Refresh stock
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selected.id ? { ...p, stock: p.stock - quantity } : p
        )
      );
    } catch {
      toast.error("开单失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold mb-4">
        <ShoppingBag className="inline h-5 w-5 mr-1" />
        商品开单
      </h1>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">加载中...</div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">暂无上架商品</div>
      ) : (
        <div className="grid gap-3">
          {products.map((p) => (
            <Card key={p.id} size="sm" className="cursor-pointer" onClick={() => openOrder(p)}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      {p.category && (
                        <Badge variant="secondary" className="text-xs">
                          {p.category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      库存: {p.stock}
                    </p>
                  </div>
                  <span className="text-lg font-semibold">¥{p.price.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>商品开单 - {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {/* Customer search */}
            <div className="grid gap-2">
              <Label>客户 *</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-md border p-2">
                  <span className="text-sm">
                    {selectedCustomer.name} ({selectedCustomer.phone})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                    }}
                  >
                    更换
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    placeholder="输入手机号搜索客户"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  {customers.length > 0 && (
                    <div className="mt-1 rounded-md border bg-popover shadow-md max-h-40 overflow-auto">
                      {customers.map((c) => (
                        <div
                          key={c.id}
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomers([]);
                          }}
                        >
                          {c.name} ({c.phone})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="grid gap-2">
              <Label>数量</Label>
              <Input
                type="number"
                min={1}
                max={selected?.stock || 1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
            </div>

            {/* Total */}
            <div className="text-sm">
              <span className="text-muted-foreground">金额：</span>
              <span className="text-lg font-bold">
                ¥{((selected?.price || 0) * quantity).toFixed(2)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "提交中..." : "确认开单"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
