import { t, type LangKey } from "../i18n";

/** 93000 → "1:33" ; 3723000 → "1:02:03" */
export function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** ISO date → localized short label (today/yesterday/date) */
export function formatDate(iso: string, lang: LangKey): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round(
    (startOfDay(now) - startOfDay(d)) / (24 * 3600 * 1000)
  );
  const time = d.toLocaleTimeString(langTag(lang), {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (diffDays === 0) return `${t("today", lang)} ${time}`;
  if (diffDays === 1) return `${t("yesterday", lang)} ${time}`;
  return d.toLocaleDateString(langTag(lang), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function langTag(lang: LangKey): string {
  switch (lang) {
    case "ar":
      return "ar-MA";
    case "fr":
      return "fr-FR";
    default:
      return "en-US";
  }
}
