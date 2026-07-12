import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio";
import { getReciterAyahUri } from "../utils/api";

export type PlayMode = "user" | "compare" | "side_by_side";

export interface PlayableItem {
  key: string;
  uri: string;
  sura?: number;
  aya?: number;
}

/**
 * Single shared audio player with a monotonic play-id guard (stale async
 * callbacks are ignored), sequential play-all, reciter comparison and
 * side-by-side (user take then reciter) modes.
 * Adapted from mushaf-mauri's useRecordingsPlayer.
 */
export function usePlayer(compareReciterId: string) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const isUnmountedRef = useRef(false);
  const isSequentialRef = useRef(false);
  const sequentialIndexRef = useRef(0);
  const sequentialItemsRef = useRef<PlayableItem[]>([]);
  const playIdRef = useRef(0);

  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState<PlayMode>("user");
  const [isSequentialPlaying, setIsSequentialPlaying] = useState(false);
  const [sequentialIndex, setSequentialIndex] = useState(0);

  const disposePlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {
        // ignore
      }
      playerRef.current.remove();
      playerRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    playIdRef.current++;
    isSequentialRef.current = false;
    setIsSequentialPlaying(false);
    disposePlayer();
    if (!isUnmountedRef.current) setPlayingKey(null);
  }, [disposePlayer]);

  const playUri = useCallback(
    (uri: string, key: string, mode: PlayMode) => {
      disposePlayer();
      playIdRef.current++;
      const localId = playIdRef.current;

      try {
        const p = createAudioPlayer({ uri });
        if (isUnmountedRef.current || localId !== playIdRef.current) {
          p.remove();
          return;
        }
        playerRef.current = p;
        setPlayingKey(key);
        setPlayMode(mode);
        p.play();

        p.addListener("playbackStatusUpdate", (s: AudioStatus) => {
          if (isUnmountedRef.current || localId !== playIdRef.current) return;
          if (!s.didJustFinish) return;

          setPlayingKey(null);
          if (playerRef.current === p) {
            try {
              p.pause();
            } catch {
              // ignore
            }
            p.remove();
            playerRef.current = null;
          }

          // side-by-side: after the user's take, play the reciter's version
          if (mode === "side_by_side") {
            const item = sequentialItemsRef.current.find((i) => i.key === key);
            const sura = item?.sura;
            const aya = item?.aya;
            if (sura && aya) {
              playUri(
                getReciterAyahUri(compareReciterId, sura, aya),
                key,
                "compare"
              );
            }
            return;
          }

          // sequential advance
          if (isSequentialRef.current) {
            sequentialIndexRef.current++;
            const items = sequentialItemsRef.current;
            if (sequentialIndexRef.current < items.length) {
              const next = items[sequentialIndexRef.current];
              setSequentialIndex(sequentialIndexRef.current);
              playUri(next.uri, next.key, "user");
            } else {
              isSequentialRef.current = false;
              setIsSequentialPlaying(false);
            }
          }
        });
      } catch {
        if (!isUnmountedRef.current) setPlayingKey(null);
      }
    },
    [compareReciterId, disposePlayer]
  );

  const togglePlay = useCallback(
    (item: PlayableItem) => {
      if (playingKey === item.key && playMode === "user") {
        stopPlayback();
      } else {
        isSequentialRef.current = false;
        setIsSequentialPlaying(false);
        // keep item registered so side-by-side can find sura/aya
        if (!sequentialItemsRef.current.some((i) => i.key === item.key)) {
          sequentialItemsRef.current = [...sequentialItemsRef.current, item];
        }
        playUri(item.uri, item.key, "user");
      }
    },
    [playingKey, playMode, playUri, stopPlayback]
  );

  const playComparison = useCallback(
    (item: PlayableItem) => {
      if (!item.sura || !item.aya) return;
      if (playingKey === item.key && playMode === "compare") {
        stopPlayback();
      } else {
        playUri(
          getReciterAyahUri(compareReciterId, item.sura, item.aya),
          item.key,
          "compare"
        );
      }
    },
    [playingKey, playMode, compareReciterId, playUri, stopPlayback]
  );

  const playSideBySide = useCallback(
    (item: PlayableItem) => {
      if (playingKey === item.key && playMode === "side_by_side") {
        stopPlayback();
      } else {
        if (!sequentialItemsRef.current.some((i) => i.key === item.key)) {
          sequentialItemsRef.current = [...sequentialItemsRef.current, item];
        }
        playUri(item.uri, item.key, "side_by_side");
      }
    },
    [playingKey, playMode, playUri, stopPlayback]
  );

  const playAll = useCallback(
    (items: PlayableItem[], onAdvance?: (index: number) => void) => {
      if (isSequentialPlaying) {
        stopPlayback();
        return;
      }
      if (items.length === 0) return;
      sequentialItemsRef.current = items;
      isSequentialRef.current = true;
      setIsSequentialPlaying(true);
      sequentialIndexRef.current = 0;
      setSequentialIndex(0);
      onAdvance?.(0);
      playUri(items[0].uri, items[0].key, "user");
    },
    [isSequentialPlaying, playUri, stopPlayback]
  );

  /** Seek within the currently playing item (seconds). */
  const seekTo = useCallback((seconds: number) => {
    playerRef.current?.seekTo(seconds);
  }, []);

  useEffect(() => {
    isUnmountedRef.current = false;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      allowsRecording: true,
      interruptionMode: "doNotMix",
    }).catch(() => {});
    return () => {
      isUnmountedRef.current = true;
      isSequentialRef.current = false;
      playIdRef.current++;
      disposePlayer();
    };
  }, [disposePlayer]);

  return {
    playingKey,
    playMode,
    isSequentialPlaying,
    sequentialIndex,
    stopPlayback,
    playUri,
    togglePlay,
    playComparison,
    playSideBySide,
    playAll,
    seekTo,
  };
}
