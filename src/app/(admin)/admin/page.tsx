import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  { title: "今日营收", value: "¥0.00" },
  { title: "今日订单", value: "0" },
  { title: "今日客户", value: "0" },
  { title: "在岗员工", value: "0" },
];

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">管理后台</h1>
      <p className="mt-1 text-muted-foreground">欢迎使用头道汤管理系统</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
