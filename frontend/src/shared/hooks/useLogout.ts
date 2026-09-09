import { useMutation } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { queryClient } from "@/lib/queryClient";
export function useLogout(): UseMutationResult<void, Error, void> {
  return useMutation({
    mutationFn: (): Promise<void> => {
      useAuthStore.getState().logout();
      queryClient.clear();
      return Promise.resolve();
    },
  });
}
