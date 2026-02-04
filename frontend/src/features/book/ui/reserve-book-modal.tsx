import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  X,
} from "lucide-react";

import { useReserveBook } from "@/entities/book/model/hooks";
import { type Book } from "@/entities/book/model/types";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type ReserveBookModalProps = {
  book: Book;
  onClose: () => void;
  onSuccess?: () => void;
};

const WEEK_DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

const formatYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseYmd = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const capitalizeFirst = (value: string) =>
  value ? value[0]!.toUpperCase() + value.slice(1) : value;

type CalendarPickerProps = {
  value: string;
  onChange: (next: string) => void;
};

const CalendarPicker = ({ value, onChange }: CalendarPickerProps) => {
  const selectedDate = value ? parseYmd(value) : null;
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    if (selectedDate) return startOfMonth(selectedDate);
    return startOfMonth(today);
  });

  const monthLabel = capitalizeFirst(
    new Intl.DateTimeFormat("ru-RU", {
      month: "long",
      year: "numeric",
    }).format(visibleMonth),
  );

  const firstDay = startOfMonth(visibleMonth);
  const weekdayIndexMondayFirst = (firstDay.getDay() + 6) % 7;
  const gridStart = addDays(firstDay, -weekdayIndexMondayFirst);

  const selectedYmd = value;
  const todayYmd = formatYmd(today);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border/60 bg-background/50 text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
          onClick={() =>
            setVisibleMonth(
              new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
            )
          }
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="min-w-0 text-center">
          <div className="text-sm font-semibold text-foreground">
            {monthLabel}
          </div>
          <div className="text-xs text-muted-foreground">
            Выберите дату встречи
          </div>
        </div>

        <button
          type="button"
          className="inline-flex size-9 items-center justify-center rounded-md border border-border/60 bg-background/50 text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
          onClick={() =>
            setVisibleMonth(
              new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
            )
          }
          aria-label="Следующий месяц"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 42 }).map((_, idx) => {
          const date = addDays(gridStart, idx);
          const ymd = formatYmd(date);
          const isInMonth = date.getMonth() === visibleMonth.getMonth();
          const isSelected = selectedYmd === ymd;
          const isToday = todayYmd === ymd;

          return (
            <button
              key={ymd}
              type="button"
              onClick={() => {
                onChange(ymd);
                setVisibleMonth(startOfMonth(date));
              }}
              className={[
                "relative flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent/70",
                isInMonth ? "text-foreground" : "text-muted-foreground/60",
              ].join(" ")}
              aria-label={new Intl.DateTimeFormat("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(date)}
            >
              {date.getDate()}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 h-1 w-5 rounded-full bg-primary/60" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="be-shadow-none h-8 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            const next = startOfMonth(today);
            setVisibleMonth(next);
            onChange(formatYmd(today));
          }}
        >
          Сегодня
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="be-shadow-none h-8 px-2 text-muted-foreground hover:text-foreground"
          disabled={!value}
          onClick={() => onChange("")}
        >
          Очистить
        </Button>
      </div>
    </div>
  );
};

export const ReserveBookModal = ({
  book,
  onClose,
  onSuccess,
}: ReserveBookModalProps) => {
  const [comment, setComment] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingClock, setMeetingClock] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const reserveMutation = useReserveBook();
  const [error, setError] = useState<string | null>(null);

  const selectedSummary = meetingTime
    ? new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(meetingTime))
    : null;

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
    } catch {
      setError("Не удалось забронировать книгу. Попробуйте еще раз.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-xl overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-gradient-to-b from-muted/20 to-transparent pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>Бронирование</CardTitle>
              <CardDescription className="mt-1">
                Вы бронируете книгу &quot;{book.title}&quot;
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="be-shadow-none text-muted-foreground hover:text-foreground"
              onClick={onClose}
              aria-label="Закрыть"
            >
              <X className="size-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-h-[calc(100vh-6rem)] overflow-auto pt-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">UTC</span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CalendarDays className="size-4" />
                    Дата
                  </div>
                  <CalendarPicker
                    value={meetingDate}
                    onChange={(value) => {
                      setMeetingDate(value);
                      if (!value) {
                        setMeetingClock("");
                        setMeetingTime("");
                        return;
                      }
                      setMeetingTime(
                        meetingClock ? `${value}T${meetingClock}` : "",
                      );
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Clock3 className="size-4" />
                      Время
                    </div>
                    {selectedSummary && (
                      <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 px-2 py-1 text-[11px] text-muted-foreground">
                        <Check className="size-3 text-primary" />
                        {selectedSummary}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-border/60 bg-muted/10 p-3">
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        "09:00",
                        "10:00",
                        "11:00",
                        "12:00",
                        "13:00",
                        "14:00",
                        "15:00",
                        "16:00",
                        "17:00",
                        "18:00",
                        "19:00",
                        "20:00",
                        "21:00",
                      ].map((time) => {
                        const active = meetingClock === time;
                        const disabled = !meetingDate;
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setMeetingClock(time);
                              setMeetingTime(
                                meetingDate ? `${meetingDate}T${time}` : "",
                              );
                            }}
                            className={[
                              "inline-flex items-center justify-center rounded-lg border px-2 py-2 text-sm font-semibold transition-colors",
                              disabled
                                ? "border-border/50 bg-background/30 text-muted-foreground/50"
                                : "border-border/60 bg-background/50 text-foreground hover:bg-accent/70",
                              active
                                ? "border-primary/40 bg-primary text-primary-foreground hover:bg-primary"
                                : "",
                            ].join(" ")}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Свое время
                      </Label>
                      <div className="relative">
                        <Clock3 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="time"
                          step={900}
                          className="pl-9"
                          value={meetingClock}
                          onChange={(e) => {
                            const value = e.target.value;
                            setMeetingClock(value);
                            setMeetingTime(
                              meetingDate && value
                                ? `${meetingDate}T${value}`
                                : "",
                            );
                          }}
                          disabled={!meetingDate}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="be-shadow-none h-8 px-2 text-muted-foreground hover:text-foreground"
                          disabled={!meetingClock}
                          onClick={() => {
                            setMeetingClock("");
                            setMeetingTime("");
                          }}
                        >
                          Сбросить
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Комментарий для владельца
              </Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Например: смогу после 18:00 или на выходных"
                rows={4}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
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
