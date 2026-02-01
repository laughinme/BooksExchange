import { apiPrivate } from "@/shared/api/axiosInstance";

import {
  type AuthorDto,
  type CityDto,
  type ExchangeLocationDto,
  type GenreDto,
  type LanguageDto,
} from "@/entities/reference/model/types";

export const referenceApi = {
  getGenres: async () => {
    const { data } = await apiPrivate.get<GenreDto[]>("/books/genres/");
    return data;
  },
  getAuthors: async () => {
    const { data } = await apiPrivate.get<AuthorDto[]>("/books/authors/");
    return data;
  },
  getAuthorById: async (authorId: number) => {
    const { data } = await apiPrivate.get<AuthorDto>(`/books/authors/${authorId}/`);
    return data;
  },
  getLanguages: async () => {
    const { data } = await apiPrivate.get<LanguageDto[]>("/languages/");
    return data;
  },
  getCities: async () => {
    const { data } = await apiPrivate.get<CityDto[]>("/geo/cities/");
    return data;
  },
  getExchangeLocations: async (filterByDistance = true) => {
    const { data } = await apiPrivate.get<ExchangeLocationDto[]>(
      "/geo/exchange_locations/",
      { params: { filter: filterByDistance } },
    );
    return data;
  },
  getNearestExchangeLocation: async () => {
    const { data } = await apiPrivate.get<ExchangeLocationDto>(
      "/geo/exchange_locations/nearest",
    );
    return data;
  },
  getGenreById: async (genreId: number) => {
    const { data } = await apiPrivate.get<GenreDto>(`/books/genres/${genreId}/`);
    return data;
  },
};
