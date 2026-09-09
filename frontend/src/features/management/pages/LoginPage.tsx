import { useState } from "react";
import type { ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCoffee } from "@/hooks/useCoffee";
import { useAuthStore } from "@/store/auth.store";
import { signIn } from "@/lib/session";
import { coffeeErrorKey } from "@/lib/coffee-errors";
import { Button } from "@/components/ui/Button";
import { LanguagePicker } from "@/components/coffee/LanguagePicker";
const schema = z.object({ email: z.email(), password: z.string().min(1) });
type Credentials = z.infer<typeof schema>;
export default function LoginPage(): ReactElement {
  const { t } = useCoffee();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Credentials>({ resolver: zodResolver(schema) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  async function submit(values: Credentials): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const session = await signIn(values.email, values.password);
      setAuth(session.token, session.user);
      await navigate(
        session.user.permissions.includes("manage_users")
          ? "/admin"
          : "/admin/orders",
      );
    } catch (failure) {
      setError(
        failure instanceof Error ? failure : new Error("REQUEST_FAILED"),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-photo">
        <img
          src="/assets/interior.webp"
          alt={t("space")}
          width="1000"
          height="1200"
        />
        <Link className="brand" to="/">
          toko kopi.
        </Link>
      </div>
      <main className="login-form">
        <LanguagePicker />
        <p className="eyebrow">{t("admin")}</p>
        <h1>{t("loginTitle")}</h1>
        <p>{t("loginText")}</p>
        <form onSubmit={(event) => void handleSubmit(submit)(event)}>
          <label>
            {t("email")}
            <input
              type="email"
              autoComplete="username"
              {...register("email")}
            />
          </label>
          <label>
            {t("password")}
            <input
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
          </label>
          {Object.keys(errors).length > 0 && (
            <p role="alert">{t("validation")}</p>
          )}
          {error && (
            <p role="alert" className="notice danger">
              {t(coffeeErrorKey(error))}
            </p>
          )}
          <Button type="submit" loading={busy} fullWidth size="lg">
            {t("login")} →
          </Button>
        </form>
        <Link className="text-link" to="/">
          ← {t("home")}
        </Link>
      </main>
    </div>
  );
}
