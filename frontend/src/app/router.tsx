import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";
const PublicLayout = lazy(
  () => import("@/features/storefront/components/PublicLayout"),
);
const Home = lazy(() => import("@/features/storefront/pages/HomePage"));
const Menu = lazy(() => import("@/features/storefront/pages/MenuPage"));
const Content = lazy(() => import("@/features/storefront/pages/ContentPage"));
const Ordering = lazy(() => import("@/features/ordering/pages/OrderingPage"));
const Cart = lazy(() => import("@/features/ordering/pages/CartPage"));
const Tracking = lazy(() => import("@/features/ordering/pages/TrackingPage"));
const Login = lazy(() => import("@/features/management/pages/LoginPage"));
const Admin = lazy(
  () => import("@/features/management/components/AdminLayout"),
);
const Dashboard = lazy(
  () => import("@/features/management/pages/DashboardPage"),
);
const Orders = lazy(() => import("@/features/management/pages/OrdersPage"));
const Catalog = lazy(() => import("@/features/management/pages/CatalogPage"));
const Tables = lazy(() => import("@/features/management/pages/TablesPage"));
const Payments = lazy(() => import("@/features/management/pages/PaymentsPage"));
const Staff = lazy(() => import("@/features/management/pages/StaffPage"));
const Settings = lazy(() => import("@/features/management/pages/SettingsPage"));
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/menu", element: <Menu /> },
      ...[
        "about",
        "story",
        "gallery",
        "visit",
        "promotions",
        "contact",
        "faq",
      ].map((path) => ({ path: "/" + path, element: <Content /> })),
      { path: "*", element: <Content /> },
    ],
  },
  { path: "/order", element: <Ordering /> },
  { path: "/order/table/:token", element: <Ordering /> },
  { path: "/order/cart", element: <Cart /> },
  { path: "/order/track/:id", element: <Tracking /> },
  { path: "/login", element: <Login /> },
  {
    path: "/admin",
    element: <Admin />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "orders", element: <Orders /> },
      { path: "kitchen", element: <Orders /> },
      { path: "products", element: <Catalog /> },
      { path: "categories", element: <Catalog /> },
      { path: "tables", element: <Tables /> },
      { path: "payments", element: <Payments /> },
      { path: "invoices", element: <Payments /> },
      { path: "reports", element: <Dashboard /> },
      { path: "staff", element: <Staff /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  { path: "/dashboard", element: <Navigate to="/admin" replace /> },
]);
