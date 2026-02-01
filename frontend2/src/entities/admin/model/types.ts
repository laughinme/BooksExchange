export type CursorPage<T> = {
  items: T[];
  next_cursor?: string | null;
};

export type AdminBookStatsPoint = {
  day: string;
  views: number;
  likes: number;
  reserves: number;
};
