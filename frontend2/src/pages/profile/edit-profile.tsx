import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import {
  useProfileQuery,
  useUpdateFavoriteGenres,
  useUpdateProfile,
  useUpdateProfilePicture,
} from "@/entities/profile/model/hooks";
import { type Profile } from "@/entities/profile/model/types";
import { useGenresQuery, useLanguagesQuery } from "@/entities/reference/model/hooks";
import { type Genre, type Language } from "@/entities/reference/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Spinner } from "@/shared/ui/spinner";

type FormValues = {
  username: string;
  bio?: string;
  avatar?: FileList;
  birth_date?: string;
  gender?: "male" | "female" | "unknown";
  language_code?: string;
  public?: boolean;
  latitude?: string;
  longitude?: string;
};

export const EditProfilePage = () => {
  const navigate = useNavigate();
  const { data: profile, isPending } = useProfileQuery();
  const { data: genres = [] } = useGenresQuery();
  const { data: languages = [] } = useLanguagesQuery();

  if (isPending || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <EditProfileForm
      key={profile.id}
      profile={profile}
      genres={genres}
      languages={languages}
      onCancel={() => navigate(-1)}
      onSuccess={() => navigate("/profile")}
    />
  );
};

type EditProfileFormProps = {
  profile: Profile;
  genres: Genre[];
  languages: Language[];
  onCancel: () => void;
  onSuccess: () => void;
};

const EditProfileForm = ({
  profile,
  genres,
  languages,
  onCancel,
  onSuccess,
}: EditProfileFormProps) => {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      username: profile.username,
      bio: profile.bio ?? "",
      birth_date: profile.birthDate ?? "",
      gender: profile.gender ?? "unknown",
      language_code: profile.languageCode ?? "",
      public: profile.public ?? true,
      latitude: profile.latitude ? String(profile.latitude) : "",
      longitude: profile.longitude ? String(profile.longitude) : "",
    },
  });

  const updateProfile = useUpdateProfile();
  const updateGenres = useUpdateFavoriteGenres();
  const updatePicture = useUpdateProfilePicture();

  const [selectedGenres, setSelectedGenres] = useState<Set<number>>(
    () => new Set(profile.favoriteGenres.map((g) => g.id)),
  );
  const [genreError, setGenreError] = useState<string | null>(null);

  const selectedGenresList = Array.from(selectedGenres.values());

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

  const onSubmit = async (values: FormValues) => {
    if (selectedGenresList.length === 0) {
      setGenreError("Выберите хотя бы один жанр");
      return;
    }
    setGenreError(null);

    try {
      await updateProfile.mutateAsync({
        username: values.username,
        bio: values.bio,
        birth_date: values.birth_date,
        gender: values.gender,
        language_code: values.language_code || undefined,
        public: values.public,
        latitude: values.latitude ? Number(values.latitude) : undefined,
        longitude: values.longitude ? Number(values.longitude) : undefined,
      });
      await updateGenres.mutateAsync(selectedGenresList);
      if (values.avatar && values.avatar.length > 0) {
        const formData = new FormData();
        formData.append("file", values.avatar[0]);
        await updatePicture.mutateAsync(formData);
      }
      onSuccess();
    } catch {
      return;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={onCancel}
        >
          <ArrowLeft className="size-4" /> Назад
        </Button>
        <h1 className="text-xl font-semibold">Редактировать профиль</h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Основное</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input id="username" {...register("username", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">О себе</Label>
              <Textarea id="bio" rows={3} {...register("bio")} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Дата рождения</Label>
                <Input id="birth_date" type="date" {...register("birth_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Пол</Label>
                <select
                  id="gender"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  {...register("gender")}
                >
                  <option value="unknown">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language_code">Язык интерфейса</Label>
                <select
                  id="language_code"
                  className="w-full rounded-md border bg-background px-3 py-2"
                  {...register("language_code")}
                >
                  <option value="">Не выбран</option>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nameRu} ({lang.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="public">Видимость профиля</Label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="public" {...register("public")} />
                  <span className="text-sm text-muted-foreground">Показывать профиль другим</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Широта (для поиска рядом)</Label>
                <Input id="latitude" type="number" step="0.0001" {...register("latitude")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Долгота (для поиска рядом)</Label>
                <Input id="longitude" type="number" step="0.0001" {...register("longitude")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Аватар</Label>
              <Input type="file" accept="image/*" {...register("avatar")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Любимые жанры</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
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
            {genreError && (
              <p className="w-full text-sm text-destructive">{genreError}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            type="submit"
            className="gap-2"
            disabled={
              updateProfile.isPending ||
              updateGenres.isPending ||
              updatePicture.isPending
            }
          >
            <Save className="size-4" />
            Сохранить
          </Button>
        </div>
      </form>
    </div>
  );
};
