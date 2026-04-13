import { useQuery } from "@tanstack/react-query";
import { programsApi } from "../api/programs.api";
import { useInstitutionStore } from "@/stores/institution.store";

export const usePrograms = () => {
  const { institutionId } = useInstitutionStore();

  return useQuery({
    queryKey: ["programs", institutionId],
    queryFn: () => programsApi.list(institutionId!),
    enabled: !!institutionId,
  });
};