import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Award,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { adminApi } from "@/shared/api/admin";
import { adaptExchange } from "@/entities/exchange/model/adapters";
import { type Exchange } from "@/entities/exchange/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const statusLabels: Record<Exchange["progress"], string> = {
  created: "Ожидает",
  accepted: "Принят",
  declined: "Отклонён",
  finished: "Завершён",
  canceled: "Отменён",
};

const statusVariants: Record<
  Exchange["progress"],
  "default" | "secondary" | "destructive" | "outline" | "muted"
> = {
  created: "outline",
  accepted: "default",
  declined: "destructive",
  finished: "secondary",
  canceled: "muted",
};

export const AdminExchangesPage = () => {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Exchange | null>(null);

  const exchangesQuery = useQuery({
    queryKey: ["admin", "exchanges", status, search],
    queryFn: async () => {
      const params: Record<string, unknown> = { limit: 50 };
      if (status !== "all") params.status = status;
      if (search.trim()) params.query = search.trim();
      const data = await adminApi.listExchanges(params);
      return data.items.map(adaptExchange);
    },
  });

  const forceFinish = useMutation({
    mutationFn: (exchangeId: string) =>
      adminApi.forceFinishExchange(exchangeId),
    onSuccess: () => exchangesQuery.refetch(),
  });

  const forceCancel = useMutation({
    mutationFn: (exchangeId: string) =>
      adminApi.forceCancelExchange(exchangeId),
    onSuccess: () => exchangesQuery.refetch(),
  });

  const loadDetail = useMutation({
    mutationFn: (exchangeId: string) => adminApi.getExchange(exchangeId),
    onSuccess: (dto) => setSelected(adaptExchange(dto)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Обмены пользователей</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Список обменов и принудительные действия для спорных случаев.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 be-shadow-none"
          onClick={() => exchangesQuery.refetch()}
        >
          <RefreshCw className="size-4" /> Обновить
        </Button>
      </div>

      <Card className="be-shadow-none be-backdrop-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Фильтры</CardTitle>
          <CardDescription>Поиск по книге или пользователям + статус обмена.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
            <div className="relative md:col-span-7">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по книге/пользователю"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && exchangesQuery.refetch()}
                className="pl-10 be-shadow-none"
              />
            </div>
            <div className="md:col-span-3">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="be-shadow-none"
              >
                <option value="all">Все статусы</option>
                <option value="created">Ожидает</option>
                <option value="accepted">Принят</option>
                <option value="declined">Отклонён</option>
                <option value="finished">Завершён</option>
                <option value="canceled">Отменён</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button
                className="w-full be-shadow-none"
                onClick={() => exchangesQuery.refetch()}
              >
                Фильтровать
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {exchangesQuery.isPending && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      )}

      {exchangesQuery.error && (
        <Card className="p-6 text-center text-destructive be-shadow-none be-backdrop-none">
          Не удалось загрузить обмены
        </Card>
      )}

      {!exchangesQuery.isPending && !exchangesQuery.error && exchangesQuery.data && (
        <Card className="be-shadow-none be-backdrop-none">
          <CardHeader className="pb-4">
            <div className="flex items-end justify-between gap-3">
              <CardTitle className="text-base">Список</CardTitle>
              <div className="text-sm text-muted-foreground">
                Найдено:{" "}
                <span className="font-semibold text-foreground">{exchangesQuery.data.length}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {exchangesQuery.data.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">Нет обменов</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Книга</TableHead>
                    <TableHead>Владелец</TableHead>
                    <TableHead>Запросивший</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exchangesQuery.data.map((ex) => (
                    <TableRow key={ex.id}>
                      <TableCell>
                        <div className="flex min-w-[240px] items-center gap-3">
                          <img
                            src={ex.book.photoUrls[0] || "https://placehold.co/200x300?text=No+Image"}
                            alt={ex.book.title}
                            className="h-12 w-9 rounded border border-border/70 object-cover"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{ex.book.title}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {ex.book.author.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ex.owner.username}</TableCell>
                      <TableCell className="text-muted-foreground">{ex.requester.username}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariants[ex.progress]}
                          className="be-shadow-none whitespace-nowrap"
                        >
                          {statusLabels[ex.progress]}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(ex.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {ex.progress === "accepted" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="gap-2 be-shadow-none"
                              onClick={() => forceFinish.mutate(ex.id)}
                            >
                              <Award className="size-4" />
                              <span className="hidden lg:inline">Завершить</span>
                            </Button>
                          )}
                          {(ex.progress === "created" || ex.progress === "accepted") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2 be-shadow-none"
                              onClick={() => forceCancel.mutate(ex.id)}
                            >
                              <X className="size-4" />
                              <span className="hidden lg:inline">Отменить</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="be-shadow-none"
                            onClick={() => loadDetail.mutate(ex.id)}
                          >
                            Детали
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <Card className="relative w-full max-w-2xl be-shadow-none be-backdrop-none">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Детали обмена</CardTitle>
                  <CardDescription>Информация по выбранному обмену.</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="be-shadow-none text-muted-foreground hover:text-foreground"
                  onClick={() => setSelected(null)}
                  aria-label="Закрыть"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <dl className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Книга
                  </dt>
                  <dd className="font-medium text-foreground">{selected.book.title}</dd>
                  <dd className="text-muted-foreground">{selected.book.author.name}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Статус
                  </dt>
                  <dd>
                    <Badge
                      variant={statusVariants[selected.progress]}
                      className="be-shadow-none"
                    >
                      {statusLabels[selected.progress]}
                    </Badge>
                  </dd>
                  {selected.cancelReason && (
                    <dd className="text-muted-foreground">{selected.cancelReason}</dd>
                  )}
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Владелец
                  </dt>
                  <dd className="font-medium text-foreground">{selected.owner.username}</dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Запросивший
                  </dt>
                  <dd className="font-medium text-foreground">{selected.requester.username}</dd>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Создан
                  </dt>
                  <dd className="text-muted-foreground">
                    {new Date(selected.createdAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
