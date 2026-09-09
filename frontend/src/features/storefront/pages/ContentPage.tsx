import type { ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCoffee } from "@/hooks/useCoffee";
import type { CoffeeKey } from "@/hooks/useCoffee";
import { useShop } from "@/hooks/useCatalog";
import { Feedback } from "@/components/coffee/Feedback";
const pages: Record<string, CoffeeKey> = {
  "/about": "about",
  "/story": "story",
  "/gallery": "gallery",
  "/visit": "visit",
  "/promotions": "promotions",
  "/contact": "contact",
  "/faq": "faq",
};
export default function ContentPage(): ReactElement {
  const { pathname } = useLocation();
  const { t, text } = useCoffee();
  const shop = useShop();
  const page = pages[pathname] ?? "notFound";
  return (
    <div className="section-wrap content-page">
      <p className="eyebrow">TOKO KOPI / {t(page)}</p>
      <h1>{t(page)}</h1>
      {page === "faq" ? (
        <div className="faq-list">
          {(["faq1", "faq2", "faq3"] satisfies CoffeeKey[]).map(
            (key, index) => (
              <details key={key}>
                <summary>{t(key)}</summary>
                <p>
                  {t(
                    index === 0
                      ? "faq1Answer"
                      : index === 1
                        ? "faq2Answer"
                        : "faq3Answer",
                  )}
                </p>
              </details>
            ),
          )}
        </div>
      ) : page === "gallery" ? (
        <>
          <p>{t("galleryText")}</p>
          <div className="gallery-grid">
            {["interior", "latte", "pastry", "hero", "espresso", "cake"].map(
              (image, index) => (
                <img
                  key={image}
                  src={`/assets/${image}.webp`}
                  alt={`${t("gallery")} ${index + 1}`}
                  loading="lazy"
                  width="800"
                  height="700"
                />
              ),
            )}
          </div>
        </>
      ) : (
        <>
          <Feedback loading={shop.isPending} error={shop.error} />
          {shop.data && (
            <div className="editorial-grid">
              <img
                src={`/assets/${page === "promotions" ? "latte" : "interior"}.webp`}
                alt={t(page)}
                width="900"
                height="800"
              />
              <div>
                <h2>{t(page === "visit" ? "space" : "since")}</h2>
                {(page === "about" || page === "story") && (
                  <p>{text(shop.data.story)}</p>
                )}
                {page === "promotions" && <p>{text(shop.data.promotion)}</p>}
                {(page === "visit" || page === "contact") && (
                  <>
                    <p>{shop.data.address || t("locationPending")}</p>
                    <h3>{t("hours")}</h3>
                    <p>{text(shop.data.hours)}</p>
                    <p>{shop.data.phone || t("contactPending")}</p>
                    {shop.data.email && (
                      <a href={`mailto:${shop.data.email}`}>
                        {shop.data.email}
                      </a>
                    )}
                  </>
                )}
                <Link className="cta" to="/order">
                  {t("order")} ↗
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
