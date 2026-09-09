import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { getData } from "@/lib/coffee-api";
import { orderSchema } from "@/types/coffee";
import type { Order } from "@/types/coffee";
export function useOrder(id: string, token: string): UseQueryResult<Order> {
  return useQuery({
    queryKey: ["order", id, token],
    queryFn: () => getData("/orders/" + id, orderSchema, token),
    enabled: !!id && !!token,
    refetchInterval: (query) => {
      const order = query.state.data;
      return order &&
        (order.status === "COMPLETED" ||
          order.status === "CANCELLED" ||
          ["EXPIRED", "FAILED", "REFUNDED"].includes(
            order.payment?.status ?? "",
          ))
        ? false
        : 5000;
    },
    refetchIntervalInBackground: false,
    refetchOnReconnect: true,
    retry: 1,
  });
}
