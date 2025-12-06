import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
  Award,
  X,
  Clock,
  User,
  BookOpen,
} from "lucide-react";

import { adminApi } from "@/shared/api/admin";
import { adaptExchange } from "@/entities/exchange/model/adapters";
import { type Exchange } from "@/entities/exchange/model/types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";

const statusLabels: Record<Exchange["progress"], string> = {
  created: "Ожидает",
  accepted: "Принят",
  declined: "Отклонён",
  finished: "Завершён",
  canceled: "Отменён",
};

export const AdminExchangesPage = () => {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

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
    mutationFn: (exchangeId: number) =>
      adminApi.forceFinishExchange(exchangeId),
    onSuccess: () => exchangesQuery.refetch(),
  });

  const forceCancel = useMutation({
    mutationFn: (exchangeId: number) =>
      adminApi.forceCancelExchange(exchangeId),
    onSuccess: () => exchangesQuery.refetch(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Обмены пользователей</h1>
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => exchangesQuery.refetch()}
        >
          <RefreshCw className="size-4" /> Обновить
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Input
            placeholder="Поиск по книге/пользователю"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && exchangesQuery.refetch()}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Все статусы</option>
          <option value="created">Ожидает</option>
          <option value="accepted">Принят</option>
          <option value="declined">Отклонён</option>
          <option value="finished">Завершён</option>
          <option value="canceled">Отменён</option>
        </Select>
        <Button onClick={() => exchangesQuery.refetch()}>Фильтровать</Button>
      </div>

      {exchangesQuery.isPending && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      )}

      {exchangesQuery.error && (
        <Card className="p-6 text-center text-destructive">
          Не удалось загрузить обмены
        </Card>
      )}

      {!exchangesQuery.isPending &&
        !exchangesQuery.error &&
        exchangesQuery.data && (
          <div className="space-y-3">
            {exchangesQuery.data.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">
                Нет обменов
              </Card>
            )}
            {exchangesQuery.data.map((ex) => (
              <Card
                key={ex.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-start"
              >
                <img
                  src={
                    ex.book.photoUrls[0] ||
                    "https://placehold.co/200x300?text=No+Image"
                  }
                  alt={ex.book.title}
                  className="h-28 w-20 rounded object-cover"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="size-4" />
                        <h3 className="font-semibold">{ex.book.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ex.book.author.name}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                      {statusLabels[ex.progress]}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <User className="size-4" />
                      Владелец: {ex.owner.username}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="size-4" />
                      Запросивший: {ex.requester.username}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4" />
                      {new Date(ex.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ex.progress === "accepted" && (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => forceFinish.mutate(ex.id)}
                      >
                        <Award className="size-4" /> Принудительно завершить
                      </Button>
                    )}
                    {(ex.progress === "created" || ex.progress === "accepted") && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => forceCancel.mutate(ex.id)}
                      >
                        <X className="size-4" /> Принудительно отменить
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
};
