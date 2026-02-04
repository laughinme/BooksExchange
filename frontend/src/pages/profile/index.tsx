import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Edit, Book as BookIcon, LayoutDashboard } from "lucide-react";

import { BookCard } from "@/entities/book/ui/book-card";
import { useMyBooks } from "@/entities/book/model/hooks";
import { useProfileQuery } from "@/entities/profile/model/hooks";
import { useHasRole } from "@/shared/authz";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";

export const ProfilePage = () => {
  const { data: profile, isPending: profilePending } = useProfileQuery();
  const { data: books = [], isPending: booksPending } = useMyBooks();
  const navigate = useNavigate();
  const isAdmin = useHasRole("admin");

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
      })
    : "";
  const birthDate = profile?.birthDate
    ? new Date(profile.birthDate).toLocaleDateString("ru-RU")
    : null;

  if (profilePending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="m-6 p-6 text-center text-destructive">
        Не удалось загрузить профиль
      </Card>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-6 text-center">
            <div className="flex justify-center">
              <Avatar
                src={profile.avatarUrl ?? undefined}
                fallback={profile.username[0]}
                className="size-24 text-xl"
              />
            </div>
            <div>
              <p className="text-xl font-semibold">{profile.username}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center justify-center gap-2">
                <Calendar className="size-4" /> В клубе с {memberSince}
              </p>
              {profile.city && (
                <p className="flex items-center justify-center gap-2">
                  <MapPin className="size-4" /> {profile.city.name}
                </p>
              )}
              {birthDate && (
                <p className="flex items-center justify-center gap-2">
                  <Calendar className="size-4" /> Дата рождения: {birthDate}
                </p>
              )}
              {profile.languageCode && (
                <p className="flex items-center justify-center gap-2">
                  Язык: {profile.languageCode.toUpperCase()}
                </p>
              )}
              <p className="flex items-center justify-center gap-2">
                Статус профиля: {profile.public ? "Публичный" : "Скрытый"}
              </p>
            </div>
            <p className="text-sm">
              {profile.bio || "Информация о себе не заполнена."}
            </p>
            <div className="space-y-2">
              <Button
                className="w-full gap-2"
                variant="secondary"
                onClick={() => navigate("/profile/edit")}
              >
                <Edit className="size-4" /> Редактировать
              </Button>
              {isAdmin && (
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => navigate("/admin")}
                >
                  <LayoutDashboard className="size-4" /> Админ-панель
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Любимые жанры
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {profile.favoriteGenres.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Жанры не выбраны
              </p>
            )}
            {profile.favoriteGenres.map((genre) => (
              <Badge key={genre.id} variant="secondary">
                {genre.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Мои книги ({books.length})
          </h2>
          <Button onClick={() => navigate("/add-book")} size="sm">
            Добавить книгу
          </Button>
        </div>

        {booksPending && (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        )}

        {!booksPending && books.length === 0 && (
          <Card className="p-8 text-center space-y-3">
            <BookIcon className="mx-auto size-8 text-muted-foreground" />
            <p className="text-lg font-semibold">
              Вы ещё не добавили книги
            </p>
            <Button onClick={() => navigate("/add-book")}>
              Добавить первую книгу
            </Button>
          </Card>
        )}

        {!booksPending && books.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                showStatus
                onSelect={() => navigate(`/book/${book.id}`)}
                onReserve={() => undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
