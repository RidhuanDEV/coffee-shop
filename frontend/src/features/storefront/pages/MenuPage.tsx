import { useState } from "react";
import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { useCoffee } from "@/hooks/useCoffee";
import { useProducts, useCategories } from "@/hooks/useCatalog";
import { ProductCard } from "@/components/coffee/ProductCard";
import { Feedback } from "@/components/coffee/Feedback";
export default function MenuPage(): ReactElement {
  const { t, text } = useCoffee();
  const products = useProducts();
  const categories = useCategories();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const filtered = products.data?.filter(
    (p) =>
      (!category || p.categoryId === category) &&
      text(p.name).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section className="section-wrap content-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t("seasonalText")}</p>
          <h1>{t("menu")}</h1>
        </div>
        <Link className="cta" to="/order">
          {t("order")} ↗
        </Link>
      </div>
      <div className="catalog-toolbar">
        <div className="category-tabs">
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
        <input
          className="search-input"
          type="search"
          placeholder={t("search")}
          aria-label={t("search")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <Feedback
        loading={products.isPending}
        error={products.error}
        retry={() => void products.refetch()}
      />
      <div className="product-grid">
        {filtered?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {filtered?.length === 0 && <p className="feedback">{t("empty")}</p>}
    </section>
  );
}
