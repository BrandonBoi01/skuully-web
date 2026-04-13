import { apiClient } from "@/services/api-client";

export const programsApi = {
  list: (institutionId: string) =>
    apiClient.get(`/institutions/${institutionId}/programs`),

  create: (institutionId: string, data: any) =>
    apiClient.post(`/institutions/${institutionId}/programs`, data),
};