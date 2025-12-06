import { Award, Heart, MapPin } from "lucide-react";

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
  pending: { text: "На модерации", className: "bg-yellow-100 text-yellow-800" },
  rejected: { text: "Отклонено", className: "bg-red-100 text-red-700" },
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

  return (
    <Card className="group h-full overflow-hidden border-muted/40 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
          className="block aspect-[3/4] w-full cursor-pointer bg-cover bg-center"
          style={{
            backgroundImage: `url(${book.photoUrls[0] || "https://placehold.co/400x600?text=No+Image"})`,
          }}
        >
          {showStatus && statusInfo && (
            <span
              className={`absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${statusInfo.className}`}
            >
              {statusInfo.text}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 rounded-full bg-black/40 text-white hover:bg-black/60"
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

      <CardContent className="flex flex-col gap-2 p-4">
        <div
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
          className="space-y-2"
        >
          <Badge variant="secondary" className="font-medium">
            {book.genre.name}
          </Badge>
          <div>
            <p className="line-clamp-2 text-lg font-semibold leading-tight">
              {book.title}
            </p>
            <p className="text-sm text-muted-foreground">{book.author.name}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <MapPin className="size-4" />
            <span className="truncate">{book.exchangeLocation.title}</span>
          </p>
          <p className="flex items-center gap-2 capitalize">
            <Award className="size-4" />
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
