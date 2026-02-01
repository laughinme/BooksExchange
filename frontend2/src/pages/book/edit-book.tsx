import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Upload, Save } from "lucide-react";

import {
  useBookQuery,
  useUpdateBook,
  useUploadBookPhotos,
} from "@/entities/book/model/hooks";
import { type Book } from "@/entities/book/model/types";
import {
  useAuthorsQuery,
  useExchangeLocationsQuery,
  useGenresQuery,
} from "@/entities/reference/model/hooks";
import {
  type Author,
  type ExchangeLocation,
  type Genre,
} from "@/entities/reference/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { Spinner } from "@/shared/ui/spinner";

type FormValues = {
  title: string;
  description?: string | null;
  author_id: string;
  genre_id: string;
  language_code: string;
  condition: string;
  exchange_location_id: string;
  extra_terms?: string | null;
  pages?: string | null;
};

export const EditBookPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const numericBookId = bookId ? Number(bookId) : null;

  const { data: book, isPending, error } = useBookQuery(bookId ?? "");
  const { data: genres = [] } = useGenresQuery();
  const { data: authors = [] } = useAuthorsQuery();
  const { data: locations = [] } = useExchangeLocationsQuery(false);

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !book || numericBookId === null) {
    return (
      <Card className="m-6 p-6 text-center text-destructive">
        Не удалось загрузить книгу
      </Card>
    );
  }

  return (
    <EditBookForm
      key={book.id}
      bookId={numericBookId}
      book={book}
      authors={authors}
      genres={genres}
      locations={locations}
      onBack={() => navigate(-1)}
      onSuccess={() => navigate(`/book/${book.id}`)}
    />
  );
};

type EditBookFormProps = {
  bookId: number;
  book: Book;
  authors: Author[];
  genres: Genre[];
  locations: ExchangeLocation[];
  onBack: () => void;
  onSuccess: () => void;
};

const EditBookForm = ({
  bookId,
  book,
  authors,
  genres,
  locations,
  onBack,
  onSuccess,
}: EditBookFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: book.title,
      description: book.description ?? "",
      author_id: String(book.author.id),
      genre_id: String(book.genre.id),
      language_code: book.languageCode,
      condition: book.condition,
      exchange_location_id: String(book.exchangeLocation.id),
      extra_terms: book.extraTerms ?? "",
      pages: book.pages ? String(book.pages) : "",
    },
  });

  const updateBook = useUpdateBook();
  const uploadPhotos = useUploadBookPhotos();

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(book.photoUrls ?? []);

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 3);
    setImages(files);
    if (files.length) {
      setPreviews(files.map((file) => URL.createObjectURL(file)));
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await updateBook.mutateAsync({
        bookId,
        payload: {
          title: values.title,
          description: values.description ?? undefined,
          author_id: Number(values.author_id),
          genre_id: Number(values.genre_id),
          language_code: values.language_code,
          condition: values.condition,
          exchange_location_id: Number(values.exchange_location_id),
          extra_terms: values.extra_terms ?? undefined,
          pages: values.pages ? Number(values.pages) : undefined,
        },
      });

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((file) => formData.append("files", file));
        await uploadPhotos.mutateAsync({ bookId, formData });
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
          onClick={onBack}
        >
          <ArrowLeft className="size-4" /> Назад
        </Button>
        <div className="text-xl font-semibold">Редактировать книгу</div>
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
                      defaultChecked={condition === book.condition}
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
                key={`${url}-${index}`}
                className="relative aspect-[3/4] overflow-hidden rounded-lg"
              >
                <img
                  src={url}
                  alt={`preview-${index}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            <label className="flex aspect-[3/4] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              <Upload className="mb-2 size-5" />
              Обновить фото (до 3)
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
              />
            </label>
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
          <Button variant="outline" type="button" onClick={onBack}>
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={updateBook.isPending || uploadPhotos.isPending}
            className="gap-2"
          >
            <Save className="size-4" />
            {updateBook.isPending ? "Сохраняем..." : "Сохранить"}
          </Button>
        </div>
      </form>
    </div>
  );
};
