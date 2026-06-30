// Boru Bats LLM proxy. Holds the OpenRouter API key server-side as a secret.
// The static GitHub Pages chatbot calls this; the key never ships to the browser.
// "The model talks, the list decides": specific bat-legality lookups are done
// deterministically on the client against the official approved-bat dataset.
// This proxy handles natural conversation, fitting advice, and freeform questions.

const ALLOW = [
  "https://victordelrosal.com",
  "https://www.victordelrosal.com",
  "https://victordelrosal.github.io",
  "http://localhost",
  "http://127.0.0.1",
  "null" // file:// during local testing
];

const MODEL = "openai/gpt-4o-mini";
const MAX_TOKENS = 380;

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

    const payload = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.5,
      messages: [{ role: "system", content: SYSTEM }, ...msgs]
    };

    let r;
    try {
      r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.OPENROUTER_API_KEY,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://victordelrosal.com/boru-bats-chatbot/",
          "X-Title": "Boru Bats Assistant"
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      return json({ error: "network", detail: String(e).slice(0, 200) }, 502, origin);
    }

    if (!r.ok) {
      const tx = await r.text();
      return json({ error: "upstream", status: r.status, detail: tx.slice(0, 300) }, 502, origin);
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I didn't catch that. Could you rephrase, or type 'talk to a human'?";
    return json({ reply }, 200, origin);
  }
};
