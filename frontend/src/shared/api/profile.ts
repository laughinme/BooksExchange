import { apiPrivate } from "@/shared/api/axiosInstance";

import {
  type ProfileDto,
  type UpdateProfilePayload,
} from "@/entities/profile/model/types";

export type UpdateFavoriteGenresPayload = {
  favorite_genres: number[];
};

export const profileApi = {
  getMe: async () => {
    const { data } = await apiPrivate.get<ProfileDto>("/users/me/");
    return data;
  },
  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await apiPrivate.patch<ProfileDto>("/users/me/", payload);
    return data;
  },
  updateFavoriteGenres: async (genreIds: number[]) => {
    const { data } = await apiPrivate.put<ProfileDto>("/users/me/genres", {
      favorite_genres: genreIds.map((id) => Number(id)),
    });
    return data;
  },
  updatePicture: async (formData: FormData) => {
    const { data } = await apiPrivate.put<ProfileDto>("/users/me/picture", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  getNearbyUsers: async (radius_km?: number) => {
    const { data } = await apiPrivate.get<(ProfileDto & { distance: number })[]>("/users/nearby", {
      params: radius_km ? { radius_km } : undefined,
    });
    return data;
  },
};
