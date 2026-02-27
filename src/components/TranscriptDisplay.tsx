import { motion } from "framer-motion";

interface TranscriptDisplayProps {
  transcript: string;
  scenes: { sentence: string; description: string }[];
}

const TranscriptDisplay = ({ transcript, scenes }: TranscriptDisplayProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-2xl space-y-6"
    >
      {/* Transcript */}
      <div className="bg-paper-aged rounded-xl p-6 shadow-warm border border-border">
        <h3 className="font-serif text-lg font-semibold mb-3 text-foreground">
          Your Memory — Transcript
        </h3>
        <p className="text-sm leading-relaxed text-foreground/80 italic font-serif">
          "{transcript}"
        </p>
      </div>

      {/* Scene mapping */}
      {scenes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Extracted Scenes
          </h3>
          {scenes.map((scene, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-card rounded-lg p-4 border border-border flex gap-4"
            >
              <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                {i + 1}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground italic">"{scene.sentence}"</p>
                <p className="text-sm font-medium text-foreground">→ {scene.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TranscriptDisplay;
