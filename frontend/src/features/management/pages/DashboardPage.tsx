import { useState } from "react";
import type { ReactElement } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { useCoffee } from "@/hooks/useCoffee";
import { reportSchema } from "@/types/coffee";
import { useManagement } from "@/features/management/hooks/useManagement";
import { Feedback } from "@/components/coffee/Feedback";
export default function DashboardPage(): ReactElement {
  const { admin } = useOutletContext<{ admin: boolean }>();
  const { t, money, locale } = useCoffee();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const query = useManagement(
    "reports",
    "/admin/reports?" +
      new URLSearchParams({
        locale,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }).toString(),
    reportSchema,
    true,
  );
  const report = query.data;
  if (!admin) return <Link to="/admin/orders">{t("orders")} →</Link>;
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">TOKO KOPI</p>
          <h1>{t("dashboard")}</h1>
        </div>
        <div className="date-filters">
          <label>
            {t("from")}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            {t("to")}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
        </div>
      </div>
      <Feedback loading={query.isPending} error={query.error} />
      {report && (
        <>
          <div className="metrics">
            {[
              { label: t("todayRevenue"), value: money(report.todayRevenue) },
              { label: t("revenue"), value: money(report.revenue) },
              { label: t("activeOrders"), value: String(report.activeOrders) },
              { label: t("average"), value: money(report.average) },
            ].map((metric) => (
              <section className="metric" key={metric.label}>
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
              </section>
            ))}
          </div>
          <div className="dashboard-grid">
            <section className="admin-panel">
              <h2>{t("revenueHistory")}</h2>
              <p className="muted">
                {report.from} — {report.to}
              </p>
              <div className="revenue-chart">
                {report.rows.map((row) => (
                  <div className="chart-row" key={row.date}>
                    <span>{row.date}</span>
                    <div>
                      <span
                        style={{
                          width: `${Math.max(2, (row.revenue / Math.max(1, ...report.rows.map((r) => r.revenue))) * 100)}%`,
                        }}
                      />
                    </div>
                    <strong>{money(row.revenue)}</strong>
                  </div>
                ))}
                {report.rows.length === 0 && (
                  <p className="feedback">{t("empty")}</p>
                )}
              </div>
            </section>
            <section className="admin-panel">
              <h2>{t("bestSellers")}</h2>
              {report.bestSellers.map((product, index) => (
                <div className="seller-row" key={product.name}>
                  <span className="seller-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{product.name}</strong>
                    <small>
                      {product.quantity} {t("items")}
                    </small>
                  </div>
                  <span>{money(product.revenue)}</span>
                </div>
              ))}
            </section>
          </div>
          <section className="admin-panel">
            <h2>{t("revenueCategory")}</h2>
            {report.categoryRevenue.map((category) => (
              <div className="summary-row" key={category.name}>
                <span>{category.name}</span>
                <strong>{money(category.revenue)}</strong>
              </div>
            ))}
          </section>
          <div className="metrics small-metrics">
            <section className="metric">
              <p>{t("weekRevenue")}</p>
              <strong>{money(report.weekRevenue)}</strong>
            </section>
            <section className="metric">
              <p>{t("monthRevenue")}</p>
              <strong>{money(report.monthRevenue)}</strong>
            </section>
            <section className="metric">
              <p>{t("paidOrders")}</p>
              <strong>{report.count}</strong>
            </section>
            <section className="metric">
              <p>{t("PENDING")}</p>
              <strong>{report.pendingOrders}</strong>
            </section>
            <section className="metric">
              <p>{t("COMPLETED")}</p>
              <strong>{report.completedOrders}</strong>
            </section>
            <section className="metric">
              <p>{t("refunds")}</p>
              <strong>{money(report.refunded)}</strong>
            </section>
          </div>
          <Link className="text-link" to="/admin/orders">
            {t("recentOrders")} →
          </Link>
        </>
      )}
    </>
  );
}
