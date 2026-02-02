import { useState } from "react";
import { isAxiosError } from "axios";
import { X } from "lucide-react";

import { useReserveBook } from "@/entities/book/model/hooks";
import { type Book } from "@/entities/book/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
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
  const [meetingTime, setMeetingTime] = useState<string>("");
  const reserveMutation = useReserveBook();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const payload = {
        bookId: book.id,
        comment,
        meeting_time: meetingTime
          ? new Date(meetingTime).toISOString()
          : undefined,
      };
      await reserveMutation.mutateAsync(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      const detail =
        isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : null;
      setError(
        typeof detail === "string"
          ? detail
          : "Не удалось забронировать книгу. Попробуйте еще раз.",
      );
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
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Время встречи (опционально)
              </Label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Будет отправлено в UTC. Укажите удобное время для передачи книги.
              </p>
            </div>
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
