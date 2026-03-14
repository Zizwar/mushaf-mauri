import ar from "./locales/ar";
import en from "./locales/en";
import fr from "./locales/fr";
import amz from "./locales/amz";
import he from "./locales/he";
import es from "./locales/es";
import nl from "./locales/nl";
import de from "./locales/de";
import it from "./locales/it";

export type LangKey = "ar" | "en" | "fr" | "amz" | "he" | "es" | "nl" | "de" | "it";

const locales: Record<LangKey, Record<string, string>> = { ar, en, fr, amz, he, es, nl, de, it };

export function t(key: string, lang: LangKey = "ar"): string {
  return locales[lang]?.[key] ?? locales.ar[key] ?? key;
}

export { locales, ar, en, fr, amz, he, es, nl, de, it };
