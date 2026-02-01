export type GenreDto = {
  id: number;
  name: string;
};

export type AuthorDto = {
  id: number;
  name: string;
};

export type LanguageDto = {
  code: string;
  name_ru: string;
  name_en: string;
};

export type CityDto = {
  id: number;
  name: string;
};

export type ExchangeLocationDto = {
  id: number;
  title: string;
  address: string;
  city: CityDto;
  latitude: number;
  longitude: number;
  opening_hours?: string | null;
};

export type Genre = {
  id: number;
  name: string;
};

export type Author = {
  id: number;
  name: string;
};

export type Language = {
  code: string;
  nameRu: string;
  nameEn: string;
};

export type City = {
  id: number;
  name: string;
};

export type ExchangeLocation = {
  id: number;
  title: string;
  address: string;
  city: City;
  latitude: number;
  longitude: number;
  openingHours?: string | null;
};
