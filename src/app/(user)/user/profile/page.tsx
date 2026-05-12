"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Wallet, CreditCard, Ticket, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FrequencyCard {
  id: string;
  name: string;
  totalTimes: number;
  remainingTimes: number;
  totalAmount: number;
  status: string;
  expireDate: string | null;
  serviceName: string | null;
}

interface Coupon {
  id: string;
  name: string;
  type: string;
  value: number;
  minAmount: number | null;
  status: string;
  expireDate: string;
  serviceName: string | null;
}

interface UserInfo {
  id: string;
  name: string;
  phone: string;
  role: string;
}

const cardStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "使用中", variant: "default" },
  expired: { label: "已过期", variant: "destructive" },
  exhausted: { label: "已用完", variant: "secondary" },
};

const couponTypeMap: Record<string, string> = {
  discount: "折扣券",
  fixed: "满减券",
  free_service: "免单券",
};

export default function UserProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [balance, setBalance] = useState(0);
  const [cards, setCards] = useState<FrequencyCard[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    // 获取当前用户信息，然后按 phone 查找 customer
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(async (session) => {
        if (!session?.user) return;
        setUserInfo(session.user);

        // 用手机号查找 customer
        const custRes = await fetch(
          `/api/customers?search=${encodeURIComponent(session.user.phone)}&pageSize=1`
        );
        const custJson = await custRes.json();
        const customer = custJson.data?.find(
          (c: any) => c.phone === session.user.phone
        );

        if (customer) {
          setCustomerId(customer.id);
          setBalance(customer.balance ?? 0);

          // 并行获取次卡和优惠券
          const [cardsRes, couponsRes] = await Promise.all([
            fetch(`/api/frequency-cards?customer_id=${customer.id}&status=active`),
            fetch(`/api/coupons?customer_id=${customer.id}&status=available`),
          ]);

          if (cardsRes.ok) {
            const cardsData = await cardsRes.json();
            setCards(cardsData);
          }
          if (couponsRes.ok) {
            const couponsData = await couponsRes.json();
            setCoupons(couponsData);
          }
        }
      })
      .catch(() => toast.error("加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      {/* 用户信息 */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{userInfo?.name || "用户"}</h1>
          <div className="text-sm text-muted-foreground">{userInfo?.phone}</div>
        </div>
      </div>

      {/* 余额 */}
      <Card className="mb-4">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">我的余额</div>
            <div className="text-2xl font-bold">¥{balance.toFixed(2)}</div>
          </div>
        </CardContent>
      </Card>

      {/* 快捷入口 */}
      <div className="flex gap-3 mb-6">
        <Link href="/user/booking" className="flex-1">
          <Button className="w-full">立即预约</Button>
        </Link>
        <Link href="/user/orders" className="flex-1">
          <Button variant="outline" className="w-full">我的订单</Button>
        </Link>
      </div>

      {/* 我的次卡 */}
      <div className="mb-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          我的次卡
        </h2>
      </div>
      {cards.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground mb-6">
          暂无次卡
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {cards.map((card) => {
            const st = cardStatusMap[card.status] || { label: card.status, variant: "secondary" as const };
            return (
              <Card key={card.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{card.name}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {card.serviceName && `${card.serviceName} · `}
                        {card.expireDate ? `到期 ${card.expireDate}` : "永久有效"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {card.remainingTimes}/{card.totalTimes}
                      </div>
                      <div className="text-xs text-muted-foreground">剩余次数</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 我的优惠券 */}
      <div className="mb-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          我的优惠券
        </h2>
      </div>
      {coupons.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          暂无优惠券
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{coupon.name}</span>
                      <Badge variant="secondary">
                        {couponTypeMap[coupon.type] || coupon.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {coupon.minAmount ? `满¥${coupon.minAmount}可用 · ` : ""}
                      到期 {coupon.expireDate}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-600">
                      {coupon.type === "discount"
                        ? `${coupon.value}折`
                        : `¥${coupon.value}`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
