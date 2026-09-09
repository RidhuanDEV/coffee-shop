import { z } from "zod";
import { apiClient } from "@/lib/apiClient";
export async function getData<T>(
  path: string,
  schema: z.ZodType<T>,
  token?: string,
): Promise<T> {
  const response = await apiClient.get<{ success: boolean; data: T }>(path, {
    headers: token ? { "X-Order-Token": token } : {},
  });
  return z
    .object({ success: z.literal(true), data: schema })
    .parse(response.data).data;
}
export async function mutateData<T, B>(
  method: "post" | "put" | "patch" | "delete",
  path: string,
  body: B,
  schema: z.ZodType<T>,
  token?: string,
): Promise<T> {
  const response = await apiClient.request<{ success: boolean; data: T }>({
    method,
    url: path,
    data: body,
    headers: token ? { "X-Order-Token": token } : {},
  });
  return z
    .object({ success: z.literal(true), data: schema })
    .parse(response.data).data;
}
