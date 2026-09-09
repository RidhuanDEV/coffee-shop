import { useState } from "react";
import type { ReactElement } from "react";
import { useLocation } from "react-router-dom";
import { z } from "zod";
import { useCoffee } from "@/hooks/useCoffee";
import { paymentSchema, invoiceSchema, orderSchema } from "@/types/coffee";
import { useManagement } from "@/features/management/hooks/useManagement";
import { Feedback } from "@/components/coffee/Feedback";
import { Receipt } from "@/components/coffee/Receipt";
import { Button } from "@/components/ui/Button";
import { useQuery } from "@tanstack/react-query";
import { getData } from "@/lib/coffee-api";
export default function PaymentsPage(): ReactElement {
  const invoices = useLocation().pathname.endsWith("invoices");
  const { t, money, date } = useCoffee();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const params = new URLSearchParams({ page: String(page), search }).toString();
  const payments = useManagement(
    "payments",
    "/admin/payments?" + params,
    z.array(paymentSchema),
    true,
  );
  const receipts = useManagement(
    "invoices",
    "/admin/invoices?" + params,
    z.array(invoiceSchema),
    true,
  );
  const order = useQuery({
    queryKey: ["admin-receipt", selected],
    queryFn: () => getData("/admin/orders/" + selected, orderSchema),
    enabled: !!selected,
  });
  return (
    <>
      <div className="section-heading no-print">
        <h1>{t(invoices ? "invoices" : "payments")}</h1>
        <input
          type="search"
          aria-label={t("search")}
          placeholder={t("orderNumber")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <Feedback
        loading={invoices ? receipts.isPending : payments.isPending}
        error={payments.error ?? receipts.error ?? order.error}
      />
      {selected && order.data ? (
        <>
          <Button className="no-print" onClick={() => setSelected("")}>
            {t("back")}
          </Button>
          <Receipt order={order.data} />
        </>
      ) : (
        <div className="admin-panel table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("reference")}</th>
                <th>{t(invoices ? "name" : "total")}</th>
                <th>{t("payment")}</th>
                <th>{t("details")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices
                ? receipts.data?.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        {invoice.number}
                        <small>{date(invoice.issuedAt)}</small>
                      </td>
                      <td>{invoice.shopName}</td>
                      <td>QRIS</td>
                      <td>
                        <Button
                          variant="outline"
                          onClick={() => setSelected(invoice.orderId)}
                        >
                          {t("receipt")}
                        </Button>
                      </td>
                    </tr>
                  ))
                : payments.data?.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        {payment.reference}
                        <small>{payment.transactionId ?? "—"}</small>
                      </td>
                      <td>{money(payment.amount)}</td>
                      <td>
                        <span
                          className={`status-badge status-${payment.status.toLowerCase()}`}
                        >
                          {t(payment.status)}
                        </span>
                        {payment.reconcile && <small>{t("reconcile")}</small>}
                      </td>
                      <td>
                        <small>{payment.provider} · QRIS</small>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}
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
          disabled={
            (invoices
              ? (receipts.data?.length ?? 0)
              : (payments.data?.length ?? 0)) < 25
          }
          onClick={() => setPage(page + 1)}
        >
          {t("next")}
        </Button>
      </div>
    </>
  );
}
