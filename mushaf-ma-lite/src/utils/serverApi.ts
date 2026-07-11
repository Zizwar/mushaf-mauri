import type { Riwaya } from "../store/useAppStore";
import type { RecitationMeta, UploadInfo } from "./recitationsStore";

export interface GalleryItem {
  id: string;
  title: string;
  reciterName: string;
  sura: number;
  ayaFrom: number;
  ayaTo: number;
  riwaya: Riwaya;
  duration: number; // seconds
  createdAt: string;
  shareUrl: string;
  audioUrl: string;
}

export function normalizeServerUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export async function checkServer(serverUrl: string): Promise<boolean> {
  try {
    const base = normalizeServerUrl(serverUrl);
    if (!base) return false;
    const res = await fetch(`${base}/api/health`);
    if (!res.ok) return false;
    const json = await res.json();
    return json?.ok === true;
  } catch {
    return false;
  }
}

export async function fetchGallery(
  serverUrl: string,
  opts: { sura?: number; riwaya?: Riwaya; q?: string; offset?: number; limit?: number } = {}
): Promise<{ total: number; items: GalleryItem[] }> {
  const base = normalizeServerUrl(serverUrl);
  const params = new URLSearchParams();
  if (opts.sura) params.set("sura", String(opts.sura));
  if (opts.riwaya) params.set("riwaya", opts.riwaya);
  if (opts.q) params.set("q", opts.q);
  if (opts.offset) params.set("offset", String(opts.offset));
  params.set("limit", String(opts.limit ?? 50));
  const res = await fetch(`${base}/api/recitations?${params.toString()}`);
  if (!res.ok) throw new Error(`server ${res.status}`);
  const json = await res.json();
  return { total: json.total ?? 0, items: json.items ?? [] };
}

export interface UploadParams {
  meta: RecitationMeta;
  fileUri: string;
  title: string;
  reciterName: string;
  isPublic: boolean;
  onProgress?: (fraction: number) => void;
}

/**
 * Upload a recitation. Uses XMLHttpRequest because RN's fetch has no upload
 * progress events.
 */
export function uploadRecitation(
  serverUrl: string,
  params: UploadParams
): Promise<UploadInfo> {
  const base = normalizeServerUrl(serverUrl);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/api/recitations`);
    xhr.timeout = 120000;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && params.onProgress) {
        params.onProgress(e.loaded / e.total);
      }
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve({
            id: json.id,
            url: json.shareUrl,
            audioUrl: json.audioUrl,
            ownerToken: json.ownerToken,
            isPublic: !!json.isPublic,
            uploadedAt: new Date().toISOString(),
            serverUrl: base,
          });
        } catch {
          reject(new Error("bad response"));
        }
      } else {
        reject(new Error(`server ${xhr.status}`));
      }
    };

    const fd = new FormData();
    fd.append("audio", {
      uri: params.fileUri,
      name: `${params.meta.id}.m4a`,
      type: "audio/mp4",
    } as unknown as Blob);
    fd.append("title", params.title);
    fd.append("reciterName", params.reciterName);
    fd.append("sura", String(params.meta.sura));
    fd.append("ayaFrom", String(params.meta.ayaFrom));
    fd.append("ayaTo", String(params.meta.ayaTo));
    fd.append("riwaya", params.meta.riwaya);
    fd.append("duration", String(params.meta.durationMs / 1000));
    fd.append("isPublic", params.isPublic ? "1" : "0");
    if (params.meta.noteText) fd.append("note", params.meta.noteText);

    xhr.send(fd);
  });
}

export async function deleteUpload(upload: UploadInfo): Promise<boolean> {
  try {
    const res = await fetch(
      `${upload.serverUrl}/api/recitations/${upload.id}`,
      {
        method: "DELETE",
        headers: { "x-owner-token": upload.ownerToken },
      }
    );
    return res.status === 204 || res.status === 404;
  } catch {
    return false;
  }
}
