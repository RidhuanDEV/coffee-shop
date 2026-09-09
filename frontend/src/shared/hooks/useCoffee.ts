import { useTranslation } from "react-i18next";
import { resolveLocale } from "@/locales/i18n";
import type copy from "@/locales/id/coffee.json";
import type { LocalizedText, Locale } from "@/types/coffee";
export type CoffeeKey = keyof typeof copy;
interface CoffeeTranslation {
  t: (key: CoffeeKey) => string;
  locale: Locale;
  text: (value: LocalizedText) => string;
  money: (value: number) => string;
  date: (value: string) => string;
}
export function useCoffee(): CoffeeTranslation {
  const { t, i18n } = useTranslation("coffee");
  const locale = resolveLocale(i18n.language);
  return {
    t: (key: CoffeeKey): string => t(key),
    locale,
    text: (value: LocalizedText): string => value[locale] || value.id,
    money: (value: number): string =>
      new Intl.NumberFormat(
        locale === "ms" ? "ms-MY" : locale === "en" ? "en-ID" : "id-ID",
        { style: "currency", currency: "IDR", maximumFractionDigits: 0 },
      ).format(value),
    date: (value: string): string =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date(value)),
  };
}
