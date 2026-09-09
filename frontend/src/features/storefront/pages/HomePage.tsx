import type { ReactElement } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { useCoffee } from "@/hooks/useCoffee";
import { useProducts, useShop } from "@/hooks/useCatalog";
import { ProductCard } from "@/components/coffee/ProductCard";
import { Feedback } from "@/components/coffee/Feedback";
export default function HomePage(): ReactElement {
  const { t, text } = useCoffee();
  const products = useProducts();
  const shop = useShop();
  return (
    <>
      <section className="hero section-wrap">
        <div className="hero-copy">
          <p className="eyebrow">{t("heroEyebrow")}</p>
          <h1>{t("hero")}</h1>
          <p className="hero-description">{t("heroText")}</p>
          <div className="hero-buttons">
            <Link className="cta" to="/order">
              {t("order")}
              <ArrowUpRight size={18} />
            </Link>
            <Link className="text-link" to="/menu">
              {t("explore")}
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="tiny-star">✳</span>
            <span>{t("since")}</span>
            <span className="hairline" />
          </div>
        </div>
        <div className="hero-media">
          <img
            className="hero-photo"
            src="/assets/hero.webp"
            alt={t("space")}
            width="900"
            height="1050"
            fetchPriority="high"
          />
          <div className="image-caption">
            <span>01 / TOKO KOPI</span>
            <span>{t("space")}</span>
          </div>
          <div className="round-stamp">
            {t("brewedWithCare")}
            <br />
            <span>✳</span>
          </div>
        </div>
      </section>
      <div className="brand-strip">
        <span>{t("coffee")}</span>
        <span>✳</span>
        <span>{t("conversation")}</span>
        <span>✳</span>
        <span>{t("comfort")}</span>
        <span>✳</span>
        <span>TOKO KOPI</span>
      </div>
      <section className="section-wrap section-space">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t("seasonalText")}</p>
            <h2>{t("seasonal")}</h2>
          </div>
          <Link className="text-link" to="/menu">
            {t("explore")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <Feedback
          loading={products.isPending}
          error={products.error}
          retry={() => void products.refetch()}
        />
        <div className="product-grid three">
          {products.data
            ?.filter((p) => p.featured)
            .slice(0, 3)
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </section>
      <section className="space-section">
        <div className="space-photo">
          <img
            src="/assets/interior.webp"
            alt={t("space")}
            width="900"
            height="800"
            loading="lazy"
          />
        </div>
        <div className="space-copy">
          <p className="eyebrow">{t("spaceEyebrow")}</p>
          <h2>{t("space")}</h2>
          <p>{t("spaceText")}</p>
          <Link className="text-link" to="/story">
            {t("story")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section-wrap visit-banner">
        <p className="eyebrow">{t("promotions")}</p>
        <h2>{shop.data ? text(shop.data.promotion) : t("seasonalText")}</h2>
        <Link className="cta" to="/order">
          {t("order")}
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
