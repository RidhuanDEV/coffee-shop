import { useState } from "react";
import type { ReactElement, FormEvent } from "react";
import { useCoffee } from "@/hooks/useCoffee";
import { useShop } from "@/hooks/useCatalog";
import type { Shop } from "@/types/coffee";
import { useAdminMutation } from "@/features/management/hooks/useManagement";
import { LocalizedFields } from "@/features/management/components/LocalizedFields";
import { Feedback } from "@/components/coffee/Feedback";
import { Button } from "@/components/ui/Button";
function SettingsForm({ shop }: { shop: Shop }): ReactElement {
  const { t } = useCoffee();
  const [form, setForm] = useState<Shop>(shop);
  const mutation = useAdminMutation();
  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    try {
      await mutation.mutateAsync({
        method: "put",
        path: "/admin/settings",
        body: form,
      });
    } catch {
      /* Display mutation error. */
    }
  }
  return (
    <form
      className="admin-panel settings-form"
      onSubmit={(e) => void submit(e)}
    >
      <fieldset disabled={mutation.isPending}>
        {(
          ["name", "address", "phone", "email"] satisfies (keyof Pick<
            Shop,
            "name" | "address" | "phone" | "email"
          >)[]
        ).map((key) => (
          <label key={key}>
            {t(key)}
            <input
              required={key === "name"}
              type={key === "email" ? "email" : "text"}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </label>
        ))}
        <LocalizedFields
          label={t("hours")}
          value={form.hours}
          onChange={(hours) => setForm({ ...form, hours })}
        />
        <LocalizedFields
          multiline
          label={t("story")}
          value={form.story}
          onChange={(story) => setForm({ ...form, story })}
        />
        <LocalizedFields
          multiline
          label={t("promotions")}
          value={form.promotion}
          onChange={(promotion) => setForm({ ...form, promotion })}
        />
        <Feedback error={mutation.error} />
        {mutation.isSuccess && <p role="status">{t("saved")}</p>}
        <Button type="submit" loading={mutation.isPending}>
          {t("save")}
        </Button>
      </fieldset>
    </form>
  );
}
export default function SettingsPage(): ReactElement {
  const { t } = useCoffee();
  const shop = useShop();
  return (
    <>
      <h1>{t("settings")}</h1>
      <Feedback loading={shop.isPending} error={shop.error} />
      {shop.data && <SettingsForm shop={shop.data} />}
    </>
  );
}
