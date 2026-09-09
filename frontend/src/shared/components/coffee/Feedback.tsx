import type { ReactElement } from "react";
import { useCoffee } from "@/hooks/useCoffee";
import { Button } from "@/components/ui/Button";
import { coffeeErrorKey } from "@/lib/coffee-errors";
export function Feedback({
  loading,
  error,
  retry,
}: {
  loading?: boolean;
  error?: Error | null;
  retry?: () => void;
}): ReactElement | null {
  const { t } = useCoffee();
  if (loading)
    return (
      <div className="feedback" role="status">
        <span className="coffee-loader" />
        {t("loading")}
      </div>
    );
  if (error)
    return (
      <div className="feedback" role="alert">
        <p>{t(coffeeErrorKey(error))}</p>
        {retry && <Button onClick={retry}>{t("retry")}</Button>}
      </div>
    );
  return null;
}
