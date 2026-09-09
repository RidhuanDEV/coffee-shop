import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { z } from "zod";
import { getData, mutateData } from "@/lib/coffee-api";
export function useManagement<T>(
  key: string,
  path: string,
  schema: z.ZodType<T>,
  poll = false,
): UseQueryResult<T> {
  return useQuery({
    queryKey: ["management", key, path],
    queryFn: () => getData(path, schema),
    refetchInterval: poll ? 5000 : false,
    refetchIntervalInBackground: false,
  });
}
interface MutationInput {
  path: string;
  method: "post" | "put" | "patch" | "delete";
  body: object;
}
export function useAdminMutation(): UseMutationResult<
  null,
  Error,
  MutationInput
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: MutationInput): Promise<null> => {
      await mutateData(
        input.method,
        input.path,
        input.body,
        z.union([z.null(), z.object({})]),
      );
      return null;
    },
    onSuccess: async () => {
      await client.invalidateQueries();
    },
  });
}
