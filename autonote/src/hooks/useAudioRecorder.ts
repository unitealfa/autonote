import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { RecordingResult, startRecording, stopRecording } from '@/audio/AudioRecorder';

export const useAudioRecorder = () => {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const begin = useCallback(async () => {
    setError(null);
    try {
      recordingRef.current = await startRecording();
      setIsRecording(true);
    } catch (err) {
      console.warn(err);
      setError((err as Error).message);
      setIsRecording(false);
    }
  }, []);

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    if (!recordingRef.current) return null;
    try {
      const result = await stopRecording(recordingRef.current);
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsRecording(false);
      recordingRef.current = null;
    }
  }, []);

  return {
    isRecording,
    error,
    start: begin,
    stop,
  };
};
