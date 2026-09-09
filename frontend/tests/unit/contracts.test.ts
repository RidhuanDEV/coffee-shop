import { describe, it, expect } from "vitest";
import id from "../../src/locales/id/coffee.json";
import en from "../../src/locales/en/coffee.json";
import ms from "../../src/locales/ms/coffee.json";
import { checkoutSchema, productSchema } from "../../src/shared/types/coffee";
describe("coffee contracts", () => {
  it("has identical complete translation keys in three languages", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(id).sort());
    expect(Object.keys(ms).sort()).toEqual(Object.keys(id).sort());
    for (const dictionary of [id, en, ms])
      expect(
        Object.values(dictionary).every((value) => value.trim().length > 0),
      ).toBe(true);
  });
  it("rejects invalid checkout quantities", () => {
    expect(
      checkoutSchema.safeParse({
        idempotencyKey: crypto.randomUUID(),
        fulfillment: "TAKEAWAY",
        tableToken: null,
        locale: "ms",
        customerName: "",
        phone: "",
        notes: "",
        items: [{ productId: crypto.randomUUID(), quantity: -1, notes: "" }],
      }).success,
    ).toBe(false);
  });
  it("rejects a malformed API price instead of coercing it", () => {
    expect(
      productSchema.safeParse({
        id: "p",
        slug: "latte",
        name: { id: "Latte", en: "Latte", ms: "Latte" },
        description: { id: "", en: "", ms: "" },
        categoryId: "c",
        image: "/assets/latte.webp",
        price: "25000",
        available: true,
        featured: false,
      }).success,
    ).toBe(false);
  });
});
