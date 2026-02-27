import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Play, Trash2, Clock, FileText, Layers } from "lucide-react";
import { toast } from "sonner";

interface Memory {
  id: string;
  title: string | null;
  transcript: string | null;
  scenes: any;
  sketches: any;
  processing_status: string;
  created_at: string;
  audio_url: string | null;
}

const statusLabels: Record<string, string> = {
  recorded: "Recorded",
  transcribing: "Transcribing...",
  extracting: "Extracting scenes...",
  sketching: "Generating art...",
  composing: "Composing...",
  complete: "Complete",
  error: "Error",
};

const Gallery = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchMemories();
  }, [user]);

  const fetchMemories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load memories");
    } else {
      setMemories(data || []);
      // Get signed URLs for audio files
      const urls: Record<string, string> = {};
      for (const m of data || []) {
        if (m.audio_url) {
          const { data: signedData } = await supabase.storage
            .from("memory-audio")
            .createSignedUrl(m.audio_url, 3600);
          if (signedData?.signedUrl) urls[m.id] = signedData.signedUrl;
        }
      }
      setAudioUrls(urls);
    }
    setLoading(false);
  };

  const deleteMemory = async (id: string) => {
    const memory = memories.find((m) => m.id === id);
    if (memory?.audio_url) {
      await supabase.storage.from("memory-audio").remove([memory.audio_url]);
    }
    const { error } = await supabase.from("memories").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      setMemories((prev) => prev.filter((m) => m.id !== id));
      if (selectedMemory?.id === id) setSelectedMemory(null);
      toast.success("Memory deleted");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const parseScenes = (scenes: any) => {
    if (!scenes) return [];
    if (typeof scenes === "string") return JSON.parse(scenes);
    return scenes;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Home
          </Button>
          <h1 className="font-serif text-xl font-bold text-foreground">My Memories</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {memories.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 space-y-4">
            <p className="text-muted-foreground text-lg">No memories yet.</p>
            <Button onClick={() => navigate("/")} className="rounded-full shadow-warm">Record Your First Memory</Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Memory list */}
            <div className="lg:col-span-1 space-y-3">
              <AnimatePresence>
                {memories.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedMemory(m)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:shadow-warm ${
                      selectedMemory?.id === m.id
                        ? "border-primary bg-primary/5 shadow-warm"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-serif font-medium text-foreground text-sm truncate">
                          {m.transcript ? m.transcript.slice(0, 60) + (m.transcript.length > 60 ? "..." : "") : "Untitled memory"}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(m.created_at)}</span>
                        </div>
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          m.processing_status === "complete"
                            ? "bg-primary/10 text-primary"
                            : m.processing_status === "error"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-secondary text-muted-foreground"
                        }`}>
                          {statusLabels[m.processing_status] || m.processing_status}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteMemory(m.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {selectedMemory ? (
                  <motion.div
                    key={selectedMemory.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {/* Audio player */}
                    {audioUrls[selectedMemory.id] && (
                      <div className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Play className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Recording</span>
                        </div>
                        <audio controls src={audioUrls[selectedMemory.id]} className="w-full rounded-lg" />
                      </div>
                    )}

                    {/* Transcript */}
                    {selectedMemory.transcript && (
                      <div className="bg-paper-aged rounded-xl p-6 shadow-warm border border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Transcript</span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/80 italic font-serif">
                          "{selectedMemory.transcript}"
                        </p>
                      </div>
                    )}

                    {/* Scenes */}
                    {selectedMemory.scenes && parseScenes(selectedMemory.scenes).length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Extracted Scenes</span>
                        </div>
                        {parseScenes(selectedMemory.scenes).map((scene: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-card rounded-lg p-4 border border-border flex gap-4"
                          >
                            <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                              {i + 1}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground italic">"{scene.sentence}"</p>
                              <p className="text-sm font-medium text-foreground">→ {scene.description}</p>
                              {scene.mood && (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                                  {scene.mood}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                    Select a memory to view details
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
