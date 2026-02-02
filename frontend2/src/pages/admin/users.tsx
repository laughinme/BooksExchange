import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search } from "lucide-react";

import { adminApi } from "@/shared/api/admin";
import { rolesApi } from "@/shared/api/roles";
import { adaptProfile } from "@/entities/profile/model/adapters";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

export const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [banned, setBanned] = useState<string>("");
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin", "users", search, banned],
    queryFn: async () => {
      const data = await adminApi.listUsers({
        limit: 20,
        cursor: null,
        search: search || undefined,
        banned: banned === "" ? undefined : banned === "1",
      });
      return data;
    },
  });

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.list(),
  });

  const toggleBan = useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) =>
      adminApi.setUserBan(userId, banned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const setRoles = useMutation({
    mutationFn: ({ userId, roles }: { userId: string; roles: string[] }) =>
      adminApi.setUserRoles(userId, roles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const adminRoleSlug =
    rolesQuery.data?.find((role) => role.slug === "admin")?.slug ?? "admin";

  const items = usersQuery.data?.items.map((dto) => adaptProfile(dto)) ?? [];

  if (usersQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Пользователи</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Поиск, управление ролями и блокировками.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 be-shadow-none"
          onClick={() => usersQuery.refetch()}
        >
          <RefreshCw className="size-4" />
          Обновить
        </Button>
      </div>

      <Card className="be-shadow-none be-backdrop-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Фильтры</CardTitle>
          <CardDescription>Поиск и фильтр по статусу блокировки.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
            <div className="relative md:col-span-7">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по email или имени…"
                className="pl-10 be-shadow-none"
              />
            </div>
            <div className="md:col-span-3">
              <Select
                value={banned}
                onChange={(e) => setBanned(e.target.value)}
                className="be-shadow-none"
              >
                <option value="">Все</option>
                <option value="0">Активные</option>
                <option value="1">Забаненные</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button
                variant="outline"
                className="w-full be-shadow-none"
                onClick={() => usersQuery.refetch()}
              >
                Применить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden be-shadow-none be-backdrop-none">
        <CardHeader className="pb-4">
          <div className="flex items-end justify-between gap-3">
            <CardTitle className="text-base">Список</CardTitle>
            <div className="text-sm text-muted-foreground">
              Показано: <span className="font-semibold text-foreground">{items.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Роли</TableHead>
                <TableHead>Город</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((user) => {
                const hasAdmin = user.roles.includes(adminRoleSlug);
                return (
                  <TableRow key={user.id} className={user.banned ? "bg-muted/20" : undefined}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.length ? (
                          user.roles.map((role) => (
                            <Badge
                              key={`${user.id}-${role}`}
                              variant={role === "admin" ? "default" : "muted"}
                              className="be-shadow-none"
                            >
                              {role}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">нет ролей</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.city?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant={hasAdmin ? "secondary" : "outline"}
                          className="be-shadow-none"
                          disabled={setRoles.isPending}
                          onClick={() =>
                            setRoles.mutate({
                              userId: user.id,
                              roles: hasAdmin
                                ? user.roles.filter((role) => role !== adminRoleSlug)
                                : Array.from(new Set([...user.roles, adminRoleSlug])),
                            })
                          }
                        >
                          {hasAdmin ? "Снять админа" : "Дать админа"}
                        </Button>
                        <Button
                          size="sm"
                          variant={user.banned ? "secondary" : "outline"}
                          className="be-shadow-none"
                          disabled={toggleBan.isPending}
                          onClick={() =>
                            toggleBan.mutate({
                              userId: user.id,
                              banned: !user.banned,
                            })
                          }
                        >
                          {user.banned ? "Разбанить" : "Забанить"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {items.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Пользователи не найдены
            </div>
          )}

          {usersQuery.isFetching && (
            <div className="flex items-center justify-center border-t border-border/70 py-4">
              <Spinner />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
