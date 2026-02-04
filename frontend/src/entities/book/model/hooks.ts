import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { bookApi } from "@/shared/api/books";
import { adaptBook } from "./adapters";
import {
  type Book,
  type BookFilters,
  type CreateBookPayload,
  type UpdateBookPayload,
} from "./types";

export const bookKeys = {
  all: ["books"] as const,
  forYou: (filters: BookFilters) => ["books", "for-you", filters] as const,
  allBooks: (filters?: BookFilters) => ["books", "all", filters] as const,
  detail: (bookId: string) => ["books", "detail", bookId] as const,
  mine: ["books", "mine"] as const,
};

export const useBooksForYou = (filters: BookFilters) =>
  useQuery<Book[]>({
    queryKey: bookKeys.forYou(filters),
    queryFn: async () => {
      const data = await bookApi.getForYou(filters);
      return data.map(adaptBook);
    },
  });

export const useAllBooks = (filters?: BookFilters) =>
  useQuery<Book[]>({
    queryKey: bookKeys.allBooks(filters),
    queryFn: async () => {
      const data = await bookApi.getAll(filters ?? {});
      return data.map(adaptBook);
    },
  });

export const useMyBooks = () =>
  useQuery<Book[]>({
    queryKey: bookKeys.mine,
    queryFn: async () => {
      const data = await bookApi.getMine();
      return data.map(adaptBook);
    },
  });

export const useBookQuery = (bookId: string) =>
  useQuery<Book>({
    queryKey: bookKeys.detail(bookId),
    queryFn: async () => {
      const data = await bookApi.getById(bookId);
      return adaptBook(data);
    },
  });

export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookId: string) => bookApi.toggleLike(bookId),
    onSuccess: (_, bookId) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
};

export const useReserveBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookId,
      comment,
      meeting_time,
    }: {
      bookId: string;
      comment?: string;
      meeting_time?: string;
    }) => bookApi.reserve(bookId, { comment, meeting_time }),
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
};

export const useRecordBookClick = () =>
  useMutation({
    mutationFn: (bookId: string) => bookApi.recordClick(bookId),
  });

export const useCreateBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookPayload) => bookApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.mine });
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
};

export const useUpdateBook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookId,
      payload,
    }: {
      bookId: string;
      payload: UpdateBookPayload;
    }) => bookApi.update(bookId, payload),
    onSuccess: (data) => {
      const adapted = adaptBook(data);
      queryClient.setQueryData<Book>(bookKeys.detail(data.id), adapted);
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: bookKeys.mine });
      queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
};

export const useUploadBookPhotos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookId,
      formData,
    }: {
      bookId: string;
      formData: FormData;
    }) => bookApi.uploadPhotos(bookId, formData),
    onSuccess: (_, { bookId }) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
};
