import { useState } from "react";
import { ArrowLeft, MapPin, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useNearbyUsers } from "@/entities/profile/model/hooks";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

export const NearbyUsersPage = () => {
  const [radius, setRadius] = useState(5);
  const { data: users = [], isPending, error, refetch, isFetching } = useNearbyUsers(radius);
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" /> Назад
        </Button>
        <h1 className="text-2xl font-bold">Люди рядом</h1>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={50}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">км</span>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching}>
          Обновить
        </Button>
      </div>

      {isPending && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner />
        </div>
      )}

      {error && (
        <Card className="p-6 text-center text-destructive">
          Не удалось загрузить пользователей рядом
        </Card>
      )}

      {!isPending && !error && users.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          Никого рядом не нашли. Попробуйте увеличить радиус.
        </Card>
      )}

      {!isPending && !error && users.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Avatar src={user.avatarUrl ?? undefined} fallback={user.username?.[0] ?? "U"} />
                <div>
                  <p className="font-semibold">{user.username ?? "Без имени"}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-4" /> {user.city?.name ?? "—"}
                  </p>
                </div>
                <Badge className="ml-auto" variant="secondary">
                  {user.distance.toFixed(1)} км
                </Badge>
              </div>
              {user.bio && <p className="text-sm text-muted-foreground">{user.bio}</p>}
              <div className="flex flex-wrap gap-2">
                {user.favoriteGenres.map((g) => (
                  <Badge key={g.id} variant="outline">
                    {g.name}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
