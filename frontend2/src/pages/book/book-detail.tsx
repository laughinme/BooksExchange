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
import { useAuthorQuery, useGenreQuery } from "@/entities/reference/model/hooks";
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
      profile={profile ?? undefined}
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
  const authorDetails = useAuthorQuery(book.author.id);
  const genreDetails = useGenreQuery(book.genre.id);

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
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" /> Назад
        </Button>

        <div className="grid grid-cols-1 gap-6 rounded-xl border border-border/70 bg-card/50 p-4 be-shadow-panel md:p-8 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative overflow-hidden rounded-lg border border-border/70 bg-card p-4 md:p-6">
              <img
                src={currentImage}
                alt={book.title}
                className="aspect-[3/4] w-full rounded-md object-cover"
              />
              {book.photoUrls.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-auto">
                  {book.photoUrls.map((url, index) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`h-16 w-14 flex-shrink-0 overflow-hidden rounded border transition ${index === activeImage ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img
                        src={url}
                        alt={`thumb-${index}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Card className="bg-card/90 border border-border/70">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{book.genre.name}</Badge>
                    <Badge variant="muted" className="capitalize">
                      {book.condition}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <Share2 className="size-4" />
                    </Button>
                    <Button
                      variant={isLiked ? "default" : "secondary"}
                      size="icon"
                      className="border border-border/60"
                      onClick={handleLike}
                    >
                      <Heart
                        className="size-4"
                        fill={isLiked ? "currentColor" : "none"}
                      />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h1 className="text-3xl font-bold leading-tight text-foreground">
                    {book.title}
                  </h1>
                  <p className="text-lg text-primary font-semibold">
                    {authorDetails.data?.name ?? book.author.name}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/60 bg-secondary/60 p-4 text-sm text-muted-foreground sm:grid-cols-3">
                  <div>
                    <p className="uppercase text-xs tracking-wide">Язык</p>
                    <p className="font-semibold text-foreground">{book.languageCode?.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="uppercase text-xs tracking-wide">Страниц</p>
                    <p className="font-semibold text-foreground">{book.pages ?? "—"}</p>
                  </div>
                  <div>
                    <p className="uppercase text-xs tracking-wide">Статус</p>
                    <p className={`font-semibold ${book.isAvailable ? "text-emerald-400" : "text-amber-300"}`}>
                      {book.isAvailable ? "Доступна" : "Недоступна"}
                    </p>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {book.description || "Владелец не добавил описание."}
                </p>

                {book.extraTerms && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                    <div className="flex items-center gap-2 font-semibold text-amber-200">
                      <Info className="size-4" />
                      Дополнительные условия
                    </div>
                    <p className="mt-2">{book.extraTerms}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border border-border/70 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <CardTitle className="text-lg">
                  {isOwner ? "Ваша книга" : book.isAvailable ? "Доступна" : "Недоступна"}
                </CardTitle>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 size-4 text-primary/80" />
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

            <Card className="border border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="text-lg">Статистика</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="space-y-1">
                  <Eye className="mx-auto size-5 text-muted-foreground" />
                  <div className="font-semibold text-foreground">{book.totalViews}</div>
                  <p className="text-muted-foreground">Просмотров</p>
                </div>
                <div className="space-y-1">
                  <Heart className="mx-auto size-5 text-muted-foreground" />
                  <div className="font-semibold text-foreground">{likeCount ?? 0}</div>
                  <p className="text-muted-foreground">Лайков</p>
                </div>
                <div className="space-y-1">
                  <BookCheck className="mx-auto size-5 text-muted-foreground" />
                  <div className="font-semibold text-foreground">{book.totalReserves}</div>
                  <p className="text-muted-foreground">Брони</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/70 bg-card/90">
              <CardHeader>
                <CardTitle className="text-lg">Владелец</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">{book.owner?.username}</p>
                <p className="text-muted-foreground">{book.owner?.email}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};
