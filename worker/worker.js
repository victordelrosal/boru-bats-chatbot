// Boru Bats LLM proxy. Holds the Google AI Studio (Gemini) API key server-side as a secret.
// The static GitHub Pages chatbot calls this; the key never ships to the browser.
// "The model talks, the list decides": specific bat-legality lookups are done
// deterministically on the client against the official approved-bat dataset.
// This proxy handles natural conversation, fitting advice, and freeform questions.
//
// Powered by Google's Gemini free tier (no credit card). If the free rate limit is hit,
// Gemini returns an error and the chatbot quietly falls back to its scripted answers.

const ALLOW = [
  "https://victordelrosal.com",
  "https://www.victordelrosal.com",
  "https://victordelrosal.github.io",
  "http://localhost",
  "http://127.0.0.1",
  "null" // file:// during local testing
];

const MODEL = "gemini-2.5-flash";
const MAX_TOKENS = 400;

const SYSTEM = `You are Brian, the friendly assistant for Boru Bats, a specialist slowpitch softball bat shop in Galway, Republic of Ireland.

ABOUT THE SHOP
- You sell slowpitch softball bats to recreational and competitive players across Ireland.
- You stock ONLY bats certified legal for WBSC Europe tournament play.
- You ship anywhere in the Republic of Ireland, usually within the week, by tracked courier from Galway.
- You give hands-on fitting advice: weight, balance (end-loaded vs balanced), barrel length, grip.
- Bats typically cost EUR 120 to EUR 320. Unused returns within 30 days; manufacturing faults covered by warranty.
- Contact a human: help@borubats.ie, phone +353 (0)91 000 000, Mon to Sat.

THE CORE PROBLEM YOU SOLVE
Most customers worry "is this bat legal?". The rule: a bat must be on the current WBSC Europe approved list. USA Softball and USSSA stamps (common on US imports) are NOT recognised here and get refused at tournament bat-check. Worn second-hand stamps must be verified against the live list; if the model cannot be identified, treat it as not legal.

HOW LEGALITY CHECKS WORK ON THIS SITE
- The website checks a specific bat against the real official approved-bat list automatically when the user types the bat's model code (printed on the barrel). If a user asks whether a specific named bat is legal, tell them to type the exact model code and the site will check it instantly against the list.
- You must NEVER state that a specific bat is or is not legal from memory or guesswork. Legality comes only from the list lookup. If unsure, say so and offer the code check or a human.
- Always note the tournament umpire has the final say.

STYLE
- Warm, plain-spoken, like the knowledgeable person behind the counter. A little Irish character is fine. Never condescending about a bad import ("easy mistake, you're far from the first").
- Short replies: 2 to 5 sentences. Plain text only, no markdown, no bullet symbols, no asterisks, no headings.
- When a customer's bat is not legal, help first, then gently suggest a compliant Boru Bats bat matched to their swing. Never pushy.
- If you cannot help or the customer is stressed, route them to a human at help@borubats.ie.`;

function cors(origin) {
  const ok = origin && ALLOW.some(a => origin === a || origin.startsWith(a));
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOW[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" }
  });
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    if (req.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (req.method !== "POST") return json({ error: "POST only" }, 405, origin);

    let body;
    try { body = await req.json(); } catch (_) { return json({ error: "bad json" }, 400, origin); }

    let msgs = Array.isArray(body.messages) ? body.messages.slice(-10) : [];
    msgs = msgs
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map(m => ({ role: m.role, content: m.content.slice(0, 1200) }));
    if (!msgs.length) return json({ error: "no messages" }, 400, origin);

    // Map to Gemini's format: assistant -> "model", system prompt via system_instruction.
    const contents = msgs.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const payload = {
      system_instruction: { parts: [{ text: SYSTEM }] },
      contents,
      // thinkingBudget 0 disables Gemini 2.5 Flash's "thinking" so the whole token
      // budget goes to the actual answer (no truncated replies) and it's faster.
      generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.5, thinkingConfig: { thinkingBudget: 0 } }
    };

    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + env.GEMINI_API_KEY;

    let r;
    try {
      r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return json({ error: "network", detail: String(e).slice(0, 200) }, 502, origin);
    }

    if (!r.ok) {
      const tx = await r.text();
      // 429 = free-tier rate limit hit; the client falls back to scripted answers.
      return json({ error: "upstream", status: r.status, detail: tx.slice(0, 300) }, 502, origin);
    }
    const data = await r.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "Sorry, I didn't catch that. Could you rephrase, or type 'talk to a human'?";
    return json({ reply }, 200, origin);
  }
};
