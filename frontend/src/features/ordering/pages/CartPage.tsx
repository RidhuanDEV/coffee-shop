import { useState, useSyncExternalStore } from "react";
import type { ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useCoffee } from "@/hooks/useCoffee";
import { useProducts, useTables } from "@/hooks/useCatalog";
import { useCart } from "@/features/ordering/hooks/cart.store";
import { Button } from "@/components/ui/Button";
import { LanguagePicker } from "@/components/coffee/LanguagePicker";
import { Feedback } from "@/components/coffee/Feedback";
import { mutateData } from "@/lib/coffee-api";
import { checkoutSchema, checkoutResultSchema } from "@/types/coffee";
import type { CheckoutInput } from "@/types/coffee";
const formSchema = z.object({
  customerName: z.string().max(100),
  phone: z.string().max(30),
  notes: z.string().max(1000),
});
type FormValues = z.infer<typeof formSchema>;
function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
export default function CartPage(): ReactElement {
  const { t, text, money, locale } = useCoffee();
  const cart = useCart();
  const products = useProducts();
  const tables = useTables();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const online = useSyncExternalStore(subscribe, () => navigator.onLine);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { customerName: "", phone: "", notes: "" },
  });
  const mutation = useMutation({
    mutationFn: (body: CheckoutInput) =>
      mutateData("post", "/orders", body, checkoutResultSchema),
  });
  const total = cart.lines.reduce(
    (sum, line) =>
      sum +
      (products.data?.find((p) => p.id === line.productId)?.price ?? 0) *
        line.quantity,
    0,
  );
  async function submit(values: FormValues): Promise<void> {
    setMessage("");
    if (!online) return;
    if (
      cart.fulfillment === "DINE_IN" &&
      !tables.data?.some((table) => table.token === cart.tableToken)
    ) {
      setMessage(t("invalidTable"));
      return;
    }
    const input = checkoutSchema.parse({
      ...values,
      idempotencyKey: cart.key,
      fulfillment: cart.fulfillment,
      tableToken: cart.tableToken,
      locale,
      items: cart.lines,
    });
    // Persist the exact submitted payload so a timed-out request is replayed unchanged.
    const pendingSchema = z.object({
      cartKey: z.string(),
      input: checkoutSchema,
    });
    let payload = input;
    try {
      const raw = localStorage.getItem("ruang-seduh-pending");
      if (raw) {
        const pending = pendingSchema.parse(JSON.parse(raw));
        if (pending.cartKey === cart.key) payload = pending.input;
      }
    } catch {
      localStorage.removeItem("ruang-seduh-pending");
    }
    localStorage.setItem(
      "ruang-seduh-pending",
      JSON.stringify({ cartKey: cart.key, input: payload }),
    );
    try {
      const order = await mutation.mutateAsync(payload);
      localStorage.setItem("ruang-seduh-order-" + order.id, order.accessToken);
      localStorage.removeItem("ruang-seduh-pending");
      cart.clear();
      await navigate("/order/track/" + order.id + "#" + order.accessToken);
    } catch (error) {
      setMessage(
        error instanceof Error && error.message === "PRODUCT_UNAVAILABLE"
          ? t("catalogChanged")
          : error instanceof Error && error.message === "INVALID_TABLE"
            ? t("invalidTable")
            : t("error"),
      );
    }
  }
  return (
    <div className="ordering-app">
      <header className="ordering-header">
        <Link to="/order">← {t("menu")}</Link>
        <span className="brand">toko kopi.</span>
        <LanguagePicker />
      </header>
      <main className="checkout-main">
        <h1>{t("cart")}</h1>
        <Feedback loading={products.isPending} error={products.error} />
        {cart.lines.length === 0 ? (
          <div className="empty-cart">
            <h2>{t("emptyCart")}</h2>
            <p>{t("cartHint")}</p>
            <Link className="cta" to="/order">
              {t("explore")}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(event) => void handleSubmit(submit)(event)}
            className="checkout-grid"
          >
            <div>
              <fieldset disabled={mutation.isPending}>
                <legend>{t("items")}</legend>
                {cart.lines.map((line) => {
                  const product = products.data?.find(
                    (p) => p.id === line.productId,
                  );
                  return (
                    <article className="cart-line" key={line.productId}>
                      {product && (
                        <img
                          src={product.image}
                          alt={text(product.name)}
                          width="100"
                          height="100"
                        />
                      )}
                      <div>
                        <h3>
                          {product ? text(product.name) : t("unavailable")}
                        </h3>
                        <p>{money((product?.price ?? 0) * line.quantity)}</p>
                        <div className="quantity-control">
                          <button
                            type="button"
                            onClick={() =>
                              cart.update(
                                line.productId,
                                line.quantity - 1,
                                line.notes,
                              )
                            }
                            aria-label={t("remove")}
                          >
                            −
                          </button>
                          <span>{line.quantity}</span>
                          <button
                            type="button"
                            disabled={line.quantity >= 50}
                            onClick={() =>
                              cart.update(
                                line.productId,
                                line.quantity + 1,
                                line.notes,
                              )
                            }
                            aria-label={t("add")}
                          >
                            +
                          </button>
                        </div>
                        <label>
                          {t("itemNotes")}
                          <input
                            value={line.notes}
                            maxLength={300}
                            onChange={(event) =>
                              cart.update(
                                line.productId,
                                line.quantity,
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      </div>
                    </article>
                  );
                })}
              </fieldset>
            </div>
            <section className="checkout-summary">
              <fieldset disabled={mutation.isPending}>
                <legend>{t("checkout")}</legend>
                <div className="fulfillment-options">
                  {(
                    [
                      "DINE_IN",
                      "TAKEAWAY",
                    ] satisfies CheckoutInput["fulfillment"][]
                  ).map((value) => (
                    <button
                      type="button"
                      key={value}
                      aria-pressed={cart.fulfillment === value}
                      onClick={() => cart.setFulfillment(value)}
                    >
                      {t(value)}
                    </button>
                  ))}
                </div>
                {cart.fulfillment === "DINE_IN" && (
                  <label>
                    {t("table")}
                    <select
                      required
                      value={cart.tableToken ?? ""}
                      onChange={(event) =>
                        cart.setTable(event.target.value || null)
                      }
                    >
                      <option value="">{t("chooseTable")}</option>
                      {tables.data?.map((table) => (
                        <option key={table.token} value={table.token}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  {t("customerName")}
                  <input autoComplete="name" {...register("customerName")} />
                </label>
                <label>
                  {t("phone")}
                  <input type="tel" autoComplete="tel" {...register("phone")} />
                </label>
                <label>
                  {t("notes")}
                  <textarea rows={3} {...register("notes")} />
                </label>
                {Object.keys(errors).length > 0 && (
                  <p role="alert">{t("validation")}</p>
                )}
                <div className="summary-row">
                  <span>{t("subtotal")}</span>
                  <strong>{money(total)}</strong>
                </div>
                <div className="summary-row total">
                  <span>{t("total")}</span>
                  <strong>{money(total)}</strong>
                </div>
                {!online && (
                  <p className="notice" role="status">
                    {t("offline")}
                  </p>
                )}
                {message && (
                  <p className="notice danger" role="alert">
                    {message}
                  </p>
                )}
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={mutation.isPending}
                  disabled={
                    !online ||
                    products.isPending ||
                    !!products.error ||
                    mutation.isPending
                  }
                >
                  {t("checkout")} →
                </Button>
                <p className="secure-note">{t("secure")}</p>
                <small>{t("pendingCheck")}</small>
              </fieldset>
            </section>
          </form>
        )}
      </main>
    </div>
  );
}
