import { useState } from "react";
import { ChevronDown, Filter, MapPin, Star } from "lucide-react";

import { type BookFilters as BookFiltersType } from "@/entities/book/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select } from "@/shared/ui/select";

type BookFiltersProps = {
  value: BookFiltersType;
  onChange: (filters: BookFiltersType) => void;
};

export const BookFiltersPanel = ({ value, onChange }: BookFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (patch: Partial<BookFiltersType>) => {
    onChange({ ...value, ...patch });
  };

  const resetFilters = () => {
    onChange({ query: value.query ?? "", sort: "newest", genre: "all", distance: 50, rating: 1 });
  };

  return (
    <Card>
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          <Filter className="size-5" />
          <CardTitle className="text-base">Фильтры и сортировка</CardTitle>
        </div>
        <ChevronDown
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-6 border-t pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Сортировка</Label>
              <Select
                value={value.sort ?? "newest"}
                onChange={(e) => updateFilter({ sort: e.target.value })}
              >
                <option value="newest">Сначала новые</option>
                <option value="distance">По расстоянию</option>
                <option value="rating">По рейтингу</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Жанр</Label>
              <Select
                value={value.genre ?? "all"}
                onChange={(e) => updateFilter({ genre: e.target.value })}
              >
                <option value="all">Все жанры</option>
                <option value="Классика">Классика</option>
                <option value="Фэнтези">Фэнтези</option>
                <option value="Философия">Философия</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="size-4" /> Расстояние: до {value.distance ?? 50} км
              </Label>
              <Input
                type="range"
                min={1}
                max={50}
                value={value.distance ?? 50}
                onChange={(e) => updateFilter({ distance: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Star className="size-4" /> Рейтинг: от {value.rating ?? 1}
              </Label>
              <Input
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={value.rating ?? 1}
                onChange={(e) => updateFilter({ rating: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
            <span>Активные фильтры:</span>
            {(value.distance ?? 50) < 50 && (
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                До {value.distance} км
              </span>
            )}
            {(value.rating ?? 1) > 1 && (
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                Рейтинг от {value.rating}
              </span>
            )}
            <Button
              type="button"
              variant="link"
              className="ml-auto px-0"
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
