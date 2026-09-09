import { useState } from "react";
import type { ReactElement } from "react";
import { useLocation } from "react-router-dom";
import { z } from "zod";
import { useCoffee } from "@/hooks/useCoffee";
import { orderSchema } from "@/types/coffee";
import type { OrderStatus } from "@/types/coffee";
import {
  useManagement,
  useAdminMutation,
} from "@/features/management/hooks/useManagement";
import { Feedback } from "@/components/coffee/Feedback";
import { Button } from "@/components/ui/Button";
import { Receipt } from "@/components/coffee/Receipt";
const next: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};
export default function OrdersPage(): ReactElement {
  const { t, text, money, date } = useCoffee();
  const kitchen = useLocation().pathname.endsWith("kitchen");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [receipt, setReceipt] = useState("");
  const query = useManagement(
    "orders",
    "/admin/orders?" +
      new URLSearchParams({
        status,
        search,
        page: String(page),
        limit: kitchen ? "100" : "25",
      }).toString(),
    z.array(orderSchema),
    true,
  );
  const mutation = useAdminMutation();
  const orders = query.data?.filter(
    (order) =>
      !kitchen ||
      (["PAID", "CONFIRMED", "PREPARING", "READY"].includes(order.status) &&
        order.payment?.status === "PAID"),
  );
  const selected = query.data?.find((o) => o.id === receipt);
  return (
    <>
      <div className="section-heading">
        <h1>{t(kitchen ? "kitchen" : "orders")}</h1>
        <div className="filters">
          <input
            type="search"
            aria-label={t("orderNumber")}
            placeholder={t("orderNumber")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label={t("orders")}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("all")}</option>
            {(
              [
                "PENDING_PAYMENT",
                "PAID",
                "CONFIRMED",
                "PREPARING",
                "READY",
                "COMPLETED",
                "CANCELLED",
              ] satisfies OrderStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {t(s)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Feedback
        loading={query.isPending}
        error={query.error ?? mutation.error}
      />
      {selected?.invoice ? (
        <>
          <Button className="no-print" onClick={() => setReceipt("")}>
            {t("back")}
          </Button>
          <Receipt order={selected} />
        </>
      ) : (
        <div className="order-board">
          {orders?.map((order) => {
            const nextStatus = next[order.status];
            return (
              <article className="order-ticket" key={order.id}>
                <div className="ticket-header">
                  <h2>
                    {order.tableName
                      ? `${t("table")} ${order.tableName}`
                      : t("TAKEAWAY")}
                  </h2>
                  <span
                    className={`status-badge status-${order.status.toLowerCase()}`}
                  >
                    {t(order.status)}
                  </span>
                </div>
                <small>
                  {order.number} · {date(order.createdAt)}
                </small>
                {order.customerName && <p>{order.customerName}</p>}
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <b>{item.quantity} ×</b> {text(item.name)}
                      {item.notes && <small>{item.notes}</small>}
                    </li>
                  ))}
                </ul>
                {order.notes && <p className="notice">{order.notes}</p>}
                <div className="summary-row">
                  <strong>{money(order.total)}</strong>
                  <span>{order.payment && t(order.payment.status)}</span>
                </div>
                <div className="ticket-actions">
                  {nextStatus && order.payment?.status === "PAID" && (
                    <Button
                      loading={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          method: "patch",
                          path: "/admin/orders/" + order.id + "/status",
                          body: { status: nextStatus },
                        })
                      }
                    >
                      {t(nextStatus)} →
                    </Button>
                  )}
                  {order.invoice && (
                    <Button
                      variant="outline"
                      onClick={() => setReceipt(order.id)}
                    >
                      {t("receipt")}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {orders?.length === 0 && <p className="feedback">{t("empty")}</p>}
      <div className="pagination no-print">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          {t("previous")}
        </Button>
        <span>{page}</span>
        <Button
          variant="outline"
          disabled={(query.data?.length ?? 0) < (kitchen ? 100 : 25)}
          onClick={() => setPage(page + 1)}
        >
          {t("next")}
        </Button>
      </div>
    </>
  );
}
