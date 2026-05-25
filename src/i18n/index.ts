import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import svCommon from "./locales/sv/common.json";
import svAuth from "./locales/sv/auth.json";
import svProfile from "./locales/sv/profile.json";

import enCommon from "./locales/en/common.json";
import enAuth from "./locales/en/auth.json";
import enProfile from "./locales/en/profile.json";

export const SUPPORTED_LANGS = ["sv", "en"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const resources = {
  sv: {
    common: svCommon,
    auth: svAuth,
    profile: svProfile,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    profile: enProfile,
  },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    ns: ["common", "auth", "profile"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
    },
    returnNull: false,
  });

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language?.split("-")[0] ?? "en";
  i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng.split("-")[0];
  });
}

export default i18n;
