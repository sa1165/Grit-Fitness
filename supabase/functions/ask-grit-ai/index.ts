import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const DEFAULT_MODEL = "llama-3.3-70b-versatile"
const FALLBACK_MODEL = "llama-3.1-8b-instant"

const SYSTEM_PROMPT = `You are Grit AI, a strictly specialized fitness, diet, and training expert. 

CORE RULE: 
ONLY answer questions related to fitness, bodybuilding, nutrition, weight loss, and health. 
If a user asks about UNRELATED topics (e.g., general recipes like Sambar, movie trivia, coding, or general news), you MUST politely refuse. 
Respond with: "I am your Grit AI Trainer. I only provide advice on fitness, diet, and training. How can I help you with your workout today?"

GUIDELINES:
1. NO UNRELATED CONTENT: Do not provide general recipes, instructions, or facts that are not directly related to a user's fitness journey.
2. NO FORMATTING SYMBOLS: Do NOT use asterisks (*) for bolding or lists. Do NOT use any other Markdown symbols.
3. STRUCTURE: Use plain text with clear capitalized headings.
4. ACCURACY: Base your advice on sports science and evidence-based nutrition.
5. PERSONALITY: You are Grit AI. You are professional, focused, and motivating.

WORKOUT STRUCTURE:
- PULL: Back, Biceps.
- PUSH: Chest, Shoulders, Triceps.
- LEGS: Quads, Hamstrings, Glutes, Calves.`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    const fetchGritAI = async (model: string) => {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      })
      return response
    }

    let response = await fetchGritAI(DEFAULT_MODEL)

    // Failover to 8B if 70B is limited or unavailable
    if (response.status === 429 || !response.ok) {
      console.log(`Primary model (${DEFAULT_MODEL}) failed with status ${response.status}. Trying fallback...`)
      response = await fetchGritAI(FALLBACK_MODEL)
    }

    const data = await response.json()
    
    // Process text to remove asterisks (server-side safety)
    if (data.choices?.[0]?.message?.content) {
      data.choices[0].message.content = data.choices[0].message.content.replace(/\*/g, '')
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
