import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Shield, Fingerprint, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-memory.jpg";
import AudioRecorder from "@/components/AudioRecorder";
import PipelineSteps from "@/components/PipelineSteps";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import SketchGallery from "@/components/SketchGallery";

const Index = () => {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [scenes, setScenes] = useState<{ sentence: string; description: string }[]>([]);
  const [sketches, setSketches] = useState<{ imageUrl: string; caption: string; sceneIndex: number }[]>([]);

  const handleRecordingComplete = (blob: Blob, url: string) => {
    setAudioBlob(blob);
    setAudioUrl(url);
    setCurrentStep(1);
    // In production: send to transcription API
    // For now, show a message that backend is needed
  };

  const principles = [
    {
      icon: Shield,
      title: "No Fabrication",
      desc: "Every scene comes directly from your spoken words. Nothing is invented or added.",
    },
    {
      icon: Fingerprint,
      title: "Full Traceability",
      desc: "Each visual maps to a specific sentence from your transcript.",
    },
    {
      icon: Heart,
      title: "Emotional Integrity",
      desc: "The art style adapts to the emotion in your voice, preserving authenticity.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <AnimatePresence>
        {!started && (
          <motion.section
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
          >
            {/* Background image */}
            <div className="absolute inset-0">
              <img
                src={heroImage}
                alt="Watercolor sketch of memories"
                className="h-full w-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-5xl sm:text-7xl font-serif font-bold leading-tight tracking-tight">
                  <span className="text-gradient-warm">Memory</span>
                  <br />
                  <span className="text-foreground">to Sketch</span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-lg sm:text-xl text-muted-foreground max-w-lg font-light leading-relaxed"
              >
                Speak a memory. We'll transform your voice into a beautiful
                sketch-style animated video — faithful to every word you say.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <Button
                  size="lg"
                  onClick={() => setStarted(true)}
                  className="h-14 px-10 text-lg rounded-full shadow-warm-lg font-medium"
                >
                  Begin Recording
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-12"
              >
                <ArrowDown className="h-5 w-5 text-muted-foreground animate-bounce" />
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Principles Section (visible when not started) */}
      {!started && (
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-serif font-bold text-center mb-16 text-foreground"
            >
              Built on Authenticity
            </motion.h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {principles.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-card rounded-2xl p-6 shadow-warm border border-border text-center space-y-4"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <p.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works (visible when not started) */}
      {!started && (
        <section className="py-16 px-6 bg-paper-aged">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">How It Works</h2>
            <PipelineSteps currentStep={-1} />
          </div>
        </section>
      )}

      {/* Recording Studio */}
      {started && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex flex-col items-center py-12 px-6"
        >
          {/* Pipeline at top */}
          <div className="w-full max-w-3xl mb-12">
            <PipelineSteps currentStep={currentStep} />
          </div>

          {/* Step content */}
          <div className="w-full max-w-2xl flex flex-col items-center gap-8">
            {currentStep === 0 && (
              <div className="space-y-4 text-center">
                <h2 className="text-3xl font-serif font-bold text-foreground">
                  Record Your Memory
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Speak naturally about a memory you'd like to preserve as art.
                  Mention the people, places, and moments that matter.
                </p>
                <AudioRecorder onRecordingComplete={handleRecordingComplete} />
              </div>
            )}

            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
              >
                <h2 className="text-3xl font-serif font-bold text-foreground">
                  Audio Captured
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your recording is ready. To continue with transcription, scene extraction,
                  and sketch generation, the backend services need to be connected.
                </p>

                {audioUrl && (
                  <div className="max-w-md mx-auto">
                    <audio controls src={audioUrl} className="w-full rounded-lg" />
                  </div>
                )}

                <div className="bg-card border border-border rounded-2xl p-6 max-w-md mx-auto shadow-warm">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Next steps:</strong> Enable Lovable Cloud to power
                    the AI pipeline — speech-to-text transcription, scene extraction,
                    sketch generation, and video composition.
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentStep(0);
                      setAudioBlob(null);
                      setAudioUrl(null);
                    }}
                  >
                    Re-record
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Transcript display (when available) */}
            {transcript && <TranscriptDisplay transcript={transcript} scenes={scenes} />}

            {/* Sketch gallery (when available) */}
            {sketches.length > 0 && <SketchGallery sketches={sketches} />}
          </div>
        </motion.section>
      )}

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <p className="text-center text-xs text-muted-foreground">
          Memory to Sketch — Your voice, your story, your art. Every scene is faithful to your words.
        </p>
      </footer>
    </div>
  );
};

export default Index;
