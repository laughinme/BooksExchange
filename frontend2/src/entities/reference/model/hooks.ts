import { useQuery } from "@tanstack/react-query";

import { referenceApi } from "@/shared/api/reference";
import {
  adaptAuthor,
  adaptCity,
  adaptExchangeLocation,
  adaptGenre,
  adaptLanguage,
} from "./adapters";
import {
  type Author,
  type City,
  type ExchangeLocation,
  type Genre,
  type Language,
} from "./types";

export const useGenresQuery = () =>
  useQuery<Genre[]>({
    queryKey: ["genres"],
    queryFn: async () => {
      const data = await referenceApi.getGenres();
      return data.map(adaptGenre);
    },
    staleTime: 5 * 60 * 1000,
  });

export const useAuthorsQuery = () =>
  useQuery<Author[]>({
    queryKey: ["authors"],
    queryFn: async () => {
      const data = await referenceApi.getAuthors();
      return data.map(adaptAuthor);
    },
    staleTime: 5 * 60 * 1000,
  });

export const useLanguagesQuery = () =>
  useQuery<Language[]>({
    queryKey: ["languages"],
    queryFn: async () => {
      const data = await referenceApi.getLanguages();
      return data.map(adaptLanguage);
    },
    staleTime: 30 * 60 * 1000,
  });

export const useCitiesQuery = () =>
  useQuery<City[]>({
    queryKey: ["cities"],
    queryFn: async () => {
      const data = await referenceApi.getCities();
      return data.map(adaptCity);
    },
    staleTime: 30 * 60 * 1000,
  });

export const useExchangeLocationsQuery = (filterByDistance = true) =>
  useQuery<ExchangeLocation[]>({
    queryKey: ["exchange-locations", filterByDistance],
    queryFn: async () => {
      const data = await referenceApi.getExchangeLocations(filterByDistance);
      return data.map(adaptExchangeLocation);
    },
    staleTime: 5 * 60 * 1000,
  });
