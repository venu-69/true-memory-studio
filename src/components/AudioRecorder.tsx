import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, url: string) => void;
}

const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [analyserData, setAnalyserData] = useState<number[]>(new Array(32).fill(4));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const updateWaveform = useCallback(() => {
    if (analyserRef.current) {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      const bars = Array.from({ length: 32 }, (_, i) => {
        const idx = Math.floor((i / 32) * data.length);
        return Math.max(4, (data[idx] / 255) * 48);
      });
      setAnalyserData(bars);
    }
    animationRef.current = requestAnimationFrame(updateWaveform);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        audioContext.close();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      setAudioUrl(null);
      setAudioBlob(null);

      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      animationRef.current = requestAnimationFrame(updateWaveform);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setAnalyserData(new Array(32).fill(4));
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
  };

  const confirmRecording = () => {
    if (audioBlob && audioUrl) {
      onRecordingComplete(audioBlob, audioUrl);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8"
    >
      {/* Waveform visualization */}
      <div className="flex items-center justify-center gap-[3px] h-16 w-full max-w-md">
        {analyserData.map((height, i) => (
          <motion.div
            key={i}
            className="w-[6px] rounded-full bg-primary"
            animate={{ height, opacity: isRecording ? 0.6 + (height / 48) * 0.4 : 0.3 }}
            transition={{ duration: 0.1 }}
            style={{ minHeight: 4 }}
          />
        ))}
      </div>

      {/* Timer */}
      <p className="font-mono text-2xl tracking-widest text-muted-foreground">
        {formatTime(duration)}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <AnimatePresence mode="wait">
          {!isRecording && !audioUrl && (
            <motion.div key="start" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <Button
                onClick={startRecording}
                size="lg"
                className="h-20 w-20 rounded-full shadow-warm-lg"
              >
                <Mic className="h-8 w-8" />
              </Button>
            </motion.div>
          )}

          {isRecording && (
            <motion.div key="stop" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="h-20 w-20 rounded-full"
              >
                <Square className="h-6 w-6" />
              </Button>
            </motion.div>
          )}

          {audioUrl && (
            <motion.div key="done" className="flex items-center gap-4" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <Button onClick={resetRecording} variant="outline" size="lg" className="h-14 w-14 rounded-full">
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button onClick={confirmRecording} size="lg" className="h-20 w-20 rounded-full shadow-warm-lg">
                <Check className="h-8 w-8" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Audio preview */}
      {audioUrl && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
          <audio controls src={audioUrl} className="w-full rounded-lg" />
        </motion.div>
      )}

      {/* Helper text */}
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {isRecording
          ? "Share your memory... speak naturally about the people, places, and moments you remember."
          : audioUrl
          ? "Listen to your recording, then confirm or re-record."
          : "Tap the microphone to begin recording your memory."}
      </p>
    </motion.div>
  );
};

export default AudioRecorder;
