# Boru Bats LLM proxy (Cloudflare Worker)

Holds the Gemini (Google AI Studio) API key as a server-side secret so the public
GitHub Pages page never sees it. Powered by Gemini 2.5 Flash on Google's FREE tier.

## Why a proxy
Never hardcode an API key in a static front-end. A GitHub Pages site ships every file
to the browser, and the key would live in public git history forever. The page calls
this Worker; the Worker adds the key and forwards the request to Gemini.

## Why Gemini free tier
No credit card. If the free rate limit is hit, Gemini returns an error (HTTP 429) and
the chatbot quietly falls back to scripted answers. It can never produce a bill.

## Deploy
    wrangler deploy
    # set the secret (never committed). Get a free key at https://aistudio.google.com
    printf '%s' "YOUR_FREE_GEMINI_KEY" | wrangler secret put GEMINI_API_KEY

The page POSTs {messages:[...]} to the Worker URL; it returns {reply:"..."}.
Model: gemini-2.5-flash. CORS is restricted to the site's origins.

## Free alternative without any backend
For a personal project you can skip the Worker entirely and call Gemini straight from
the browser with your own free key (see the build write-up, "Build it free"). Just never
commit the key and never use a paid key client-side.
