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

    // Get the memory record
    const { data: memory, error: memError } = await supabase
      .from("memories")
      .select("*")
      .eq("id", memoryId)
      .single();

    if (memError || !memory) throw new Error("Memory not found");
    if (!memory.audio_url) throw new Error("No audio file found for this memory");

    // Update status to transcribing
    await supabase.from("memories").update({ processing_status: "transcribing" }).eq("id", memoryId);

    // Download audio from storage
    const audioPath = memory.audio_url;
    const { data: audioData, error: dlError } = await supabase.storage
      .from("memory-audio")
      .download(audioPath);

    if (dlError || !audioData) throw new Error("Failed to download audio file");

    // Use Lovable AI to transcribe by describing the audio
    // Since we can't directly transcribe with the AI gateway, we'll use a workaround:
    // Convert audio to base64 and send to a multimodal model
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const arrayBuffer = await audioData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64Audio = btoa(binary);

    // Use Gemini for audio transcription (multimodal)
    const transcribeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a transcription assistant. Your ONLY job is to transcribe the audio exactly as spoken. Output ONLY the transcription text, nothing else. No commentary, no formatting, no timestamps. Just the exact words spoken."
          },
          {
            role: "user",
            content: [
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format: "webm"
                }
              },
              {
                type: "text",
                text: "Transcribe this audio recording exactly as spoken. Output only the transcription."
              }
            ]
          }
        ],
      }),
    });

    if (!transcribeResponse.ok) {
      const errText = await transcribeResponse.text();
      console.error("Transcription error:", transcribeResponse.status, errText);

      if (transcribeResponse.status === 429) {
        await supabase.from("memories").update({ processing_status: "error", error_message: "Rate limit exceeded. Please try again later." }).eq("id", memoryId);
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (transcribeResponse.status === 402) {
        await supabase.from("memories").update({ processing_status: "error", error_message: "AI credits exhausted." }).eq("id", memoryId);
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      throw new Error(`Transcription failed: ${errText}`);
    }

    const transcribeData = await transcribeResponse.json();
    const transcript = transcribeData.choices?.[0]?.message?.content?.trim();

    if (!transcript || transcript.length === 0) {
      await supabase.from("memories").update({ processing_status: "error", error_message: "No speech detected in the recording." }).eq("id", memoryId);
      return new Response(JSON.stringify({ error: "No transcript produced" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update memory with transcript
    await supabase.from("memories").update({
      transcript,
      processing_status: "extracting",
    }).eq("id", memoryId);

    // Step 2: Extract scenes using AI with tool calling
    const extractResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You extract visual scenes from a spoken memory transcript. Rules:
1. ONLY extract scenes from what is explicitly mentioned in the transcript
2. Do NOT add characters, places, events, or details not spoken
3. Each scene maps to a specific sentence or phrase from the transcript
4. Describe each scene as a sketch prompt: what to draw, the mood, the setting
5. Keep descriptions faithful to the original words`
          },
          {
            role: "user",
            content: `Extract visual scenes from this memory transcript. Each scene must map to a specific sentence:\n\n"${transcript}"`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_scenes",
              description: "Extract visual scenes from the transcript",
              parameters: {
                type: "object",
                properties: {
                  scenes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sentence: { type: "string", description: "The exact sentence or phrase from the transcript this scene is derived from" },
                        description: { type: "string", description: "A sketch prompt describing what to draw for this scene" },
                        mood: { type: "string", description: "The emotional tone: nostalgic, happy, sad, peaceful, exciting, etc." }
                      },
                      required: ["sentence", "description", "mood"],
                      additionalProperties: false,
                    }
                  }
                },
                required: ["scenes"],
                additionalProperties: false,
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_scenes" } },
      }),
    });

    if (!extractResponse.ok) {
      const errText = await extractResponse.text();
      console.error("Scene extraction error:", errText);
      await supabase.from("memories").update({ processing_status: "error", error_message: "Scene extraction failed." }).eq("id", memoryId);
      throw new Error("Scene extraction failed");
    }

    const extractData = await extractResponse.json();
    const toolCall = extractData.choices?.[0]?.message?.tool_calls?.[0];
    let scenes = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      scenes = parsed.scenes || [];
    }

    if (scenes.length === 0) {
      await supabase.from("memories").update({ processing_status: "error", error_message: "Could not extract any scenes from transcript." }).eq("id", memoryId);
      return new Response(JSON.stringify({ error: "No scenes extracted" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update with scenes, move to sketching status
    await supabase.from("memories").update({
      scenes: JSON.stringify(scenes),
      processing_status: "sketching",
    }).eq("id", memoryId);

    return new Response(JSON.stringify({ 
      success: true, 
      transcript, 
      scenes,
      memoryId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Process memory error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
