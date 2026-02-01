import { Award, Heart, ImageOff, MapPin } from "lucide-react";

import { type Book } from "@/entities/book/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

type BookCardProps = {
  book: Book;
  onSelect?: () => void;
  onReserve?: () => void;
  onLikeToggle?: (bookId: number) => void;
  showStatus?: boolean;
  likePending?: boolean;
};

const statusMap: Record<
  string,
  { text: string; className: string } | undefined
> = {
  pending: {
    text: "На модерации",
    className: "border border-primary/40 bg-primary/15 text-primary",
  },
  rejected: {
    text: "Отклонено",
    className: "border border-destructive/40 bg-destructive/15 text-destructive",
  },
};

export const BookCard = ({
  book,
  onSelect,
  onReserve,
  onLikeToggle,
  showStatus = false,
  likePending = false,
}: BookCardProps) => {
  const handleLike = (event: React.MouseEvent) => {
    event.stopPropagation();
    onLikeToggle?.(book.id);
  };

  const statusInfo = book.approvalStatus ? statusMap[book.approvalStatus] : undefined;
  const coverUrl = book.photoUrls[0] || null;

  return (
    <Card className="group h-full overflow-hidden border-border/70 bg-card/90 transition-all hover:-translate-y-1 hover:border-primary/40">
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
          className="relative block aspect-[3/4] w-full cursor-pointer overflow-hidden bg-card"
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 be-cover-fallback" aria-hidden="true" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/60" />
          {showStatus && statusInfo && (
            <span
              className={`absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-semibold shadow ${statusInfo.className}`}
            >
              {statusInfo.text}
            </span>
          )}

          {!coverUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <div className="rounded-full border border-border/70 bg-card/60 p-3 be-shadow-popover">
                <ImageOff className="size-6 text-primary/80" />
              </div>
              <p className="text-sm font-semibold tracking-wide">Нет изображения</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10 rounded-full bg-black/60 text-white hover:bg-black/80"
          onClick={handleLike}
          disabled={likePending}
          aria-label="Поставить лайк"
        >
          <Heart
            className="size-4"
            fill={book.isLiked ? "currentColor" : "none"}
            strokeWidth={book.isLiked ? 1.5 : 2}
          />
        </Button>
      </div>

      <CardContent className="flex flex-col gap-3 p-4">
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
          className="space-y-2"
        >
          <Badge variant="default" className="font-medium capitalize">
            {book.genre.name}
          </Badge>
          <div>
            <p className="line-clamp-2 text-lg font-semibold leading-tight text-foreground">
              {book.title}
            </p>
            <p className="text-sm text-muted-foreground">{book.author.name}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="size-4 text-primary/80" />
            <span className="truncate">{book.exchangeLocation.title}</span>
          </p>
          <p className="flex items-center gap-2 capitalize">
            <Award className="size-4 text-primary/80" />
            {book.condition}
          </p>
        </div>

        <Button
          variant={book.isAvailable ? "default" : "secondary"}
          className="mt-auto w-full"
          disabled={!book.isAvailable || likePending}
          onClick={(event) => {
            event.stopPropagation();
            if (book.isAvailable) {
              onReserve?.();
            }
          }}
        >
          {book.isAvailable ? "Забронировать" : "Недоступна"}
        </Button>
      </CardContent>
    </Card>
  );
};
