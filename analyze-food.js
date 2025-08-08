// /api/analyze-food.js — Vercel serverless-funktion (utan SDK-deps)
// Env-variabler i Vercel: OPENAI_API_KEY, USDA_API_KEY
export const config = { runtime: "nodejs18.x" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });

    // 1) OpenAI Vision via fetch (chat.completions) – ber om JSON-svar
    const sysPrompt = `Du är en expert på matigenkänning.
Returnera strikt JSON med: { "dish": string, "portion_grams": number }.
Portion_grams ska vara din bästa uppskattning av mängden mat på bilden.`;

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: sysPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Vad är detta för maträtt? Uppskatta portionsstorleken i gram. Svara enbart med JSON." },
              { type: "image_url", image_url: imageBase64 }
            ]
          }
        ]
      })
    });
    if (!openaiRes.ok) throw new Error("OpenAI error " + openaiRes.status);
    const openaiJson = await openaiRes.json();
    const text = openaiJson?.choices?.[0]?.message?.content?.trim() || "{}";

    let dish = "Okänd rätt", portion_grams = 300;
    try {
      const parsed = JSON.parse(text);
      dish = parsed.dish || dish;
      portion_grams = Number(parsed.portion_grams || portion_grams);
    } catch {}

    // 2) USDA sök – hämta makron/energi (per 100g om möjligt)
    const usdaKey = process.env.USDA_API_KEY;
    const query = encodeURIComponent(dish);
    const usdaSearch = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaKey}&query=${query}&pageSize=1`);
    if (!usdaSearch.ok) throw new Error("USDA search failed: " + usdaSearch.status);
    const usdaJson = await usdaSearch.json();
    const food = usdaJson?.foods?.[0];

    let per100 = { calories: 0, fat: 0, protein: 0, carbs: 0 };
    const wanted = {
      calories: ["Energy", "Energy (Atwater General Atwater factor)"],
      fat: ["Total lipid (fat)"],
      protein: ["Protein"],
      carbs: ["Carbohydrate, by difference"]
    };
    (food?.foodNutrients || []).forEach(n => {
      const name = n.nutrientName;
      const val = n.value;
      if (wanted.calories.includes(name)) per100.calories = val;
      if (wanted.fat.includes(name)) per100.fat = val;
      if (wanted.protein.includes(name)) per100.protein = val;
      if (wanted.carbs.includes(name)) per100.carbs = val;
    });

    // 3) Skala upp till uppskattad portion
    const scale = (portion_grams || 100) / 100;
    const out = {
      name: dish,
      calories: Math.max(0, Math.round((per100.calories || 0) * scale)),
      fat: Math.max(0, (per100.fat || 0) * scale),
      protein: Math.max(0, (per100.protein || 0) * scale),
      carbs: Math.max(0, (per100.carbs || 0) * scale),
      portion_grams
    };

    res.status(200).json(out);
  } catch (err) {
    console.error(err);
    res.status(200).json({ error: "analysis_failed", detail: String(err) });
  }
}
