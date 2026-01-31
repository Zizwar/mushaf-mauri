import ar from "./locales/ar";
import en from "./locales/en";
import fr from "./locales/fr";
import amz from "./locales/amz";

export type LangKey = "ar" | "en" | "fr" | "amz";

const locales: Record<LangKey, Record<string, string>> = { ar, en, fr, amz };

export function t(key: string, lang: LangKey = "ar"): string {
  return locales[lang]?.[key] ?? locales.ar[key] ?? key;
}

export { locales, ar, en, fr, amz };
