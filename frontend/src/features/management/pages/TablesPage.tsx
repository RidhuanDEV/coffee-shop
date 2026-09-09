import { useState, useRef } from "react";
import { PageControls } from "@/features/management/components/PageControls";
import type { ReactElement, FormEvent } from "react";
import { z } from "zod";
import QRCode from "qrcode";
import { useCoffee } from "@/hooks/useCoffee";
import { tableSchema } from "@/types/coffee";
import type { CafeTable } from "@/types/coffee";
import {
  useManagement,
  useAdminMutation,
} from "@/features/management/hooks/useManagement";
import { Feedback } from "@/components/coffee/Feedback";
import { Button } from "@/components/ui/Button";
interface TableForm {
  code: string;
  name: string;
  area: string;
  active: boolean;
}
const blank: TableForm = { code: "", name: "", area: "", active: true };
export default function TablesPage(): ReactElement {
  const { t } = useCoffee();
  const [page, setPage] = useState(1);
  const query = useManagement(
    "tables",
    "/admin/tables?page=" + String(page),
    z.array(tableSchema),
  );
  const mutation = useAdminMutation();
  const [form, setForm] = useState<TableForm>(blank);
  const [editing, setEditing] = useState("");
  const [qr, setQr] = useState<{
    image: string;
    url: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const qrDialog = useRef<HTMLDialogElement>(null);
  function open(table?: CafeTable): void {
    setEditing(table?.id ?? "");
    setForm(
      table
        ? {
            code: table.code,
            name: table.name,
            area: table.area,
            active: table.active ?? true,
          }
        : blank,
    );
    mutation.reset();
    dialog.current?.showModal();
  }
  async function showQr(table: CafeTable): Promise<void> {
    try {
      const url = window.location.origin + "/order/table/" + table.token;
      const image = await QRCode.toDataURL(url, {
        width: 600,
        margin: 4,
        errorCorrectionLevel: "M",
      });
      setQr({ image, url, name: table.name });
      qrDialog.current?.showModal();
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error("QR_FAILED"));
    }
  }
  async function save(event: FormEvent): Promise<void> {
    event.preventDefault();
    try {
      await mutation.mutateAsync({
        method: editing ? "put" : "post",
        path: "/admin/tables" + (editing ? "/" + editing : ""),
        body: form,
      });
      dialog.current?.close();
    } catch {
      /* Feedback below. */
    }
  }
  return (
    <>
      <div className="section-heading">
        <h1>{t("tables")}</h1>
        <Button onClick={() => open()}>+ {t("create")}</Button>
      </div>
      <Feedback
        loading={query.isPending}
        error={query.error ?? error ?? mutation.error}
      />
      <div className="tables-grid">
        {query.data?.map((table) => (
          <article className="table-card" key={table.token}>
            <div className="summary-row">
              <span>{table.area}</span>
              <span className="status-badge">
                {t(table.active ? "active" : "unavailable")}
              </span>
            </div>
            <h2>
              {t("table")} {table.name}
            </h2>
            <div className="table-actions">
              <Button variant="outline" onClick={() => open(table)}>
                {t("edit")}
              </Button>
              <Button
                disabled={!table.active}
                onClick={() => void showQr(table)}
              >
                QR ↗
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={mutation.isPending}
                onClick={() => {
                  if (table.id && window.confirm(t("rotateConfirm")))
                    mutation.mutate({
                      method: "post",
                      path: "/admin/tables/" + table.id + "/rotate",
                      body: {},
                    });
                }}
              >
                {t("rotate")}
              </Button>
            </div>
          </article>
        ))}
      </div>
      <PageControls
        page={page}
        count={query.data?.length ?? 0}
        onChange={setPage}
      />
      <dialog ref={dialog} className="editor-dialog">
        <form onSubmit={(event) => void save(event)}>
          <div className="section-heading">
            <h2>{t("table")}</h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={t("close")}
            >
              ×
            </button>
          </div>
          <fieldset disabled={mutation.isPending}>
            {(
              ["code", "name", "area"] satisfies (keyof Pick<
                TableForm,
                "code" | "name" | "area"
              >)[]
            ).map((key) => (
              <label key={key}>
                {t(key)}
                <input
                  required={key !== "area"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              {t("active")}
            </label>
            <Feedback error={mutation.error} />
            <Button type="submit" loading={mutation.isPending}>
              {t("save")}
            </Button>
          </fieldset>
        </form>
      </dialog>
      <dialog ref={qrDialog} className="qr-dialog">
        {qr && (
          <>
            <div className="qr-print">
              <span className="brand">toko kopi.</span>
              <h2>
                {t("table")} {qr.name}
              </h2>
              <img
                src={qr.image}
                alt={`${t("order")} ${qr.name}`}
                width="300"
                height="300"
              />
              <p>{t("order")}</p>
            </div>
            <div className="table-actions no-print">
              <a
                className="cta"
                href={qr.image}
                download={`toko-kopi-table-${qr.name}.png`}
              >
                {t("download")}
              </a>
              <Button onClick={() => window.print()}>{t("print")}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(qr.url)
                    .catch(() => setError(new Error("COPY_FAILED")));
                }}
              >
                {t("copy")}
              </Button>
              <Button variant="ghost" onClick={() => qrDialog.current?.close()}>
                {t("close")}
              </Button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
