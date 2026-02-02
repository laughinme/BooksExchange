import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";

import { adminApi } from "@/shared/api/admin";
import { adaptBook } from "@/entities/book/model/adapters";
import { type Book } from "@/entities/book/model/types";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";

export const ModerationPage = () => {
  const queryClient = useQueryClient();
  const booksQuery = useQuery({
    queryKey: ["admin", "books", "pending"],
    queryFn: async () => {
      const data = await adminApi.listBooks({ status: "pending", limit: 50 });
      return Array.isArray(data) ? data.map(adaptBook) : [];
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (bookId: string) => adminApi.acceptBook(bookId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "books", "pending"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ bookId, reason }: { bookId: string; reason?: string }) =>
      adminApi.rejectBook(bookId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "books", "pending"] }),
  });

  const handleReject = (bookId: string) => {
    const reason = window.prompt("Укажите причину отклонения") || "";
    rejectMutation.mutate({ bookId, reason });
  };

  if (booksQuery.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Модерация книг</h1>

      <Card className="overflow-hidden">
        {booksQuery.data && booksQuery.data.length > 0 ? (
          <div className="divide-y">
            {booksQuery.data.map((book: Book) => (
              <div
                key={book.id}
                className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-4 md:items-center"
              >
                <div className="col-span-2">
                  <p className="font-semibold">{book.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {book.author.name}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Владелец: {book.owner?.username || book.owner?.email}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => acceptMutation.mutate(book.id)}
                  >
                    <CheckCircle className="mr-2 size-4" />
                    Одобрить
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(book.id)}
                  >
                    <XCircle className="mr-2 size-4" />
                    Отклонить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-muted-foreground">
            <ShieldCheck className="mx-auto mb-3 size-8" />
            Все книги проверены
          </div>
        )}
      </Card>
    </div>
  );
};
