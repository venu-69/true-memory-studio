import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const SketchGallery = ({ sketches }: { sketches: { imageUrl: string; caption: string; sceneIndex: number }[] }) => {
  if (sketches.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-3xl space-y-4"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-lg font-semibold text-foreground">Generated Sketches</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sketches.map((sketch, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2 }}
            className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-warm"
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={sketch.imageUrl}
                alt={sketch.caption}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-3 space-y-1">
              <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
                Scene {sketch.sceneIndex + 1}
              </span>
              <p className="text-sm text-muted-foreground">{sketch.caption}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SketchGallery;
