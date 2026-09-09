import { settleMock } from "./mock-fixture";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";
import { z } from "zod";
import AxeBuilder from "@axe-core/playwright";
import { tableSchema } from "../../src/shared/types/coffee";
test("marketing pages, languages and responsive layout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".hero-photo")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/home-${width}.png`,
      fullPage: true,
    });
  }
  for (const language of ["en", "ms", "id"]) {
    await page.getByRole("combobox").selectOption(language);
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    await page.reload();
    await expect(page.getByRole("combobox")).toHaveValue(language);
  }
  for (const route of [
    "menu",
    "about",
    "story",
    "gallery",
    "visit",
    "promotions",
    "contact",
    "faq",
  ]) {
    await page.goto("/" + route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("CMS persists translated product and uploaded image, then archives it", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@ruangseduh.test");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("Coffee-local-test-2026");
  await page.getByRole("button", { name: "Masuk", exact: false }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/products");
  const create = page.getByRole("button", { name: "+ Tambah Baru" });
  await create.click();
  await page.keyboard.press("Escape");
  await expect(create).toBeFocused();
  await create.click();
  const dialog = page.locator("dialog");
  const name = "QA Kopi " + Date.now();
  const fields = dialog.getByRole("group", { name: "Nama", exact: true });
  await fields.getByLabel("ID", { exact: true }).fill(name);
  await fields.getByLabel("EN", { exact: true }).fill(name + " EN");
  await fields.getByLabel("MY", { exact: true }).fill(name + " MY");
  await dialog
    .getByLabel("Slug", { exact: true })
    .fill(name.toLowerCase().replaceAll(" ", "-"));
  const uploaded = page.waitForResponse(
    (response) =>
      response.url().endsWith("/admin/uploads") &&
      response.request().method() === "POST",
  );
  await dialog
    .locator('input[type="file"]')
    .setInputFiles(resolve("public/assets/latte.webp"));
  expect((await uploaded).status()).toBe(201);
  await dialog.getByRole("button", { name: "Simpan" }).click();
  await expect(dialog).not.toBeVisible();
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
  await page.reload();
  await expect(row.locator("img")).toHaveAttribute(
    "src",
    /\/assets\/uploads\/.+\.webp/,
  );
  await page.getByRole("combobox").selectOption("ms");
  await expect(row).toContainText(name + " MY");
  await page.getByRole("combobox").selectOption("id");
  page.once("dialog", (dialog) => void dialog.accept());
  await row.getByRole("button", { name: "Arsipkan" }).click();
  await expect(row).toHaveCount(0);
});
test("guest QR dine-in checkout to paid receipt with real API and development simulator", async ({
  page,
  request,
}) => {
  const response = await request.get("http://127.0.0.1:3000/api/tables");
  const tables = z
    .object({ data: z.array(tableSchema) })
    .parse(await response.json()).data;
  const table = tables[0];
  if (!table) throw Error("Seed tables first");
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/order/table/" + table.token);
  await expect(page.locator(".table-pill")).toContainText(table.name);
  await page
    .getByRole("button", { name: "Tambah: Cafe Latte", exact: true })
    .click();
  await page.getByRole("combobox").selectOption("ms");
  await expect(page.locator(".cart-bar")).toContainText("Lihat Troli");
  await page.locator(".cart-bar").click();
  await page.getByLabel("Nama (pilihan)", { exact: true }).fill("E2E Guest");
  await page
    .getByRole("button", { name: "Teruskan ke Pembayaran", exact: false })
    .click();
  await expect(page).toHaveURL(/\/order\/track\//);
  await expect(page.getByText(/SIMULASI PEMBANGUNAN/)).toBeVisible();
  const orderId = page.url().split("/track/")[1]?.split("#")[0];
  if (!orderId) throw Error("No order ID");
  await settleMock(orderId);
  await expect(page.getByRole("button", { name: "Lihat Resit" })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Lihat Resit" }).click();
  await expect(page.locator(".receipt")).toContainText("QRIS");
  await expect(page.locator(".receipt")).toContainText("E2E Guest");
});
test("takeaway persists cart, rejects fake login, and disables checkout offline", async ({
  page,
  context,
}) => {
  await page.goto("/order");
  await page
    .getByRole("button", { name: "Tambah: Cafe Latte", exact: true })
    .click();
  await page.reload();
  await expect(page.locator(".cart-bar")).toContainText("1");
  await page.locator(".cart-bar").click();
  await expect(
    page.getByRole("button", { name: "Bawa Pulang", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await context.setOffline(true);
  await expect(
    page.getByRole("button", { name: "Lanjut ke Pembayaran", exact: false }),
  ).toBeDisabled();
  await context.setOffline(false);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("wrong@example.test");
  await page.getByLabel("Kata sandi", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Masuk", exact: false }).click();
  await expect(page.getByRole("alert")).toContainText("Email atau kata sandi");
  await expect(page).toHaveURL(/\/login$/);
});
test("admin routes render with real session and accessibility checks", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env["DEV_ADMIN_EMAIL"] ?? "admin@ruangseduh.test");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill(process.env["DEV_ADMIN_PASSWORD"] ?? "Coffee-local-test-2026");
  await page.getByRole("button", { name: "Masuk", exact: false }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByText("Pendapatan Hari Ini", { exact: true }),
  ).toBeVisible();
  for (const route of [
    "orders",
    "kitchen",
    "products",
    "categories",
    "tables",
    "payments",
    "invoices",
    "reports",
    "staff",
    "settings",
  ]) {
    await page.goto("/admin/" + route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  await page.goto("/admin");
  await expect(
    page.getByText("Pendapatan Hari Ini", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 850 });
  await expect(page.locator(".admin-sidebar")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
  await page.goto("/order");
  await expect(
    page.getByRole("button", { name: "Tambah: Cafe Latte", exact: true }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
