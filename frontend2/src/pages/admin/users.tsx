import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminApi } from "@/shared/api/admin";
import { rolesApi } from "@/shared/api/roles";
import { adaptProfile } from "@/entities/profile/model/adapters";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Spinner } from "@/shared/ui/spinner";

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
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Пользователи</h1>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="md:w-64"
        />
        <Select
          value={banned}
          onChange={(e) => setBanned(e.target.value)}
          className="md:w-48"
        >
          <option value="">Все</option>
          <option value="0">Активные</option>
          <option value="1">Забаненные</option>
        </Select>
        <Button
          variant="secondary"
          onClick={() => usersQuery.refetch()}
        >
          Обновить
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-sm font-semibold">Email</th>
              <th className="p-3 text-sm font-semibold">Имя</th>
              <th className="p-3 text-sm font-semibold">Роли</th>
              <th className="p-3 text-sm font-semibold">Город</th>
              <th className="p-3 text-right text-sm font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((user) => {
              const hasAdmin = user.roles.includes(adminRoleSlug);
              return (
                <tr key={user.id} className="border-t">
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.username}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.length ? (
                        user.roles.map((role) => (
                          <Badge
                            key={`${user.id}-${role}`}
                            variant={role === "admin" ? "default" : "muted"}
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">нет ролей</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{user.city?.name ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant={hasAdmin ? "secondary" : "outline"}
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {usersQuery.isFetching && (
          <div className="flex items-center justify-center py-4">
            <Spinner />
          </div>
        )}
      </Card>
    </div>
  );
};
