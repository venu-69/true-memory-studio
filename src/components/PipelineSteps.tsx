import { motion } from "framer-motion";
import { Mic, FileText, Layers, Paintbrush, Film, Check } from "lucide-react";

const steps = [
  { icon: Mic, label: "Record", desc: "Voice your memory" },
  { icon: FileText, label: "Transcribe", desc: "Audio to text" },
  { icon: Layers, label: "Extract", desc: "Identify scenes" },
  { icon: Paintbrush, label: "Sketch", desc: "Generate art" },
  { icon: Film, label: "Compose", desc: "Build video" },
];

interface PipelineStepsProps {
  currentStep: number;
}

const PipelineSteps = ({ currentStep }: PipelineStepsProps) => {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === currentStep;
        const isDone = i < currentStep;

        return (
          <div key={step.label} className="flex items-center gap-2 sm:gap-4">
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div
                className={`
                  relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all duration-300
                  ${isDone ? "bg-primary text-primary-foreground shadow-warm" : ""}
                  ${isActive ? "bg-primary text-primary-foreground shadow-warm-lg ring-4 ring-primary/20 animate-pulse-warm" : ""}
                  ${!isDone && !isActive ? "bg-secondary text-muted-foreground" : ""}
                `}
              >
                {isDone ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <div className="text-center">
                <p className={`text-xs sm:text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{step.desc}</p>
              </div>
            </motion.div>

            {i < steps.length - 1 && (
              <div className={`h-[2px] w-6 sm:w-10 rounded-full transition-colors duration-300 mb-8 sm:mb-10 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PipelineSteps;
