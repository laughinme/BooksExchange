import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, ShieldCheck } from "lucide-react";

import { adminApi } from "@/shared/api/admin";
import { adaptBook } from "@/entities/book/model/adapters";
import { type Book } from "@/entities/book/model/types";
import { isDebug } from "@/shared/config/env";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

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
    if (isDebug) return;
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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Модерация книг</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Проверьте новые книги перед тем, как они попадут в каталог.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          На проверке:{" "}
          <span className="font-semibold text-foreground">{booksQuery.data?.length ?? 0}</span>
        </div>
      </div>

      <Card className="be-shadow-none be-backdrop-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Очередь модерации</CardTitle>
          <CardDescription>Показываем до 50 книг в статусе “pending”.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {booksQuery.data && booksQuery.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Книга</TableHead>
                  <TableHead>Владелец</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {booksQuery.data.map((book: Book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{book.title}</p>
                        <p className="truncate text-sm text-muted-foreground">{book.author.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {book.owner?.username || book.owner?.email || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="be-shadow-none"
                          onClick={() => acceptMutation.mutate(book.id)}
                        >
                          <CheckCircle className="size-4" />
                          <span className="hidden sm:inline">Одобрить</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="be-shadow-none"
                          disabled={isDebug || rejectMutation.isPending}
                          onClick={() => handleReject(book.id)}
                        >
                          <XCircle className="size-4" />
                          <span className="hidden sm:inline">Отклонить</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-10 text-center text-muted-foreground">
              <ShieldCheck className="mx-auto mb-3 size-8" />
              Все книги проверены
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
