import { useState } from "react";
import type { ReactElement } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowUpRight, Menu, X, Coffee } from "lucide-react";
import { useCoffee } from "@/hooks/useCoffee";
import { LanguagePicker } from "@/components/coffee/LanguagePicker";
import { useShop } from "@/hooks/useCatalog";
import type { CoffeeKey } from "@/hooks/useCoffee";
const nav: { path: string; key: CoffeeKey }[] = [
  { path: "/", key: "home" },
  { path: "/menu", key: "menu" },
  { path: "/about", key: "about" },
  { path: "/gallery", key: "gallery" },
  { path: "/visit", key: "visit" },
];
export default function PublicLayout(): ReactElement {
  const { t, text } = useCoffee();
  const [open, setOpen] = useState(false);
  const shop = useShop();
  return (
    <div className="coffee-site">
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <div className="announcement">
        {t("eyebrow")}
        <span>TOKO KOPI</span>
      </div>
      <header className="public-header">
        <Link className="brand" to="/" aria-label="Toko Kopi">
          <Coffee strokeWidth={1.3} />
          <span>
            toko kopi<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav
          className={open ? "public-nav is-open" : "public-nav"}
          aria-label={t("menu")}
        >
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={() => setOpen(false)}
            >
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <LanguagePicker />
          <Link className="cta small" to="/order">
            {t("order")}
            <ArrowUpRight size={16} />
          </Link>
          <button
            className="mobile-nav-toggle"
            aria-expanded={open}
            aria-label={t("openNav")}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="public-footer">
        <div>
          <Link className="brand" to="/">
            toko kopi.
          </Link>
          <p>{t("footerLine")}</p>
          <small>© {new Date().getFullYear()} Toko Kopi</small>
        </div>
        <div>
          <h3>{t("explore")}</h3>
          {[
            { path: "/menu", key: "menu" },
            { path: "/story", key: "story" },
            { path: "/promotions", key: "promotions" },
            { path: "/faq", key: "faq" },
          ].map((item) => (
            <Link key={item.path} to={item.path}>
              {t(
                item.key === "menu"
                  ? "menu"
                  : item.key === "story"
                    ? "story"
                    : item.key === "promotions"
                      ? "promotions"
                      : "faq",
              )}
            </Link>
          ))}
        </div>
        <div>
          <h3>{t("visit")}</h3>
          <p>{shop.data?.address || t("locationPending")}</p>
          <p>{shop.data && text(shop.data.hours)}</p>
          <Link to="/contact">{t("contact")}</Link>
          <Link to="/admin">{t("admin")} ↗</Link>
        </div>
      </footer>
    </div>
  );
}
