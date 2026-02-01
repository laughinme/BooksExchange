import type { Book, BookDto, UserSummary, UserSummaryDto } from "@/entities/book/model/types";

export type ExchangeProgress =
  | "created"
  | "accepted"
  | "declined"
  | "finished"
  | "canceled";

export type ExchangeDto = {
  id: number;
  book: BookDto;
  owner: UserSummaryDto;
  requester: UserSummaryDto;
  progress: ExchangeProgress;
  created_at: string;
  cancel_reason?: string | null;
};

export type Exchange = {
  id: number;
  book: Book;
  owner: UserSummary;
  requester: UserSummary;
  progress: ExchangeProgress;
  createdAt: string;
  cancelReason?: string | null;
};
