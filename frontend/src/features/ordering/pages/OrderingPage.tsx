import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useCoffee } from "@/hooks/useCoffee";
import { useProducts, useCategories } from "@/hooks/useCatalog";
import { ProductCard } from "@/components/coffee/ProductCard";
import { Feedback } from "@/components/coffee/Feedback";
import { LanguagePicker } from "@/components/coffee/LanguagePicker";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types/coffee";
import { tableSchema } from "@/types/coffee";
import { getData } from "@/lib/coffee-api";
import { useCart } from "@/features/ordering/hooks/cart.store";
export default function OrderingPage(): ReactElement {
  const { token } = useParams();
  const { t, text, money } = useCoffee();
  const products = useProducts();
  const categories = useCategories();
  const cart = useCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const setTable = cart.setTable;
  const table = useQuery({
    queryKey: ["table", token],
    queryFn: () =>
      getData(
        "/tables/resolve/" + encodeURIComponent(token ?? ""),
        tableSchema,
      ),
    enabled: !!token,
    retry: false,
  });
  useEffect(() => {
    if (token) setTable(table.data?.token ?? null);
  }, [token, table.data, setTable]);
  const total = cart.lines.reduce(
    (sum, line) =>
      sum +
      (products.data?.find((p) => p.id === line.productId)?.price ?? 0) *
        line.quantity,
    0,
  );
  const count = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const filtered = products.data?.filter(
    (p) =>
      (!category || p.categoryId === category) &&
      (text(p.name) + " " + text(p.description))
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  function show(product: Product): void {
    setDetail(product);
    dialog.current?.showModal();
  }
  return (
    <div className="ordering-app">
      <header className="ordering-header">
        <Link to="/" aria-label={t("back")}>
          <ArrowLeft size={20} />
        </Link>
        <Link className="brand" to="/">
          toko kopi.
        </Link>
        <LanguagePicker />
      </header>
      <main className="order-main">
        <div className="order-title">
          <div>
            <p className="eyebrow">{t("seasonalText")}</p>
            <h1>{t("menu")}</h1>
          </div>
          <span className="table-pill">
            {table.data
              ? `${t("table")} ${table.data.name}`
              : t(cart.fulfillment)}
          </span>
        </div>
        {token && table.isError && (
          <p role="alert" className="notice danger">
            {t("invalidTable")}
          </p>
        )}
        <input
          className="search-input full"
          type="search"
          placeholder={t("search")}
          aria-label={t("search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="category-tabs sticky-categories">
          <button aria-pressed={!category} onClick={() => setCategory("")}>
            {t("all")}
          </button>
          {categories.data?.map((c) => (
            <button
              key={c.id}
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {text(c.name)}
            </button>
          ))}
        </div>
        <Feedback
          loading={products.isPending}
          error={products.error}
          retry={() => void products.refetch()}
        />
        <div className="product-grid ordering-grid">
          {filtered?.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={(p) => cart.add(p.id)}
              onDetail={show}
            />
          ))}
        </div>
        {filtered?.length === 0 && <p className="feedback">{t("empty")}</p>}
      </main>
      {count > 0 && (
        <Link className="cart-bar" to="/order/cart">
          <span>
            <ShoppingBag size={20} />
            <b>{count}</b> {t("items")} <span className="cart-divider">|</span>{" "}
            {money(total)}
          </span>
          <strong>{t("viewCart")} →</strong>
        </Link>
      )}
      <dialog ref={dialog} className="product-dialog">
        {detail && (
          <>
            <button
              className="dialog-close"
              onClick={() => dialog.current?.close()}
              aria-label={t("close")}
            >
              ×
            </button>
            <img
              src={detail.image}
              alt={text(detail.name)}
              width="600"
              height="450"
            />
            <div className="dialog-body">
              <h2>{text(detail.name)}</h2>
              <p>{text(detail.description)}</p>
              <strong>{money(detail.price)}</strong>
              <Button
                fullWidth
                disabled={!detail.available}
                onClick={() => {
                  cart.add(detail.id);
                  dialog.current?.close();
                }}
              >
                {t("add")}
              </Button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
