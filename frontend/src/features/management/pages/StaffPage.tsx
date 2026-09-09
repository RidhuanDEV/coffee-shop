import { useState } from "react";
import { PageControls } from "@/features/management/components/PageControls";
import type { ReactElement, FormEvent } from "react";
import { z } from "zod";
import { useCoffee } from "@/hooks/useCoffee";
import { staffSchema } from "@/types/coffee";
import {
  useManagement,
  useAdminMutation,
} from "@/features/management/hooks/useManagement";
import { Feedback } from "@/components/coffee/Feedback";
import { Button } from "@/components/ui/Button";
export default function StaffPage(): ReactElement {
  const { t } = useCoffee();
  const [page, setPage] = useState(1);
  const query = useManagement(
    "staff",
    "/admin/staff?page=" + String(page),
    z.array(staffSchema),
  );
  const mutation = useAdminMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    try {
      await mutation.mutateAsync({
        method: "post",
        path: "/admin/staff",
        body: { email, password, role },
      });
      setEmail("");
      setPassword("");
    } catch {
      /* Feedback below. */
    }
  }
  return (
    <>
      <h1>{t("staff")}</h1>
      <Feedback
        loading={query.isPending}
        error={query.error ?? mutation.error}
      />
      <div className="dashboard-grid">
        <div className="admin-panel table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("email")}</th>
                <th>{t("role")}</th>
                <th>{t("remove")}</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>
                    {user.role.name === "admin" ? t("admin") : t("staff")}
                  </td>
                  <td>
                    {user.role.name !== "admin" && (
                      <Button
                        variant="outline"
                        disabled={mutation.isPending}
                        onClick={() => {
                          if (window.confirm(t("remove") + "?"))
                            mutation.mutate({
                              method: "delete",
                              path: "/admin/staff/" + user.id,
                              body: {},
                            });
                        }}
                      >
                        {t("remove")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="admin-panel" onSubmit={(e) => void submit(e)}>
          <h2>{t("create")}</h2>
          <fieldset disabled={mutation.isPending}>
            <label>
              {t("email")}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              {t("password")}
              <input
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              {t("role")}
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="staff">{t("staff")}</option>
                <option value="admin">{t("admin")}</option>
              </select>
            </label>
            <Button type="submit" loading={mutation.isPending}>
              {t("create")}
            </Button>
          </fieldset>
        </form>
      </div>
      <PageControls
        page={page}
        count={query.data?.length ?? 0}
        onChange={setPage}
      />
    </>
  );
}
