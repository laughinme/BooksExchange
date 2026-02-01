import { useNavigate } from "react-router-dom";
import { Heart, ArrowLeft } from "lucide-react";

import { BookCard } from "@/entities/book/ui/book-card";
import { useAllBooks } from "@/entities/book/model/hooks";
import { Card } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";

export const LikedBooksPage = () => {
  const navigate = useNavigate();
  const { data: books = [], isPending, error } = useAllBooks({ limit: 200 });

  const likedBooks = books.filter((book) => book.isLiked);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-primary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" /> Назад
        </button>
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Heart className="size-6 text-primary" />
          Мои лайки
        </div>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      )}

      {error && (
        <Card className="p-6 text-center text-destructive">
          Не удалось загрузить понравившиеся книги
        </Card>
      )}

      {!isPending && !error && likedBooks.length === 0 && (
        <Card className="p-8 text-center space-y-2">
          <Heart className="mx-auto size-8 text-muted-foreground" />
          <p className="font-semibold">У вас пока нет понравившихся книг</p>
          <p className="text-sm text-muted-foreground">
            Нажмите на сердечко на карточке, чтобы добавить книгу в избранное.
          </p>
        </Card>
      )}

      {!isPending && !error && likedBooks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {likedBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onSelect={() => navigate(`/book/${book.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
