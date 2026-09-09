import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import { z } from "zod";
import { getData } from "@/lib/coffee-api";
import {
  productSchema,
  categorySchema,
  shopSchema,
  tableSchema,
} from "@/types/coffee";
import type { Product, Category, Shop, CafeTable } from "@/types/coffee";
export function useProducts(): UseQueryResult<Product[]> {
  return useQuery({
    queryKey: ["products"],
    queryFn: () => getData("/menu", z.array(productSchema)),
    staleTime: 30000,
  });
}
export function useCategories(): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => getData("/categories", z.array(categorySchema)),
  });
}
export function useShop(): UseQueryResult<Shop> {
  return useQuery({
    queryKey: ["shop"],
    queryFn: () => getData("/shop", shopSchema),
  });
}
export function useTables(): UseQueryResult<CafeTable[]> {
  return useQuery({
    queryKey: ["tables"],
    queryFn: () => getData("/tables", z.array(tableSchema)),
  });
}
