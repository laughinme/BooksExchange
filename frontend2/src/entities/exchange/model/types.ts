import type { Book, BookDto, UserSummary, UserSummaryDto } from "@/entities/book/model/types";

export type ExchangeProgress =
  | "created"
  | "accepted"
  | "declined"
  | "finished"
  | "canceled";

export type ExchangeDto = {
  id: string;
  book: BookDto;
  owner: UserSummaryDto;
  requester: UserSummaryDto;
  progress: ExchangeProgress;
  created_at: string;
  cancel_reason?: string | null;
};

export type Exchange = {
  id: string;
  book: Book;
  owner: UserSummary;
  requester: UserSummary;
  progress: ExchangeProgress;
  createdAt: string;
  cancelReason?: string | null;
};
