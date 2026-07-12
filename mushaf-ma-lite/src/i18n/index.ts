import ar from "./locales/ar";
import en from "./locales/en";
import fr from "./locales/fr";

export type LangKey = "ar" | "en" | "fr";

const locales: Record<LangKey, Record<string, string>> = { ar, en, fr };

export function t(key: string, lang: LangKey = "ar"): string {
  return locales[lang]?.[key] ?? locales.ar[key] ?? key;
}

/** t() with {placeholder} substitution, e.g. tf("ayah_of", lang, {n: 3, total: 7}) */
export function tf(
  key: string,
  lang: LangKey,
  params: Record<string, string | number>
): string {
  let s = t(key, lang);
  for (const [k, v] of Object.entries(params)) {
    s = s.replace(`{${k}}`, String(v));
  }
  return s;
}

export { locales, ar, en, fr };
