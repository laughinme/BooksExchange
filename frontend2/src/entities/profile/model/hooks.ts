import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { profileApi } from "@/shared/api/profile";
import { adaptProfile, adaptNearbyUser } from "./adapters";
import { type Profile, type UpdateProfilePayload, type NearbyUser } from "./types";

export const profileQueryKey = ["profile"];

export const profileQueryOptions = () => ({
  queryKey: profileQueryKey,
  queryFn: async () => {
    const data = await profileApi.getMe();
    return adaptProfile(data);
  },
});

export const useProfileQuery = () =>
  useQuery<Profile>(profileQueryOptions());

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData<Profile>(profileQueryKey, adaptProfile(data));
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
};

export const useUpdateFavoriteGenres = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (genreIds: number[]) => profileApi.updateFavoriteGenres(genreIds),
    onSuccess: (data) => {
      queryClient.setQueryData<Profile>(profileQueryKey, adaptProfile(data));
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
};

export const useUpdateProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => profileApi.updatePicture(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
};

export const useNearbyUsers = (radius_km?: number) =>
  useQuery<NearbyUser[]>({
    queryKey: ["nearby-users", radius_km],
    queryFn: async () => {
      const data = await profileApi.getNearbyUsers(radius_km);
      return data.map((dto: any) => adaptNearbyUser(dto));
    },
  });
