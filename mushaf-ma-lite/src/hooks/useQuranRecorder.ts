import { useRef, useState } from "react";
import { File } from "expo-file-system";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import type { SessionMarker } from "../utils/recitationsStore";

export type SessionState = "idle" | "recording" | "paused";

export interface TakeResult {
  uri: string;
  durationMs: number;
}

export interface SessionResult extends TakeResult {
  markers: SessionMarker[];
}

/**
 * One recorder, two workflows:
 *  - single takes (ayah-by-ayah mode, voice notes): startTake / stopTake
 *  - continuous sessions with pause/resume and ayah markers:
 *    startSession / pauseSession / resumeSession / markAyah / stopSession
 */
export function useQuranRecorder() {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, 250);

  const [isTaking, setIsTaking] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const markersRef = useRef<SessionMarker[]>([]);

  async function ensureReady(): Promise<boolean> {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return false;
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      allowsRecording: true,
      interruptionMode: "doNotMix",
    });
    return true;
  }

  // ---- single take -------------------------------------------------------

  async function startTake(): Promise<boolean> {
    if (!(await ensureReady())) return false;
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsTaking(true);
    return true;
  }

  async function stopTake(): Promise<TakeResult | null> {
    const durationMs = Math.round(recorder.currentTime * 1000);
    try {
      await recorder.stop();
    } catch {
      setIsTaking(false);
      return null;
    }
    setIsTaking(false);
    const uri = recorder.uri;
    if (!uri) return null;
    return { uri, durationMs };
  }

  async function discardTake(): Promise<void> {
    try {
      await recorder.stop();
    } catch {
      // ignore
    }
    setIsTaking(false);
    deleteTempFile(recorder.uri);
  }

  // ---- continuous session ------------------------------------------------

  async function startSession(firstAya: number): Promise<boolean> {
    if (!(await ensureReady())) return false;
    markersRef.current = [{ aya: firstAya, tMs: 0 }];
    await recorder.prepareToRecordAsync();
    recorder.record();
    setSessionState("recording");
    return true;
  }

  function pauseSession(): void {
    try {
      recorder.pause();
      setSessionState("paused");
    } catch {
      // ignore
    }
  }

  function resumeSession(): void {
    try {
      recorder.record();
      setSessionState("recording");
    } catch {
      // ignore
    }
  }

  /** Log that the reciter moved to the given ayah at the current position. */
  function markAyah(aya: number): void {
    markersRef.current.push({
      aya,
      tMs: Math.round(recorder.currentTime * 1000),
    });
  }

  async function stopSession(): Promise<SessionResult | null> {
    const durationMs = Math.round(recorder.currentTime * 1000);
    try {
      await recorder.stop();
    } catch {
      setSessionState("idle");
      return null;
    }
    setSessionState("idle");
    const uri = recorder.uri;
    if (!uri) return null;
    return { uri, durationMs, markers: [...markersRef.current] };
  }

  async function discardSession(): Promise<void> {
    try {
      await recorder.stop();
    } catch {
      // ignore
    }
    setSessionState("idle");
    deleteTempFile(recorder.uri);
  }

  return {
    recorder,
    recorderState,
    isTaking,
    sessionState,
    startTake,
    stopTake,
    discardTake,
    startSession,
    pauseSession,
    resumeSession,
    markAyah,
    stopSession,
    discardSession,
  };
}

function deleteTempFile(uri: string | null): void {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // ignore
  }
}
