import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";

import { BookCard } from "@/entities/book/ui/book-card";
import { bookKeys, useBooksForYou, useToggleLike } from "@/entities/book/model/hooks";
import { type BookFilters } from "@/entities/book/model/types";
import { ReserveBookModal } from "@/features/book/ui/reserve-book-modal";
import { BookFiltersPanel } from "@/features/book/ui/book-filters";
import { Card } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import { Button } from "@/shared/ui/button";

export const HomePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<BookFilters>({
    query: searchParams.get("query") ?? "",
  });
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const toggleLike = useToggleLike();

  useEffect(() => {
    const query = searchParams.get("query") ?? "";
    setFilters((prev) => ({ ...prev, query }));
  }, [searchParams]);

  const { data: books = [], isPending, error } = useBooksForYou(filters);

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? null,
    [books, selectedBookId],
  );

  const handleLikeToggle = async (bookId: number) => {
    const current = books.find((b) => b.id === bookId);
    const nextLiked = current ? !current.isLiked : true;

    queryClient.setQueryData(
      bookKeys.forYou(filters),
      (prev?: typeof books) =>
        prev?.map((book) =>
          book.id === bookId
            ? {
                ...book,
                isLiked: nextLiked,
                totalLikes: Math.max(
                  0,
                  (book.totalLikes ?? 0) + (nextLiked ? 1 : -1),
                ),
              }
            : book,
        ),
    );

    try {
      await toggleLike.mutateAsync(bookId);
    } catch {
      queryClient.invalidateQueries({ queryKey: bookKeys.forYou(filters) });
    }
  };

  return (
    <div className="p-4 md:p-8">
      {selectedBook && (
        <ReserveBookModal
          book={selectedBook}
          onClose={() => setSelectedBookId(null)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: bookKeys.forYou(filters) })
          }
        />
      )}

      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Для вас</h1>
        <p className="text-muted-foreground">
          Рекомендации на основе ваших предпочтений
        </p>
      </div>

      <div className="mb-6">
        <BookFiltersPanel value={filters} onChange={setFilters} />
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      )}

      {error && (
        <Card className="p-6 text-center text-destructive">
          Не удалось загрузить книги.
        </Card>
      )}

      {!isPending && !error && books.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold">Книги не найдены</p>
          <p className="text-muted-foreground">
            Измените фильтры или добавьте свою книгу
          </p>
          <Button className="mt-4" onClick={() => navigate("/add-book")}>
            Добавить книгу
          </Button>
        </Card>
      )}

      {!isPending && !error && books.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={() => navigate(`/book/${book.id}`)}
              onReserve={() => setSelectedBookId(book.id)}
              onLikeToggle={handleLikeToggle}
              likePending={toggleLike.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
};
