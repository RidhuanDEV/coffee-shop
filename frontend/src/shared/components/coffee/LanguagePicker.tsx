import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, resolveLocale } from "@/locales/i18n";
import type { ReactElement } from "react";
export function LanguagePicker(): ReactElement {
  const { t, i18n } = useTranslation("coffee");
  return (
    <select
      className="language-select"
      aria-label={t("language")}
      value={resolveLocale(i18n.language)}
      onChange={(event) => {
        void i18n.changeLanguage(resolveLocale(event.target.value));
      }}
    >
      {SUPPORTED_LANGUAGES.map((language) => (
        <option key={language.code} value={language.code}>
          {language.name}
        </option>
      ))}
    </select>
  );
}
