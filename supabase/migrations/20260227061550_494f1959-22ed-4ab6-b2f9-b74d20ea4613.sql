
-- Create memories table
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  audio_url TEXT,
  transcript TEXT,
  scenes JSONB DEFAULT '[]'::jsonb,
  sketches JSONB DEFAULT '[]'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'recorded' CHECK (processing_status IN ('recorded', 'transcribing', 'extracting', 'sketching', 'composing', 'complete', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.is_own_memory(memory_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memories WHERE id = memory_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS policies
CREATE POLICY "Users can view own memories" ON public.memories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own memories" ON public.memories FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own memories" ON public.memories FOR UPDATE USING (is_own_memory(id));
CREATE POLICY "Users can delete own memories" ON public.memories FOR DELETE USING (is_own_memory(id));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('memory-audio', 'memory-audio', false);

-- Storage policies
CREATE POLICY "Users can upload own audio" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'memory-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own audio" ON storage.objects FOR SELECT
  USING (bucket_id = 'memory-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own audio" ON storage.objects FOR DELETE
  USING (bucket_id = 'memory-audio' AND auth.uid()::text = (storage.foldername(name))[1]);
