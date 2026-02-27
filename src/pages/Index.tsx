import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowDown, Shield, Fingerprint, Heart, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-memory.jpg";
import AudioRecorder from "@/components/AudioRecorder";
import PipelineSteps from "@/components/PipelineSteps";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import SketchGallery from "@/components/SketchGallery";
import { useAuth } from "@/hooks/useAuth";
import { useMemoryPipeline } from "@/hooks/useMemoryPipeline";

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const Index = () => {
  const [started, setStarted] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    currentStep,
    transcript,
    scenes,
    sketches,
    isProcessing,
    error,
    handleRecordingComplete,
    resetPipeline,
  } = useMemoryPipeline();

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
      <AnimatePresence mode="wait">
        {!started && (
          <motion.section
            key="hero"
            {...pageTransition}
            exit={{ opacity: 0, y: -40 }}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0">
              <motion.img
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                src={heroImage}
                alt="Watercolor sketch of memories"
                className="h-full w-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
            </div>

            {/* Nav bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-20">
              <h2 className="font-serif text-xl font-semibold text-foreground">Memory to Sketch</h2>
              <div className="flex gap-3">
                {user ? (
                  <Button variant="outline" size="sm" onClick={() => navigate("/gallery")}>
                    My Memories
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                    <LogIn className="h-4 w-4 mr-2" /> Sign In
                  </Button>
                )}
              </div>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-3xl"
            >
              <motion.div variants={pageTransition}>
                <h1 className="text-5xl sm:text-7xl font-serif font-bold leading-tight tracking-tight">
                  <span className="text-gradient-warm">Memory</span>
                  <br />
                  <span className="text-foreground">to Sketch</span>
                </h1>
              </motion.div>

              <motion.p variants={pageTransition} className="text-lg sm:text-xl text-muted-foreground max-w-lg font-light leading-relaxed">
                Speak a memory. We'll transform your voice into a beautiful
                sketch-style animated video — faithful to every word you say.
              </motion.p>

              <motion.div variants={pageTransition}>
                <Button
                  size="lg"
                  onClick={() => {
                    if (!user) {
                      navigate("/auth");
                    } else {
                      setStarted(true);
                    }
                  }}
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
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Principles */}
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
                  className="bg-card rounded-2xl p-6 shadow-warm border border-border text-center space-y-4 hover:shadow-warm-lg transition-shadow duration-300"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
                  >
                    <p.icon className="h-6 w-6 text-primary" />
                  </motion.div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      {!started && (
        <section className="py-16 px-6 bg-paper-aged">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">How It Works</h2>
            <PipelineSteps currentStep={-1} />
          </div>
        </section>
      )}

      {/* Recording Studio */}
      <AnimatePresence mode="wait">
        {started && (
          <motion.section
            key="studio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center py-12 px-6"
          >
            {/* Back / Gallery nav */}
            <div className="w-full max-w-3xl flex items-center justify-between mb-6">
              <Button variant="ghost" size="sm" onClick={() => { setStarted(false); resetPipeline(); }}>
                ← Back
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/gallery")}>
                My Memories
              </Button>
            </div>

            <div className="w-full max-w-3xl mb-12">
              <PipelineSteps currentStep={currentStep} />
            </div>

            <div className="w-full max-w-2xl flex flex-col items-center gap-8">
              {currentStep === 0 && (
                <motion.div {...pageTransition} className="space-y-4 text-center w-full">
                  <h2 className="text-3xl font-serif font-bold text-foreground">Record Your Memory</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Speak naturally about a memory you'd like to preserve as art.
                  </p>
                  <AudioRecorder onRecordingComplete={handleRecordingComplete} />
                </motion.div>
              )}

              {currentStep >= 1 && isProcessing && (
                <motion.div {...pageTransition} className="text-center space-y-6">
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary"
                    />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-foreground">
                    {currentStep === 1 && "Transcribing your memory..."}
                    {currentStep === 2 && "Extracting scenes..."}
                    {currentStep === 3 && "Generating sketches..."}
                    {currentStep === 4 && "Composing video..."}
                  </h2>
                  <p className="text-muted-foreground text-sm">This may take a moment. Every detail stays true to your words.</p>
                </motion.div>
              )}

              {error && (
                <motion.div {...pageTransition} className="text-center space-y-4">
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                  <Button onClick={resetPipeline}>Try Again</Button>
                </motion.div>
              )}

              {transcript && <TranscriptDisplay transcript={transcript} scenes={scenes} />}
              {sketches.length > 0 && <SketchGallery sketches={sketches} />}

              {currentStep === 5 && (
                <motion.div {...pageTransition} className="text-center space-y-4">
                  <h2 className="text-3xl font-serif font-bold text-foreground">Memory Preserved ✨</h2>
                  <p className="text-muted-foreground">Your memory has been transformed into sketches.</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={resetPipeline}>Record Another</Button>
                    <Button onClick={() => navigate("/gallery")}>View Gallery</Button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

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
