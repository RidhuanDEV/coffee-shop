import { z } from "zod";
import { apiClient } from "@/lib/apiClient";
import { authUserSchema } from "@/types/coffee";
import type { AuthUser } from "@/types/auth.types";
export async function signIn(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  const response = await apiClient.post<{
    success: boolean;
    data: { token: string };
  }>("/auth/login", { email, password });
  const result = z
    .object({ success: z.literal(true), data: z.object({ token: z.string() }) })
    .parse(response.data);
  const me = await apiClient.get<{ success: boolean; data: AuthUser }>(
    "/auth/me",
    { headers: { Authorization: "Bearer " + result.data.token } },
  );
  return {
    token: result.data.token,
    user: z
      .object({ success: z.literal(true), data: authUserSchema })
      .parse(me.data).data,
  };
}
