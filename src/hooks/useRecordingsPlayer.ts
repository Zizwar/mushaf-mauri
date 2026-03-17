import { useCallback, useRef, useState } from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from "expo-audio";
import { FlatList } from "react-native";
import { getAudioKsuUri } from "../utils/api";
import type { RecordingItem, PlayMode } from "../screens/recordings/types";

export function useRecordingsPlayer(compareReciterId: string) {
  const playerRef = useRef<AudioPlayer | null>(null);
  const isUnmountedRef = useRef(false);
  const isSequentialRef = useRef(false);
  const sequentialIndexRef = useRef(0);
  const sortedRecsRef = useRef<RecordingItem[]>([]);
  const flatListRefCapture = useRef<FlatList | null>(null);
  const playIdRef = useRef(0);

  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState<PlayMode>("user");
  const [isSequentialPlaying, setIsSequentialPlaying] = useState(false);

  const stopPlayback = useCallback(() => {
    playIdRef.current++;
    isSequentialRef.current = false;
    setIsSequentialPlaying(false);
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch {
        // ignore
      }
      playerRef.current.remove();
      playerRef.current = null;
    }
    if (!isUnmountedRef.current) {
      setPlayingKey(null);
    }
  }, []);

  const playSound = useCallback(
    (uri: string, key: string, mode: PlayMode) => {
      // Stop any existing playback first
      if (playerRef.current) {
        try {
          playerRef.current.pause();
        } catch {
          // ignore
        }
        playerRef.current.remove();
        playerRef.current = null;
      }

      playIdRef.current++;
      const localId = playIdRef.current;

      if (localId !== playIdRef.current) return;

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
          if (isUnmountedRef.current) return;
          if (localId !== playIdRef.current) return;

          if (s.didJustFinish) {
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

            // Side-by-side: after user's recording, auto-play reciter's version
            if (mode === "side_by_side") {
              const match = key.match(/^s(\d+)a(\d+)$/);
              if (match) {
                const sura = parseInt(match[1], 10);
                const aya = parseInt(match[2], 10);
                const reciterUri = getAudioKsuUri(compareReciterId, sura, aya);
                playSound(reciterUri, key, "compare");
              }
              return;
            }

            // Sequential advance
            if (isSequentialRef.current) {
              sequentialIndexRef.current++;
              const recs = sortedRecsRef.current;
              if (sequentialIndexRef.current < recs.length) {
                const next = recs[sequentialIndexRef.current];
                playSound(next.uri, next.key, "user");
                flatListRefCapture.current?.scrollToIndex({
                  index: sequentialIndexRef.current,
                  animated: true,
                  viewPosition: 0.3,
                });
              } else {
                isSequentialRef.current = false;
                setIsSequentialPlaying(false);
              }
            }
          }
        });
      } catch {
        if (!isUnmountedRef.current) {
          setPlayingKey(null);
        }
      }
    },
    [compareReciterId]
  );

  const handlePlayRecording = useCallback(
    (item: RecordingItem) => {
      if (playingKey === item.key && playMode === "user") {
        stopPlayback();
      } else {
        playSound(item.uri, item.key, "user");
      }
    },
    [playingKey, playMode, playSound, stopPlayback]
  );

  const handlePlayComparison = useCallback(
    (item: RecordingItem) => {
      if (playingKey === item.key && playMode === "compare") {
        stopPlayback();
      } else {
        const uri = getAudioKsuUri(compareReciterId, item.sura, item.aya);
        playSound(uri, item.key, "compare");
      }
    },
    [playingKey, playMode, compareReciterId, playSound, stopPlayback]
  );

  const handleSideBySide = useCallback(
    (item: RecordingItem) => {
      if (playingKey === item.key && playMode === "side_by_side") {
        stopPlayback();
      } else {
        playSound(item.uri, item.key, "side_by_side");
      }
    },
    [playingKey, playMode, playSound, stopPlayback]
  );

  const handlePlayAll = useCallback(
    (recordings: RecordingItem[], flatListRef: React.RefObject<FlatList | null>) => {
      flatListRefCapture.current = flatListRef.current;
      if (isSequentialPlaying) {
        stopPlayback();
        return;
      }
      if (recordings.length === 0) return;
      sortedRecsRef.current = recordings;
      isSequentialRef.current = true;
      setIsSequentialPlaying(true);
      sequentialIndexRef.current = 0;
      playSound(recordings[0].uri, recordings[0].key, "user");
    },
    [isSequentialPlaying, playSound, stopPlayback]
  );

  /** Call from parent's useEffect cleanup */
  const cleanup = useCallback(() => {
    isUnmountedRef.current = true;
    isSequentialRef.current = false;
    playIdRef.current++;
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

  /** Call on mount */
  const init = useCallback(() => {
    isUnmountedRef.current = false;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      allowsRecording: true,
      interruptionMode: "doNotMix",
    }).catch(() => {});
  }, []);

  /** Keep sortedRecs in sync for sequential */
  const setSortedRecs = useCallback((recs: RecordingItem[]) => {
    sortedRecsRef.current = recs;
  }, []);

  return {
    playingKey,
    playMode,
    isSequentialPlaying,
    stopPlayback,
    playSound,
    handlePlayRecording,
    handlePlayComparison,
    handleSideBySide,
    handlePlayAll,
    cleanup,
    init,
    setSortedRecs,
  };
}
