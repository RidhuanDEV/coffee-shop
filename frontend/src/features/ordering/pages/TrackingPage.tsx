import { useState } from "react";
import type { ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { useCoffee } from "@/hooks/useCoffee";
import { useOrder } from "@/features/ordering/hooks/useOrder";
import { LanguagePicker } from "@/components/coffee/LanguagePicker";
import { Feedback } from "@/components/coffee/Feedback";
import { Receipt } from "@/components/coffee/Receipt";
import { Button } from "@/components/ui/Button";
import { mutateData } from "@/lib/coffee-api";
import type { OrderStatus } from "@/types/coffee";
export default function TrackingPage(): ReactElement {
  const { id = "" } = useParams();
  const { t, text, money, date } = useCoffee();
  const [receipt, setReceipt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const token =
    window.location.hash.slice(1) ||
    localStorage.getItem("ruang-seduh-order-" + id) ||
    "";
  const query = useOrder(id, token);
  const order = query.data;
  const stages: OrderStatus[] = [
    "PAID",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "COMPLETED",
  ];
  async function cancel(): Promise<void> {
    if (!window.confirm(t("confirmCancel"))) return;
    setBusy(true);
    try {
      await mutateData(
        "post",
        "/orders/" + id + "/cancel",
        {},
        z.null(),
        token,
      );
      await query.refetch();
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("CANCEL_FAILED"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ordering-app">
      <header className="ordering-header no-print">
        <Link to="/order">← {t("menu")}</Link>
        <span className="brand">toko kopi.</span>
        <LanguagePicker />
      </header>
      <main className="tracking-main">
        {!token ? (
          <p role="alert">{t("orderAccess")}</p>
        ) : (
          <Feedback
            loading={query.isPending}
            error={query.error ?? error}
            retry={() => void query.refetch()}
          />
        )}{" "}
        {order &&
          (receipt && order.invoice ? (
            <Receipt order={order} />
          ) : (
            <>
              <p className="eyebrow">{order.number}</p>
              <h1>
                {order.status === "PENDING_PAYMENT"
                  ? t("payment")
                  : t("tracking")}
              </h1>
              <div className="tracking-meta">
                <span>
                  {t(order.fulfillment)}{" "}
                  {order.tableName && `· ${t("table")} ${order.tableName}`}
                </span>
                <span>{date(order.createdAt)}</span>
              </div>
              {order.payment && (
                <section className="payment-panel">
                  <span
                    className={`status-badge status-${order.payment.status.toLowerCase()}`}
                  >
                    {t(order.payment.status)}
                  </span>
                  <h2>{money(order.total)}</h2>
                  {order.payment.status === "PENDING" && (
                    <>
                      {order.payment.provider === "mock" ? (
                        <p className="notice">{t("mockNotice")}</p>
                      ) : order.payment.qrUrl ? (
                        <>
                          <img
                            className="payment-qr"
                            src={order.payment.qrUrl}
                            alt="QRIS"
                            width="300"
                            height="300"
                          />
                          <p>{t("paymentInstruction")}</p>
                          <p className="muted">{t("samePhone")}</p>
                          <a
                            href={order.payment.qrUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-link"
                          >
                            {t("download")} ↗
                          </a>
                        </>
                      ) : (
                        <p role="status">{t("qrLoading")}</p>
                      )}
                      <p>
                        {t("expires")}: {date(order.payment.expiresAt)}
                      </p>
                    </>
                  )}
                  {order.payment.reconcile && (
                    <p className="notice">{t("reconcile")}</p>
                  )}
                </section>
              )}
              {order.status !== "PENDING_PAYMENT" &&
                order.status !== "CANCELLED" && (
                  <ol className="order-progress">
                    {stages.map((stage, index) => (
                      <li
                        key={stage}
                        className={
                          index <= stages.indexOf(order.status) ? "reached" : ""
                        }
                      >
                        <span>{index + 1}</span>
                        {t(stage)}
                      </li>
                    ))}
                  </ol>
                )}
              {order.status === "CANCELLED" && (
                <p className="notice">{t("CANCELLED")}</p>
              )}
              <section className="tracking-items">
                <h2>{t("orders")}</h2>
                {order.items.map((item) => (
                  <div className="summary-row" key={item.id}>
                    <span>
                      {item.quantity} × {text(item.name)}
                      {item.notes && <small>{item.notes}</small>}
                    </span>
                    <strong>{money(item.lineTotal)}</strong>
                  </div>
                ))}
                {order.notes && (
                  <p>
                    {t("notes")}: {order.notes}
                  </p>
                )}
              </section>
              <div className="tracking-actions">
                {order.invoice && (
                  <Button onClick={() => setReceipt(true)}>
                    {t("receipt")}
                  </Button>
                )}
                {order.status === "PENDING_PAYMENT" &&
                  order.payment?.status === "PENDING" && (
                    <Button
                      variant="outline"
                      loading={busy}
                      onClick={() => void cancel()}
                    >
                      {t("cancel")}
                    </Button>
                  )}
              </div>
            </>
          ))}
      </main>
    </div>
  );
}
