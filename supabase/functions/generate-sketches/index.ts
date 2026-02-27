import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { memoryId } = await req.json();
    if (!memoryId) throw new Error("memoryId is required");

    const { data: memory, error: memError } = await supabase
      .from("memories")
      .select("*")
      .eq("id", memoryId)
      .single();

    if (memError || !memory) throw new Error("Memory not found");
    if (!memory.scenes) throw new Error("No scenes found");

    const scenes = typeof memory.scenes === "string" ? JSON.parse(memory.scenes) : memory.scenes;
    if (!Array.isArray(scenes) || scenes.length === 0) throw new Error("No scenes to sketch");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Generate sketch descriptions enhanced for image generation
    const sketchPromises = scenes.map(async (scene: any, index: number) => {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: `Create a warm, nostalgic watercolor and pencil sketch illustration of: ${scene.description}. The mood is ${scene.mood}. Style: hand-drawn pencil sketch with soft watercolor washes in sepia and warm amber tones. The scene should feel like a page from a memory journal.`
            }
          ],
        }),
      });

      if (!response.ok) {
        console.error(`Sketch generation failed for scene ${index}:`, await response.text());
        return { sceneIndex: index, caption: scene.description, imageUrl: null, error: "Generation failed" };
      }

      const data = await response.json();
      // The image model returns base64 image data
      const content = data.choices?.[0]?.message?.content;
      
      // Check if response contains image data
      if (data.choices?.[0]?.message?.content) {
        // For text-based responses from image models, store the description
        return {
          sceneIndex: index,
          caption: scene.description,
          sentence: scene.sentence,
          mood: scene.mood,
          imageUrl: null,
          generatedDescription: typeof content === "string" ? content : scene.description,
        };
      }

      return { sceneIndex: index, caption: scene.description, imageUrl: null };
    });

    const sketches = await Promise.all(sketchPromises);

    // Update memory with sketches
    await supabase.from("memories").update({
      sketches: JSON.stringify(sketches),
      processing_status: "complete",
    }).eq("id", memoryId);

    return new Response(JSON.stringify({ success: true, sketches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Generate sketches error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
