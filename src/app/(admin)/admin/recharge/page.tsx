"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Wallet } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number | null;
}

export default function RechargePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleRecharge = async () => {
    if (!selectedCustomer) {
      toast.error("请选择客户");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("请输入有效的充值金额");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          amount: Number(amount),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "充值失败");
        return;
      }
      toast.success(`充值成功，当前余额 ¥${json.balance.toFixed(2)}`);
      setSelectedCustomer({ ...selectedCustomer, balance: json.balance });
      setAmount("");
    } catch {
      toast.error("充值失败");
    } finally {
      setSubmitting(false);
    }
  };

  const presetAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div>
      <h1 className="text-2xl font-bold">余额充值</h1>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">充值信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* 客户选择 */}
            <div className="grid gap-2">
              <Label>客户 *</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {selectedCustomer.name} ({selectedCustomer.phone})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        当前余额：¥{(selectedCustomer.balance ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="输入手机号搜索客户"
                      className="pl-9"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                  {customers.length > 0 && (
                    <div className="mt-1 rounded-md border bg-popover shadow-md">
                      {customers.map((c) => (
                        <div
                          key={c.id}
                          className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomers([]);
                          }}
                        >
                          {c.name} ({c.phone}) - 余额 ¥{(c.balance ?? 0).toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 快捷金额 */}
            <div className="grid gap-2">
              <Label>充值金额 *</Label>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset}
                    variant={amount === String(preset) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(String(preset))}
                  >
                    ¥{preset}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="或输入自定义金额"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <Button onClick={handleRecharge} disabled={submitting} className="mt-2">
              {submitting ? "充值中..." : `确认充值${amount ? ` ¥${amount}` : ""}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
