import {
  type Author,
  type AuthorDto,
  type City,
  type CityDto,
  type ExchangeLocation,
  type ExchangeLocationDto,
  type Genre,
  type GenreDto,
  type Language,
  type LanguageDto,
} from "./types";

export const adaptGenre = (dto: GenreDto): Genre => ({
  id: dto.id,
  name: dto.name,
});

export const adaptAuthor = (dto: AuthorDto): Author => ({
  id: dto.id,
  name: dto.name,
});

export const adaptLanguage = (dto: LanguageDto): Language => ({
  code: dto.code,
  name: dto.name,
});

export const adaptCity = (dto: CityDto): City => ({
  id: dto.id,
  name: dto.name,
});

export const adaptExchangeLocation = (
  dto: ExchangeLocationDto,
): ExchangeLocation => ({
  id: dto.id,
  title: dto.title,
  address: dto.address,
  city: adaptCity(dto.city),
  latitude: dto.latitude,
  longitude: dto.longitude,
  openingHours: dto.opening_hours ?? null,
});
