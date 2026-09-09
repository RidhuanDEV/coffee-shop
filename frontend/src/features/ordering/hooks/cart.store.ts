import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/types/coffee";
interface CartState {
  lines: CartLine[];
  tableToken: string | null;
  fulfillment: "DINE_IN" | "TAKEAWAY";
  key: string;
  add: (id: string) => void;
  update: (id: string, quantity: number, notes: string) => void;
  setTable: (token: string | null) => void;
  setFulfillment: (value: "DINE_IN" | "TAKEAWAY") => void;
  clear: () => void;
}
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      tableToken: null,
      fulfillment: "TAKEAWAY",
      key: crypto.randomUUID(),
      add: (id: string): void =>
        void set((state) => ({
          key: crypto.randomUUID(),
          lines: state.lines.some((line) => line.productId === id)
            ? state.lines.map((line) =>
                line.productId === id
                  ? { ...line, quantity: Math.min(50, line.quantity + 1) }
                  : line,
              )
            : [...state.lines, { productId: id, quantity: 1, notes: "" }],
        })),
      update: (id: string, quantity: number, notes: string): void =>
        void set((state) => ({
          key: crypto.randomUUID(),
          lines:
            quantity < 1
              ? state.lines.filter((line) => line.productId !== id)
              : state.lines.map((line) =>
                  line.productId === id
                    ? { ...line, quantity: Math.min(50, quantity), notes }
                    : line,
                ),
        })),
      setTable: (token: string | null): void =>
        void set((state) => ({
          tableToken: token,
          fulfillment: token ? "DINE_IN" : state.fulfillment,
          key: state.tableToken === token ? state.key : crypto.randomUUID(),
        })),
      setFulfillment: (value: "DINE_IN" | "TAKEAWAY"): void =>
        void set((state) => ({
          fulfillment: value,
          tableToken: value === "TAKEAWAY" ? null : state.tableToken,
          key: crypto.randomUUID(),
        })),
      clear: (): void => void set({ lines: [], key: crypto.randomUUID() }),
    }),
    { name: "ruang-seduh-cart-v1" },
  ),
);
