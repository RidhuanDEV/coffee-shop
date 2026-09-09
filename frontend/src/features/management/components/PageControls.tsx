import type { ReactElement } from "react";
import { Button } from "@/components/ui/Button";
import { useCoffee } from "@/hooks/useCoffee";
export function PageControls({
  page,
  count,
  onChange,
}: {
  page: number;
  count: number;
  onChange: (page: number) => void;
}): ReactElement {
  const { t } = useCoffee();
  return (
    <div className="pagination no-print">
      <Button
        variant="outline"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        {t("previous")}
      </Button>
      <span>{page}</span>
      <Button
        variant="outline"
        disabled={count < 25}
        onClick={() => onChange(page + 1)}
      >
        {t("next")}
      </Button>
    </div>
  );
}
