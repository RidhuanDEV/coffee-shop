import type { ReactElement } from "react";
import type { Order } from "@/types/coffee";
import { useCoffee } from "@/hooks/useCoffee";
import { Button } from "@/components/ui/Button";
export function Receipt({ order }: { order: Order }): ReactElement {
  const { t, text, money, date } = useCoffee();
  return (
    <section className="receipt">
      <div className="receipt-heading">
        <span className="brand">
          {order.invoice?.shopName ?? "Toko Kopi"}
        </span>
        <p>{t("receiptTitle")}</p>
        <p>{order.invoice?.number}</p>
        <small>{date(order.invoice?.issuedAt ?? order.createdAt)}</small>
      </div>
      <p>
        {order.number} · {t(order.fulfillment)}{" "}
        {order.tableName && `· ${t("table")} ${order.tableName}`}
      </p>
      {order.customerName && <p>{order.customerName}</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("quantity")}</th>
              <th>{t("unitPrice")}</th>
              <th>{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{text(item.name)}</td>
                <td>{item.quantity}</td>
                <td>{money(item.unitPrice)}</td>
                <td>{money(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="summary-row">
        <span>{t("subtotal")}</span>
        <strong>{money(order.subtotal)}</strong>
      </div>
      <div className="summary-row">
        <span>{t("total")}</span>
        <strong>{money(order.total)}</strong>
      </div>
      <p>QRIS · {order.payment && t(order.payment.status)}</p>
      <small>
        {t("reference")}: {order.payment?.transactionId}
      </small>
      <p>{t("thanks")}</p>
      <Button className="no-print" onClick={() => window.print()}>
        {t("print")}
      </Button>
    </section>
  );
}
