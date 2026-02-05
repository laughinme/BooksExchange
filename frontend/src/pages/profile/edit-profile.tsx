import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Crosshair, Save } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

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
};

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const DEFAULT_CENTER: [number, number] = [55.7558, 37.6173];

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
  const { register, handleSubmit, watch } = useForm<FormValues>({
    defaultValues: {
      username: profile.username,
      bio: profile.bio ?? "",
      birth_date: profile.birthDate ?? "",
      gender: profile.gender ?? "unknown",
      language_code: profile.languageCode ?? "",
      public: profile.public ?? true,
    },
  });

  const updateProfile = useUpdateProfile();
  const updateGenres = useUpdateFavoriteGenres();
  const updatePicture = useUpdateProfilePicture();

  const [selectedGenres, setSelectedGenres] = useState<Set<number>>(
    () => new Set(profile.favoriteGenres.map((g) => g.id)),
  );
  const [genreError, setGenreError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl ?? null);
  const [coords, setCoords] = useState<[number, number] | null>(
    profile.latitude != null && profile.longitude != null
      ? [profile.latitude, profile.longitude]
      : null,
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const avatarFile = watch("avatar");

  useEffect(() => {
    if (avatarFile && avatarFile.length > 0) {
      const file = avatarFile[0];
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setAvatarPreview(profile.avatarUrl ?? null);
  }, [avatarFile, profile.avatarUrl]);

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

  const handleDetectLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Геолокация недоступна в этом браузере");
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setGeoError("Не удалось определить местоположение");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
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
        birth_date: values.birth_date || undefined,
        gender: values.gender,
        language_code: values.language_code?.trim() || undefined,
        public: values.public,
        ...(coords ? { latitude: coords[0], longitude: coords[1] } : {}),
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
            <div className="flex flex-col items-center gap-3">
              <label
                htmlFor="avatar"
                className="group relative cursor-pointer"
                aria-label="Изменить аватар"
              >
                <div className="flex size-28 items-center justify-center overflow-hidden rounded-full border bg-muted">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Аватар"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-muted-foreground">
                      {profile.username?.[0] ?? "?"}
                    </span>
                  )}
                </div>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                  <Camera className="size-5" />
                  <span className="text-xs font-medium">Сменить</span>
                </div>
              </label>
              <input
                id="avatar"
                type="file"
                className="hidden"
                accept="image/*"
                {...register("avatar")}
              />
              <p className="text-xs text-muted-foreground">
                Нажмите на аватар, чтобы заменить
              </p>
            </div>
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
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Label>Геопозиция для поиска рядом</Label>
                  <p className="text-xs text-muted-foreground">
                    Можно определить по GPS или выбрать точку на карте
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleDetectLocation}
                  disabled={locating}
                >
                  <Crosshair className="size-4" />
                  {locating ? "Определяем..." : "Определить"}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {coords
                  ? `Текущие координаты: ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`
                  : "Координаты не указаны"}
              </div>
              {geoError && (
                <p className="text-xs text-destructive">{geoError}</p>
              )}
              <div className="h-64 overflow-hidden rounded-lg border">
                <MapContainer
                  center={coords ?? DEFAULT_CENTER}
                  zoom={coords ? 13 : 4}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker onSelect={setCoords} />
                  <MapCenterer center={coords ?? DEFAULT_CENTER} />
                  {coords && <Marker position={coords} />}
                </MapContainer>
              </div>
              <p className="text-xs text-muted-foreground">
                Нажмите на карту, чтобы указать точку
              </p>
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

type LocationPickerProps = {
  onSelect: (coords: [number, number]) => void;
};

const LocationPicker = ({ onSelect }: LocationPickerProps) => {
  useMapEvents({
    click: (event) => {
      onSelect([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
};

type MapCentererProps = {
  center: [number, number];
};

const MapCenterer = ({ center }: MapCentererProps) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};
