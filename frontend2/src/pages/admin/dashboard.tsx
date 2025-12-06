import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Library, Clock, Users, BarChart3 } from "lucide-react";

import { adminApi } from "@/shared/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";

const StatCard = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) => (
  <Card className="flex flex-col">
    <CardContent className="flex flex-1 flex-col gap-3 p-4">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export const DashboardPage = () => {
  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [booksPending, usersPage, exchangesPage, booksStats] =
        await Promise.all([
          adminApi.listBooks({ status: "pending", limit: 1 }),
          adminApi.listUsers({ limit: 1 }),
          adminApi.listExchanges({ limit: 1 }),
          adminApi.statsBooks(30),
        ]);

      return {
        pendingModeration: Array.isArray(booksPending)
          ? booksPending.length
          : 0,
        totalUsers: usersPage?.items?.length ?? 0,
        activeExchanges: exchangesPage?.items?.length ?? 0,
        chart: (booksStats || []).map((p) => ({
          name: new Date(p.day).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
          }),
          views: p.views,
          likes: p.likes,
          reserves: p.reserves,
        })),
      };
    },
  });

  if (statsQuery.isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Панель управления</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Library className="size-5" />}
          title="Всего книг"
          value="—"
        />
        <StatCard
          icon={<Clock className="size-5" />}
          title="На модерации"
          value={statsQuery.data?.pendingModeration ?? 0}
        />
        <StatCard
          icon={<Users className="size-5" />}
          title="Всего пользователей"
          value={statsQuery.data?.totalUsers ?? 0}
        />
        <StatCard
          icon={<BarChart3 className="size-5" />}
          title="Активные обмены"
          value={statsQuery.data?.activeExchanges ?? 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статистика книг</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer>
            <BarChart data={statsQuery.data?.chart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="likes" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reserves" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
