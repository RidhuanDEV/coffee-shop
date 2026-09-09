import { test, expect } from "@playwright/test";
import { z } from "zod";
import { settleMock } from "./mock-fixture";
test("production PWA registers, caches static assets, and excludes sensitive API responses", async ({
  page,
  context,
  request,
}) => {
  test.skip(
    !process.env["E2E_PWA"],
    "Run against the production preview with E2E_PWA=1",
  );
  await page.goto("/order");
  await expect(
    page.getByRole("button", { name: "Tambah: Cafe Latte", exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => navigator.serviceWorker.controller !== null),
    )
    .toBe(true);
  const manifest = await request.get("/manifest.webmanifest");
  const data = z
    .object({
      display: z.literal("standalone"),
      icons: z.array(z.object({ src: z.string(), sizes: z.string() })),
    })
    .parse(await manifest.json());
  expect(data.icons).toHaveLength(2);
  await page
    .getByRole("button", { name: "Tambah: Cafe Latte", exact: true })
    .click();
  await page.locator(".cart-bar").click();
  await page
    .getByRole("button", { name: "Lanjut ke Pembayaran", exact: false })
    .click();
  await expect(page).toHaveURL(/\/order\/track\//);
  await expect(page.getByText(/SIMULASI DEVELOPMENT/)).toBeVisible();
  const orderId = page.url().split("/track/")[1]?.split("#")[0];
  if (!orderId) throw Error("Order ID missing");
  await settleMock(orderId);
  await page
    .getByRole("button", { name: "Lihat Struk" })
    .click({ timeout: 15000 });
  await expect(page.locator(".receipt")).toContainText("QRIS");
  const keys = await page.evaluate(async () => {
    const names = await caches.keys();
    const urls: string[] = [];
    for (const name of names) {
      const cache = await caches.open(name);
      urls.push(...(await cache.keys()).map((req) => req.url));
    }
    return urls;
  });
  expect(keys.some((url) => url.includes("/assets/"))).toBe(true);
  expect(
    keys.some((url) => /\/api\/(orders|payments|auth|admin)/.test(url)),
  ).toBe(false);
  await context.setOffline(true);
  await page.goto("/order");
  await expect(page.locator("#message")).toContainText("offline");
  await context.setOffline(false);
});
