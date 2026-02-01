import { useState, type CSSProperties } from "react";
import { ChevronDown, Filter, MapPin, Star } from "lucide-react";

import { type BookFilters as BookFiltersType } from "@/entities/book/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";

type BookFiltersProps = {
  value: BookFiltersType;
  onChange: (filters: BookFiltersType) => void;
};

type RangeStyle = CSSProperties & { ["--be-range"]?: string };

export const BookFiltersPanel = ({ value, onChange }: BookFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (patch: Partial<BookFiltersType>) => {
    onChange({ ...value, ...patch });
  };

  const resetFilters = () => {
    onChange({
      query: value.query ?? "",
      sort: "newest",
      genre: "all",
      distance: 50,
      rating: 1,
      limit: value.limit,
    });
  };

  const distanceValue = value.distance ?? 50;
  const ratingValue = value.rating ?? 1;

  const distancePercent = ((distanceValue - 1) / (50 - 1)) * 100;
  const ratingPercent = ((ratingValue - 1) / (5 - 1)) * 100;
  const distanceStyle: RangeStyle = { ["--be-range"]: `${distancePercent}%` };
  const ratingStyle: RangeStyle = { ["--be-range"]: `${ratingPercent}%` };
  const limitValue = value.limit ?? 50;

  return (
    <Card className="border-border/70 bg-card/60">
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between px-4 py-3"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          <Filter className="size-5" />
          <CardTitle className="text-sm font-semibold tracking-tight">Фильтры и сортировка</CardTitle>
        </div>
        <ChevronDown
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4 border-t border-border/70 px-4 pb-4 pt-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Сортировка</Label>
              <Select
                value={value.sort ?? "newest"}
                onChange={(e) => updateFilter({ sort: e.target.value })}
                className="h-9 bg-input border-border/70"
              >
                <option value="newest">Сначала новые</option>
                <option value="distance">По расстоянию</option>
                <option value="rating">По рейтингу</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Жанр</Label>
              <Select
                value={value.genre ?? "all"}
                onChange={(e) => updateFilter({ genre: e.target.value })}
                className="h-9 bg-input border-border/70"
              >
                <option value="all">Все жанры</option>
                <option value="Классика">Классика</option>
                <option value="Фэнтези">Фэнтези</option>
                <option value="Философия">Философия</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary/80" /> Расстояние
                </span>
                <span className="font-semibold text-foreground">до {distanceValue} км</span>
              </Label>
              <input
                type="range"
                min={1}
                max={50}
                value={distanceValue}
                onChange={(e) => updateFilter({ distance: Number(e.target.value) })}
                className="be-range"
                style={distanceStyle}
                aria-label="Расстояние"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Star className="size-4 text-primary/80" /> Рейтинг
                </span>
                <span className="font-semibold text-foreground">от {ratingValue}</span>
              </Label>
              <input
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={ratingValue}
                onChange={(e) => updateFilter({ rating: Number(e.target.value) })}
                className="be-range"
                style={ratingStyle}
                aria-label="Рейтинг"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            <span>Активные фильтры:</span>
            {distanceValue < 50 && (
              <span className="rounded-full border border-border/70 bg-secondary/60 px-2 py-1 text-[11px]">
                До {distanceValue} км
              </span>
            )}
            {ratingValue > 1 && (
              <span className="rounded-full border border-border/70 bg-secondary/60 px-2 py-1 text-[11px]">
                Рейтинг от {ratingValue}
              </span>
            )}
            {limitValue && (
              <span className="rounded-full border border-border/70 bg-secondary/60 px-2 py-1 text-[11px]">
                Лимит {limitValue}
              </span>
            )}
            <Button
              type="button"
              variant="link"
              className="ml-auto px-0 text-primary hover:text-primary/90"
              onClick={resetFilters}
            >
              Сбросить все
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
