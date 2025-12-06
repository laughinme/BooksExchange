import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { BookOpen, Plus, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import {
  useUpdateFavoriteGenres,
  useUpdateProfile,
  useUpdateProfilePicture,
} from "@/entities/profile/model/hooks";
import { profileQueryKey } from "@/entities/profile/model/hooks";
import { useCitiesQuery, useGenresQuery } from "@/entities/reference/model/hooks";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type FormValues = {
  city_id: string;
  bio?: string;
  avatar?: FileList;
};

export const OnboardingPage = () => {
  const { data: genres = [], isLoading: genresLoading } = useGenresQuery();
  const { data: cities = [], isLoading: citiesLoading } = useCitiesQuery();

  const [selectedGenres, setSelectedGenres] = useState<Set<number>>(new Set());
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: { city_id: "" },
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const updateGenres = useUpdateFavoriteGenres();
  const updatePicture = useUpdateProfilePicture();

  const avatarFile = watch("avatar");

  useEffect(() => {
    if (avatarFile && avatarFile.length > 0) {
      const file = avatarFile[0];
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setAvatarPreview(null);
  }, [avatarFile]);

  const isLoading = genresLoading || citiesLoading;

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedGenresList = useMemo(
    () => Array.from(selectedGenres),
    [selectedGenres],
  );

  const onSubmit = async (values: FormValues) => {
    if (!values.city_id) return;
    try {
      await updateProfile.mutateAsync({
        bio: values.bio,
        city_id: Number(values.city_id),
      });
      if (selectedGenresList.length > 0) {
        await updateGenres.mutateAsync(selectedGenresList);
      }
      if (values.avatar && values.avatar.length > 0) {
        const formData = new FormData();
        formData.append("file", values.avatar[0]);
        await updatePicture.mutateAsync(formData);
      }
      await queryClient.invalidateQueries({ queryKey: profileQueryKey });
      navigate("/home", { replace: true });
    } catch (err) {
      // basic error handling
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Загружаем данные...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex items-center justify-center gap-2">
          <BookOpen className="size-7 text-primary" />
          <CardTitle>Добро пожаловать!</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border bg-muted">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Превью"
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserIcon className="size-10 text-muted-foreground" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 flex size-9 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Plus className="size-4" />
                  <input type="file" className="hidden" accept="image/*" {...register("avatar")} />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ваш город</Label>
              <select
                id="city"
                className="w-full rounded-md border bg-background px-3 py-2"
                {...register("city_id", { required: true })}
              >
                <option value="">Выберите город</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">О себе</Label>
              <Textarea
                id="bio"
                rows={3}
                placeholder="Расскажите о своих книжных предпочтениях..."
                {...register("bio")}
              />
            </div>

            <div className="space-y-3">
              <Label>Любимые жанры</Label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => {
                  const active = selectedGenres.has(genre.id);
                  return (
                    <button
                      type="button"
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
              {selectedGenres.size === 0 && (
                <p className="text-xs text-destructive">
                  Выберите хотя бы один жанр.
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={
                updateProfile.isPending ||
                updateGenres.isPending ||
                updatePicture.isPending
              }
            >
              Сохранить
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
