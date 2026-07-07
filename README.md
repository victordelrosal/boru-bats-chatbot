# Boru Bats LLM proxy (Cloudflare Worker `boru-bats-bot`)

Holds the OpenAI API key as a server-side secret so the public GitHub Pages /
bats.kluxy.app pages never see it. Powered by `gpt-5.5`.

## What it does (three request shapes, all POST JSON, plus one MCP endpoint)
- `{consultant, messages:[...]}` -> `{reply}` : the conversational consultant ("brain"
  of the chat). Runs on OpenAI's Responses API with the `/mcp` endpoint below wired in
  as a remote MCP tool, so it looks up bats and legality live instead of a static
  top-40 slice stuffed into the prompt.
- `{profile, bats:[...]}` -> `{summary, picks:[...]}` : "Tune for my swing" re-rank.
- `{buy:"<bat name>"}` -> `{listings:[...]}` : live "where to buy" via gpt-5.5 web search.
- `/mcp` (GET/POST) : a stateless MCP (Model Context Protocol) JSON-RPC server, no
  Durable Objects/session state needed since every call is a pure lookup over the
  public catalog files. Two tools:
  - `search_bats` : filtered search over the full curated catalog (`picks.json`, ~70
    bats), not capped at a fixed top-N.
  - `check_wbsc_legality` : looks up any bat model against the full official
    WBSC-Europe + USA Softball list (`bats.json`, ~3600 entries) AND the curated
    catalog's own cross-check. The curated catalog verdict (`boru_bats_verdict`) is
    authoritative, since manufacturers sometimes recertify the same barrel under a
    different retail name than what's in the raw registry.

## Why a proxy
Never hardcode an API key in a static front-end. A GitHub Pages site ships every file
to the browser, and the key would live in public git history forever. The page calls
this Worker; the Worker adds the key and forwards the request to OpenAI.

## Deploy
    wrangler deploy
    # set the secret (never committed)
    printf '%s' "YOUR_OPENAI_KEY" | wrangler secret put OPENAI_API_KEY

CORS is restricted to the site's origins (see ALLOW in worker.js). The root-level
`../worker.js` is an identical mirror of this file kept for convenience; edit both
or copy one to the other before deploying.
