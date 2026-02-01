import { useState } from "react";
import { X } from "lucide-react";

import { useReserveBook } from "@/entities/book/model/hooks";
import { type Book } from "@/entities/book/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";

type ReserveBookModalProps = {
  book: Book;
  onClose: () => void;
  onSuccess?: () => void;
};

export const ReserveBookModal = ({
  book,
  onClose,
  onSuccess,
}: ReserveBookModalProps) => {
  const [comment, setComment] = useState("");
  const reserveMutation = useReserveBook();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await reserveMutation.mutateAsync({ bookId: book.id, comment });
      onSuccess?.();
      onClose();
    } catch {
      setError("Не удалось забронировать книгу. Попробуйте еще раз.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <Card className="relative w-full max-w-lg">
        <button
          type="button"
          className="absolute right-3 top-3 text-muted-foreground"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X className="size-5" />
        </button>
        <CardHeader>
          <CardTitle>Бронирование</CardTitle>
          <p className="text-sm text-muted-foreground">
            Вы бронируете книгу &quot;{book.title}&quot;
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий для владельца (необязательно)"
              rows={4}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={reserveMutation.isPending}>
                {reserveMutation.isPending ? "Отправка..." : "Забронировать"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
