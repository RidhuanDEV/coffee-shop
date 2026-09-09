import { useState } from "react";
import type { ReactElement } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu, LogOut, Coffee } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useCoffee } from "@/hooks/useCoffee";
import type { CoffeeKey } from "@/hooks/useCoffee";
import { LanguagePicker } from "@/components/coffee/LanguagePicker";
import { getData } from "@/lib/coffee-api";
import { authUserSchema } from "@/types/coffee";
import { Feedback } from "@/components/coffee/Feedback";
const links: { key: CoffeeKey; path: string; admin: boolean }[] = [
  { key: "dashboard", path: "/admin", admin: true },
  { key: "orders", path: "/admin/orders", admin: false },
  { key: "kitchen", path: "/admin/kitchen", admin: false },
  { key: "products", path: "/admin/products", admin: true },
  { key: "categories", path: "/admin/categories", admin: true },
  { key: "tables", path: "/admin/tables", admin: true },
  { key: "payments", path: "/admin/payments", admin: true },
  { key: "invoices", path: "/admin/invoices", admin: true },
  { key: "reports", path: "/admin/reports", admin: true },
  { key: "staff", path: "/admin/staff", admin: true },
  { key: "settings", path: "/admin/settings", admin: true },
];
export default function AdminLayout(): ReactElement {
  const { t } = useCoffee();
  const [open, setOpen] = useState(false);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const me = useQuery({
    queryKey: ["session", token],
    queryFn: () => getData("/auth/me", authUserSchema),
    enabled: !!token,
    retry: false,
    staleTime: 30000,
  });
  if (!token) return <Navigate to="/login" replace />;
  if (me.isPending || me.isError)
    return (
      <Feedback
        loading={me.isPending}
        error={me.error}
        retry={() => void me.refetch()}
      />
    );
  if (!me.data.permissions.includes("view_orders"))
    return <p>{t("permissions")}</p>;
  const admin = me.data.permissions.includes("manage_users");
  return (
    <div className="admin-app">
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <aside className={open ? "admin-sidebar is-open" : "admin-sidebar"}>
        <Link className="brand" to="/">
          <Coffee size={22} />
          toko kopi.
        </Link>
        <small>{t("admin")}</small>
        <nav>
          {links
            .filter((link) => admin || !link.admin)
            .map((link) => (
              <NavLink
                end
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
              >
                {t(link.key)}
              </NavLink>
            ))}
        </nav>
        <button className="logout" onClick={() => logout()}>
          <LogOut size={16} />
          {t("logout")}
        </button>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          aria-label={t("close")}
          onClick={() => setOpen(false)}
        />
      )}
      <div className="admin-body">
        <header className="admin-header">
          <button
            className="mobile-nav-toggle"
            aria-expanded={open}
            aria-label={t("openNav")}
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </button>
          <span>{t("admin")}</span>
          <div>
            <LanguagePicker />
            <span className="admin-avatar">
              {me.data.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>
        <main id="main" className="admin-content">
          <Outlet context={{ admin }} />
        </main>
      </div>
    </div>
  );
}
