import { apiPrivate } from "@/shared/api/axiosInstance";

export type RoleDto = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
};

export const rolesApi = {
  list: (params?: { search?: string; limit?: number }) =>
    apiPrivate.get<RoleDto[]>("/roles/", { params }).then((res) => res.data),
  getById: (roleId: string) =>
    apiPrivate.get<RoleDto>(`/roles/${roleId}`).then((res) => res.data),
};
