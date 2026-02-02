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
import { BookOpen, Clock, Library, Repeat, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

import { adminApi } from "@/shared/api/admin";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import type { AdminBookStatsPoint } from "@/entities/admin/model/types";

type DailyCountPoint = { day: string; count: number };
type DashboardStats = {
  pendingModeration: number;
  totalUsers: number;
  activeExchanges: number;
  chart: { name: string; views: number; likes: number; reserves: number }[];
  activeUsers: DailyCountPoint[];
  registrations: DailyCountPoint[];
};

const StatCard = ({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}) => (
  <Card className="flex flex-col be-shadow-none be-backdrop-none">
    <CardContent className="flex flex-1 flex-col gap-3 p-4">
      <div className="flex size-10 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-primary be-shadow-none">
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
  const statsQuery = useQuery<DashboardStats>({
    queryKey: ["admin", "dashboard"],
    queryFn: async (): Promise<DashboardStats> => {
      const [
        booksPending,
        usersPage,
        exchangesPage,
        booksStats,
        activeUsers,
        registrations,
      ] =
        await Promise.all([
          adminApi.listBooks({ status: "pending", limit: 1 }),
          adminApi.listUsers({ limit: 1 }),
          adminApi.listExchanges({ limit: 1 }),
          adminApi.statsBooks(30),
          adminApi.statsActiveUsers(30),
          adminApi.statsRegistrations(30),
        ]);

      return {
        pendingModeration: Array.isArray(booksPending)
          ? booksPending.length
          : 0,
        totalUsers: usersPage?.items?.length ?? 0,
        activeExchanges: exchangesPage?.items?.length ?? 0,
        chart: (booksStats || []).map((p: AdminBookStatsPoint) => ({
          name: new Date(p.day).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
          }),
          views: p.views,
          likes: p.likes,
          reserves: p.reserves,
        })),
        activeUsers: (activeUsers as DailyCountPoint[] | undefined) ?? [],
        registrations: (registrations as DailyCountPoint[] | undefined) ?? [],
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

  const activeUsersChart = (statsQuery.data?.activeUsers ?? []).map((p) => ({
    name: new Date(p.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    count: p.count,
  }));

  const registrationsChart = (statsQuery.data?.registrations ?? []).map((p) => ({
    name: new Date(p.day).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    count: p.count,
  }));

  const legendStyle = { color: "var(--foreground)", fontWeight: 600, letterSpacing: "0.01em" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Панель управления</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Метрики и действия для модерации, пользователей и обменов.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline" className="gap-2 be-shadow-none">
            <Link to="/admin/books">
              <BookOpen className="size-4" />
              Модерация
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2 be-shadow-none">
            <Link to="/admin/users">
              <Users className="size-4" />
              Пользователи
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2 be-shadow-none">
            <Link to="/admin/exchanges">
              <Repeat className="size-4" />
              Обмены
            </Link>
          </Button>
        </div>
      </div>

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

      <Card className="be-shadow-none be-backdrop-none">
        <CardHeader>
          <CardTitle>Статистика книг</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer>
            <BarChart data={statsQuery.data?.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend iconType="square" iconSize={14} wrapperStyle={legendStyle} />
              <Bar dataKey="views" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="likes" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reserves" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="be-shadow-none be-backdrop-none">
          <CardHeader>
            <CardTitle>Активные пользователи (30 дней)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer>
              <BarChart data={activeUsersChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="be-shadow-none be-backdrop-none">
          <CardHeader>
            <CardTitle>Новые регистрации (30 дней)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer>
              <BarChart data={registrationsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
