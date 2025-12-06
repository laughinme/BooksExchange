import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Book, Camera, Upload, X } from "lucide-react";

import { useCreateBook, useUploadBookPhotos } from "@/entities/book/model/hooks";
import { type CreateBookPayload } from "@/entities/book/model/types";
import {
  useAuthorsQuery,
  useExchangeLocationsQuery,
  useGenresQuery,
} from "@/entities/reference/model/hooks";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { Spinner } from "@/shared/ui/spinner";

type FormValues = {
  title: string;
  description?: string;
  author_id: string;
  genre_id: string;
  language_code: string;
  condition: string;
  exchange_location_id: string;
  extra_terms?: string;
  pages?: string;
};

export const AddBookPage = () => {
  const navigate = useNavigate();
  const { data: genres = [], isLoading: genresLoading } = useGenresQuery();
  const { data: authors = [], isLoading: authorsLoading } = useAuthorsQuery();
  const {
    data: locations = [],
    isLoading: locationsLoading,
  } = useExchangeLocationsQuery(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      language_code: "ru",
      condition: "good",
    },
  });

  const createBook = useCreateBook();
  const uploadPhotos = useUploadBookPhotos();

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const isLoading = genresLoading || authorsLoading || locationsLoading;

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 3);
    setImages(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    const payload: CreateBookPayload = {
      title: values.title,
      description: values.description,
      author_id: Number(values.author_id),
      genre_id: Number(values.genre_id),
      language_code: values.language_code,
      condition: values.condition,
      exchange_location_id: Number(values.exchange_location_id),
      extra_terms: values.extra_terms,
      pages: values.pages ? Number(values.pages) : undefined,
    };

    try {
      const data = await createBook.mutateAsync(payload);
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((file) => formData.append("files", file));
        await uploadPhotos.mutateAsync({ bookId: data.id, formData });
      }
      navigate("/home");
    } catch (err) {
      // ignore; UI will stay
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" /> Назад
        </Button>
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Book className="size-5 text-primary" />
          Добавить книгу
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Название *</Label>
              <Input
                id="title"
                {...register("title", { required: "Название обязательно" })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Автор *</Label>
              <Select
                id="author"
                {...register("author_id", { required: "Автор обязателен" })}
              >
                <option value="">Выберите автора</option>
                {authors.map((author) => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </Select>
              {errors.author_id && (
                <p className="text-sm text-destructive">
                  {errors.author_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Жанр *</Label>
              <Select
                id="genre"
                {...register("genre_id", { required: "Жанр обязателен" })}
              >
                <option value="">Выберите жанр</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </Select>
              {errors.genre_id && (
                <p className="text-sm text-destructive">
                  {errors.genre_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Состояние</Label>
              <div className="grid grid-cols-2 gap-2">
                {["new", "perfect", "good", "normal"].map((condition) => (
                  <label
                    key={condition}
                    className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm capitalize"
                  >
                    <input
                      type="radio"
                      value={condition}
                      {...register("condition")}
                      defaultChecked={condition === "good"}
                    />
                    {condition}
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea id="description" rows={4} {...register("description")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            <CardTitle>Фотографии</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {previews.map((url, index) => (
              <div
                key={url}
                className="relative aspect-[3/4] overflow-hidden rounded-lg"
              >
                <img
                  src={url}
                  alt={`preview-${index}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                <Upload className="mb-2 size-5" />
                Добавить фото (до 3)
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                />
              </label>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Дополнительно</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">Точка обмена *</Label>
              <Select
                id="location"
                {...register("exchange_location_id", {
                  required: "Выберите точку обмена",
                })}
              >
                <option value="">Выберите точку обмена</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.title}
                  </option>
                ))}
              </Select>
              {errors.exchange_location_id && (
                <p className="text-sm text-destructive">
                  {errors.exchange_location_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Язык</Label>
              <Input
                id="language"
                placeholder="ru"
                {...register("language_code")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pages">Страниц</Label>
              <Input id="pages" type="number" {...register("pages")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="extra">Дополнительные условия</Label>
              <Textarea id="extra" rows={3} {...register("extra_terms")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={createBook.isPending || uploadPhotos.isPending}
            className="gap-2"
          >
            <Book className="size-4" />
            {createBook.isPending ? "Добавление..." : "Добавить книгу"}
          </Button>
        </div>
      </form>
    </div>
  );
};
