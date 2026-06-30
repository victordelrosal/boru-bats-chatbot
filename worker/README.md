# Boru Bats LLM proxy (Cloudflare Worker)

Holds the LLM API key as a server-side secret so the public GitHub Pages page never sees it.

## Why
You must never hardcode an API key in a static front-end. A GitHub Pages site ships every file
to the browser, and the key would also live in public git history forever. The page calls this
Worker; the Worker adds the key and forwards the request to the LLM.

## Deploy
    wrangler deploy
    # set the secret (never committed):
    printf '%s' "$YOUR_OPENROUTER_KEY" | wrangler secret put OPENROUTER_API_KEY

The page posts {messages:[...]} to the Worker URL; it returns {reply:"..."}.
Model: openai/gpt-4o-mini via OpenRouter. CORS is restricted to the site's origins.
