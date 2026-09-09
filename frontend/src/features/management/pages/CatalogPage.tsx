import { useState, useRef } from "react";
import { PageControls } from "@/features/management/components/PageControls";
import type { ReactElement, FormEvent } from "react";
import { z } from "zod";
import { apiClient } from "@/lib/apiClient";
import { useLocation } from "react-router-dom";
import { useCoffee } from "@/hooks/useCoffee";
import { useCategories } from "@/hooks/useCatalog";
import { productSchema } from "@/types/coffee";
import type { Product, Category, LocalizedText } from "@/types/coffee";
import {
  useManagement,
  useAdminMutation,
} from "@/features/management/hooks/useManagement";
import { LocalizedFields } from "@/features/management/components/LocalizedFields";
import { Feedback } from "@/components/coffee/Feedback";
import { Button } from "@/components/ui/Button";
type ProductInput = Omit<Product, "id">;
const blankText: LocalizedText = { id: "", en: "", ms: "" };
const blank: ProductInput = {
  slug: "",
  name: blankText,
  description: blankText,
  categoryId: "",
  image: "/assets/latte.webp",
  price: 25000,
  available: true,
  featured: false,
};
export default function CatalogPage(): ReactElement {
  const { t, text, money } = useCoffee();
  const isCategories = useLocation().pathname.endsWith("categories");
  const categories = useCategories();
  const [page, setPage] = useState(1);
  const query = useManagement(
    "products",
    "/admin/products?page=" + String(page),
    z.array(productSchema),
  );
  const mutation = useAdminMutation();
  const [editing, setEditing] = useState("");
  const [form, setForm] = useState<ProductInput>(blank);
  const [categoryForm, setCategoryForm] = useState<Omit<Category, "id">>({
    name: blankText,
    slug: "",
    sortOrder: 0,
  });
  const dialog = useRef<HTMLDialogElement>(null);
  const [uploadError, setUploadError] = useState<Error | null>(null);
  const [uploading, setUploading] = useState(false);
  async function upload(file: File): Promise<void> {
    setUploading(true);
    setUploadError(null);
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: { image: string };
      }>("/admin/uploads", file, { headers: { "Content-Type": file.type } });
      const result = z
        .object({
          success: z.literal(true),
          data: z.object({ image: z.string() }),
        })
        .parse(response.data);
      setForm((current) => ({ ...current, image: result.data.image }));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error : new Error("UPLOAD_FAILED"),
      );
    } finally {
      setUploading(false);
    }
  }
  function open(product?: Product, category?: Category): void {
    setEditing(product?.id ?? category?.id ?? "");
    setForm(
      product
        ? {
            slug: product.slug,
            name: product.name,
            description: product.description,
            categoryId: product.categoryId,
            image: product.image,
            price: product.price,
            available: product.available,
            featured: product.featured,
          }
        : { ...blank, categoryId: categories.data?.[0]?.id ?? "" },
    );
    setCategoryForm(
      category
        ? {
            name: category.name,
            slug: category.slug,
            sortOrder: category.sortOrder,
          }
        : { name: blankText, slug: "", sortOrder: 0 },
    );
    mutation.reset();
    dialog.current?.showModal();
  }
  async function save(event: FormEvent): Promise<void> {
    event.preventDefault();
    try {
      await mutation.mutateAsync({
        method: editing ? "put" : "post",
        path:
          "/admin/" +
          (isCategories ? "categories" : "products") +
          (editing ? "/" + editing : ""),
        body: isCategories ? categoryForm : form,
      });
      dialog.current?.close();
    } catch {
      /* Mutation error is shown in the dialog. */
    }
  }
  return (
    <>
      <div className="section-heading">
        <h1>{t(isCategories ? "categories" : "products")}</h1>
        <Button onClick={() => open()}>+ {t("create")}</Button>
      </div>
      <Feedback loading={query.isPending} error={query.error} />
      <div className="admin-panel table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t(isCategories ? "slug" : "category")}</th>
              <th>{t(isCategories ? "sortOrder" : "price")}</th>
              <th>{t("edit")}</th>
            </tr>
          </thead>
          <tbody>
            {isCategories
              ? categories.data?.map((category) => (
                  <tr key={category.id}>
                    <td>{text(category.name)}</td>
                    <td>{category.slug}</td>
                    <td>{category.sortOrder}</td>
                    <td>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => open(undefined, category)}
                      >
                        {t("edit")}
                      </Button>
                    </td>
                  </tr>
                ))
              : query.data?.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product">
                        <img
                          src={product.image}
                          alt=""
                          width="48"
                          height="48"
                        />
                        <span>
                          {text(product.name)}
                          {!product.available && (
                            <small>{t("unavailable")}</small>
                          )}
                        </span>
                      </div>
                    </td>
                    <td>
                      {categories.data?.find(
                        (c) => c.id === product.categoryId,
                      ) &&
                        text(
                          categories.data.find(
                            (c) => c.id === product.categoryId,
                          )?.name ?? blankText,
                        )}
                    </td>
                    <td>{money(product.price)}</td>
                    <td>
                      <div className="table-actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => open(product)}
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={mutation.isPending}
                          onClick={() => {
                            if (window.confirm(t("archiveConfirm")))
                              mutation.mutate({
                                method: "delete",
                                path: "/admin/products/" + product.id,
                                body: {},
                              });
                          }}
                        >
                          {t("archive")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      <PageControls
        page={page}
        count={query.data?.length ?? 0}
        onChange={setPage}
      />
      <dialog className="editor-dialog" ref={dialog}>
        <form onSubmit={(event) => void save(event)}>
          <div className="section-heading">
            <h2>{t(editing ? "edit" : "create")}</h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={t("close")}
            >
              ×
            </button>
          </div>
          <fieldset disabled={mutation.isPending}>
            {isCategories ? (
              <>
                <LocalizedFields
                  label={t("name")}
                  value={categoryForm.name}
                  onChange={(name) =>
                    setCategoryForm({ ...categoryForm, name })
                  }
                />
                <label>
                  {t("slug")}
                  <input
                    required
                    pattern="[a-z0-9-]+"
                    value={categoryForm.slug}
                    onChange={(e) =>
                      setCategoryForm({ ...categoryForm, slug: e.target.value })
                    }
                  />
                </label>
                <label>
                  {t("sortOrder")}
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={categoryForm.sortOrder}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        sortOrder: e.target.valueAsNumber,
                      })
                    }
                  />
                </label>
              </>
            ) : (
              <>
                <LocalizedFields
                  label={t("name")}
                  value={form.name}
                  onChange={(name) => setForm({ ...form, name })}
                />
                <LocalizedFields
                  label={t("description")}
                  multiline
                  value={form.description}
                  onChange={(description) => setForm({ ...form, description })}
                />
                <div className="form-grid">
                  <label>
                    {t("slug")}
                    <input
                      required
                      pattern="[a-z0-9-]+"
                      value={form.slug}
                      onChange={(e) =>
                        setForm({ ...form, slug: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t("price")}
                    <input
                      required
                      type="number"
                      min={1}
                      max={10000000}
                      step={1}
                      value={form.price}
                      onChange={(e) =>
                        setForm({ ...form, price: e.target.valueAsNumber })
                      }
                    />
                  </label>
                  <label>
                    {t("category")}
                    <select
                      required
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm({ ...form, categoryId: e.target.value })
                      }
                    >
                      {categories.data?.map((category) => (
                        <option value={category.id} key={category.id}>
                          {text(category.name)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("image")}
                    <select
                      value={form.image}
                      onChange={(e) =>
                        setForm({ ...form, image: e.target.value })
                      }
                    >
                      {[
                        "latte",
                        "espresso",
                        "matcha",
                        "food",
                        "pastry",
                        "cake",
                      ].map((image) => (
                        <option key={image} value={`/assets/${image}.webp`}>
                          {image}
                        </option>
                      ))}
                      {form.image.startsWith("/assets/uploads/") && (
                        <option value={form.image}>{t("image")}</option>
                      )}
                    </select>
                  </label>
                  <label>
                    {t("image")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void upload(file);
                      }}
                    />
                  </label>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) =>
                      setForm({ ...form, available: e.target.checked })
                    }
                  />
                  {t("available")}
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm({ ...form, featured: e.target.checked })
                    }
                  />
                  {t("featured")}
                </label>
              </>
            )}
            <Feedback error={mutation.error ?? uploadError} />
            <Button
              type="submit"
              fullWidth
              loading={mutation.isPending || uploading}
            >
              {t("save")}
            </Button>
          </fieldset>
        </form>
      </dialog>
    </>
  );
}
