import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookCheck, Heart, Info, MapPin, Share2, Eye, Edit } from "lucide-react";

import {
  useBookQuery,
  useRecordBookClick,
  useToggleLike,
} from "@/entities/book/model/hooks";
import { type Book } from "@/entities/book/model/types";
import { ReserveBookModal } from "@/features/book/ui/reserve-book-modal";
import { useProfileQuery } from "@/entities/profile/model/hooks";
import { type Profile } from "@/entities/profile/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";

export const BookDetailPage = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { data: book, isPending, error } = useBookQuery(bookId ?? "");
  const { data: profile } = useProfileQuery();
  const recordClick = useRecordBookClick();

  useEffect(() => {
    if (bookId) {
      recordClick.mutate(Number(bookId));
    }
  }, [bookId, recordClick]);

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !book) {
    return (
      <Card className="m-6 p-6 text-center text-destructive">
        Не удалось загрузить книгу.
      </Card>
    );
  }

  return (
    <BookDetailContent
      key={book.id}
      book={book}
      profile={profile}
      onBack={() => navigate(-1)}
    />
  );
};

type BookDetailContentProps = {
  book: Book;
  profile?: Profile;
  onBack: () => void;
};

const BookDetailContent = ({ book, profile, onBack }: BookDetailContentProps) => {
  const toggleLike = useToggleLike();
  const navigate = useNavigate();

  const [activeImage, setActiveImage] = useState(0);
  const [likeCount, setLikeCount] = useState(book.totalLikes);
  const [isLiked, setIsLiked] = useState(book.isLiked);
  const [openReserve, setOpenReserve] = useState(false);

  const isOwner = useMemo(
    () => (book && profile ? book.owner?.id === profile.id : false),
    [book, profile],
  );

  const handleLike = async () => {
    const optimistic = !isLiked;
    setIsLiked(optimistic);
    setLikeCount((prev) => (prev ?? 0) + (optimistic ? 1 : -1));
    try {
      await toggleLike.mutateAsync(book.id);
    } catch {
      setIsLiked(!optimistic);
      setLikeCount((prev) => (prev ?? 0) + (optimistic ? -1 : 1));
    }
  };

  const currentImage =
    book.photoUrls[activeImage] ||
    "https://placehold.co/400x600?text=No+Image";

  return (
    <>
      {openReserve && (
        <ReserveBookModal
          book={book}
          onClose={() => setOpenReserve(false)}
          onSuccess={() => setOpenReserve(false)}
        />
      )}
      <div className="p-4 md:p-8 space-y-6">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" /> Назад
        </Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardContent className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
              <div>
                <img
                  src={currentImage}
                  alt={book.title}
                  className="aspect-[3/4] w-full rounded-lg object-cover"
                />
                <div className="mt-3 flex gap-2 overflow-auto">
                  {book.photoUrls.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`h-16 w-14 flex-shrink-0 overflow-hidden rounded border ${index === activeImage ? "border-primary" : "border-transparent"}`}
                    >
                      <img
                        src={url}
                        alt={`thumb-${index}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{book.genre.name}</Badge>
                    <Badge variant="muted" className="capitalize">
                      {book.condition}
                    </Badge>
                  </div>
                  <h1 className="text-3xl font-bold leading-tight">
                    {book.title}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {book.author.name}
                  </p>
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <strong>Язык:</strong> {book.languageCode?.toUpperCase()}
                  </p>
                  {book.pages && (
                    <p>
                      <strong>Страниц:</strong> {book.pages}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleLike}
                    variant={isLiked ? "default" : "secondary"}
                  >
                    <Heart
                      className="size-4"
                      fill={isLiked ? "currentColor" : "none"}
                    />
                    {isLiked ? "В избранном" : "Лайк"} ({likeCount ?? 0})
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-4 p-6">
                <CardTitle className="text-lg">
                  {isOwner ? "Ваша книга" : book.isAvailable ? "Доступна" : "Недоступна"}
                </CardTitle>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4" />
                  <span>{book.exchangeLocation.address}</span>
                </div>
                <Button
                  disabled={!book.isAvailable && !isOwner}
                  onClick={() =>
                    isOwner
                      ? navigate(`/book/${book.id}/edit`)
                      : setOpenReserve(true)
                  }
                  className="w-full gap-2"
                >
                  {isOwner ? (
                    <>
                      <Edit className="size-4" /> Редактировать
                    </>
                  ) : (
                    "Забронировать"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Статистика</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="space-y-1">
                  <Eye className="mx-auto size-5 text-muted-foreground" />
                  <div className="font-semibold">{book.totalViews}</div>
                  <p className="text-muted-foreground">Просмотров</p>
                </div>
                <div className="space-y-1">
                  <Heart className="mx-auto size-5 text-muted-foreground" />
                  <div className="font-semibold">{likeCount ?? 0}</div>
                  <p className="text-muted-foreground">Лайков</p>
                </div>
                <div className="space-y-1">
                  <BookCheck className="mx-auto size-5 text-muted-foreground" />
                  <div className="font-semibold">{book.totalReserves}</div>
                  <p className="text-muted-foreground">Брони</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Владелец</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{book.owner?.username}</p>
                <p className="text-muted-foreground">{book.owner?.email}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Описание</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground leading-relaxed">
            {book.description || "Владелец не добавил описание."}
          </CardContent>
        </Card>

        {book.extraTerms && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Info className="size-4 text-primary" />
              <CardTitle>Дополнительные условия</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {book.extraTerms}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};
