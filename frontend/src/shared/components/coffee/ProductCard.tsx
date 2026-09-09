import type { ReactElement } from "react";
import { Plus, ArrowUpRight } from "lucide-react";
import type { Product } from "@/types/coffee";
import { useCoffee } from "@/hooks/useCoffee";
import { Button } from "@/components/ui/Button";
interface Props {
  product: Product;
  onAdd?: (product: Product) => void;
  onDetail?: (product: Product) => void;
}
export function ProductCard({ product, onAdd, onDetail }: Props): ReactElement {
  const { t, text, money } = useCoffee();
  return (
    <article className="product-card">
      <button
        className="product-image"
        onClick={() => onDetail?.(product)}
        disabled={!onDetail}
        aria-label={`${t("details")}: ${text(product.name)}`}
      >
        <img
          src={product.image}
          alt={text(product.name)}
          loading="lazy"
          width="480"
          height="400"
        />
        {product.featured && (
          <span className="product-label">{t("featured")}</span>
        )}
        {onDetail && <ArrowUpRight className="image-arrow" />}
      </button>
      <div className="product-copy">
        <h3>{text(product.name)}</h3>
        <p>{text(product.description)}</p>
        <div className="product-bottom">
          <strong>{money(product.price)}</strong>
          {onAdd && (
            <Button
              size="sm"
              variant="outline"
              disabled={!product.available}
              onClick={() => onAdd(product)}
              aria-label={`${t("add")}: ${text(product.name)}`}
            >
              <Plus size={16} />
              {t("add")}
            </Button>
          )}
        </div>
        {!product.available && <small>{t("unavailable")}</small>}
      </div>
    </article>
  );
}
