import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import idCoffee from "./id/coffee.json";
import enCoffee from "./en/coffee.json";
import msCoffee from "./ms/coffee.json";

import enCommon from "./en/common.json";
import enAuth from "./en/auth.json";
import enSettings from "./en/settings.json";
import enDashboard from "./en/dashboard.json";

import idCommon from "./id/common.json";
import idAuth from "./id/auth.json";
import idSettings from "./id/settings.json";
import idDashboard from "./id/dashboard.json";

export const defaultNS = "common";
export const resources = {
  ms: { coffee: msCoffee },
  en: {
    coffee: enCoffee,
    common: enCommon,
    auth: enAuth,
    settings: enSettings,
    dashboard: enDashboard,
  },
  id: {
    coffee: idCoffee,
    common: idCommon,
    auth: idAuth,
    settings: idSettings,
    dashboard: idDashboard,
  },
};

export type SupportedLanguage = "en" | "id" | "ms";

export const SUPPORTED_LANGUAGES: readonly {
  code: SupportedLanguage;
  name: string;
  flag: string;
}[] = [
  { code: "en", name: "EN English", flag: "🇬🇧" },
  { code: "ms", name: "MY Malay", flag: "🇲🇾" },
  { code: "id", name: "ID Indonesia", flag: "🇮🇩" },
];

void i18n.use(initReactI18next).init({
  lng: resolveLocale(localStorage.getItem("app_language")),
  fallbackLng: "id",
  supportedLngs: ["en", "id", "ms"],
  defaultNS,
  resources,
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ["localStorage", "navigator"],
    lookupLocalStorage: "app_language",
    caches: ["localStorage"],
  },
});

export function resolveLocale(value: string | null): SupportedLanguage {
  return value === "en" || value === "ms" ? value : "id";
}
i18n.on("languageChanged", (value: string): void => {
  const locale = resolveLocale(value);
  document.documentElement.lang = locale;
  localStorage.setItem("app_language", locale);
});
document.documentElement.lang = resolveLocale(i18n.language);
export default i18n;
