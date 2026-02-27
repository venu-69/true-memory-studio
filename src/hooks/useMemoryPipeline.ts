import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Scene {
  sentence: string;
  description: string;
  mood?: string;
}

interface Sketch {
  imageUrl: string | null;
  caption: string;
  sceneIndex: number;
}

export const useMemoryPipeline = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memoryId, setMemoryId] = useState<string | null>(null);

  const handleRecordingComplete = useCallback(async (blob: Blob, _url: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to continue");

      // Create memory record
      const { data: memory, error: insertError } = await supabase
        .from("memories")
        .insert({ user_id: user.id, processing_status: "recorded" })
        .select()
        .single();

      if (insertError || !memory) throw new Error("Failed to create memory record");
      setMemoryId(memory.id);

      // Upload audio to storage
      const filePath = `${user.id}/${memory.id}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("memory-audio")
        .upload(filePath, blob, { contentType: "audio/webm" });

      if (uploadError) throw new Error("Failed to upload audio");

      // Update memory with audio URL
      await supabase.from("memories").update({ audio_url: filePath }).eq("id", memory.id);

      // Step 1: Transcribe + Extract scenes
      setCurrentStep(1);
      toast.info("Transcribing your memory...");

      const { data: processData, error: processError } = await supabase.functions.invoke("process-memory", {
        body: { memoryId: memory.id },
      });

      if (processError) throw new Error(processError.message || "Processing failed");
      if (processData?.error) throw new Error(processData.error);

      setTranscript(processData.transcript);
      setScenes(processData.scenes || []);
      setCurrentStep(3);
      toast.success("Scenes extracted! Generating sketches...");

      // Step 2: Generate sketches
      const { data: sketchData, error: sketchError } = await supabase.functions.invoke("generate-sketches", {
        body: { memoryId: memory.id },
      });

      if (sketchError) throw new Error(sketchError.message || "Sketch generation failed");
      if (sketchData?.error) throw new Error(sketchData.error);

      setSketches(sketchData.sketches || []);
      setCurrentStep(5);
      setIsProcessing(false);
      toast.success("Your memory has been preserved as sketches!");

    } catch (err: any) {
      console.error("Pipeline error:", err);
      setError(err.message || "An unexpected error occurred");
      setIsProcessing(false);
      toast.error(err.message || "Something went wrong");
    }
  }, []);

  const resetPipeline = useCallback(() => {
    setCurrentStep(0);
    setTranscript(null);
    setScenes([]);
    setSketches([]);
    setIsProcessing(false);
    setError(null);
    setMemoryId(null);
  }, []);

  return {
    currentStep,
    transcript,
    scenes,
    sketches,
    isProcessing,
    error,
    memoryId,
    handleRecordingComplete,
    resetPipeline,
  };
};
