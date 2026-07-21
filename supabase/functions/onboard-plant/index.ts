import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const APP_SECRET = Deno.env.get("APP_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Guard: same secret pattern as the rest of the project
  const providedSecret = req.headers.get("x-app-secret");
  if (providedSecret !== APP_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
  const { plant_name, location_name } = await req.json();

if (!plant_name || typeof plant_name !== "string" || !plant_name.trim()) {
  return new Response(JSON.stringify({ error: "plant_name is required" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const locationContext = location_name?.trim()
  ? `The plant will be located in ${location_name.trim()}, India.`
  : "";

const prompt = `A user in India wants to add "${plant_name.trim()}" to a soil-moisture monitoring system for a houseplant. ${locationContext}
Respond with ONLY a JSON object, no other text, no markdown formatting.

If the plant name clearly identifies a common houseplant species (including common Indian household plants like Money Plant, Snake Plant, Tulsi, Areca Palm, etc.), respond with:
{
  "status": "ok",
  "species": "scientific name (common name)",
  "watering_notes": "1-2 sentence practical watering guidance",
  "ideal_moisture_min": <number, percent, typical lower bound before too dry>,
  "ideal_moisture_max": <number, percent, typical upper bound before overwatered>
}

If the name is ambiguous (could reasonably refer to more than one distinct species) or not recognizable as a real plant, respond with:
{
  "status": "clarify",
  "question": "a short, specific clarifying question to ask the user"
}`;

    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("OpenRouter error:", errText);
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawText = aiData.choices?.[0]?.message?.content ?? "";

    // Defensive cleanup in case the model wraps output in markdown fences
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse model output:", rawText);
      return new Response(JSON.stringify({ error: "Could not parse AI response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});