# Archive: other Boru Bats artifacts (2026-07-07)

This project (`sBs/boru-bats`, git-linked to `victordelrosal/boru-bats-chatbot`) is
the **one canonical, live** Boru Bats product: https://victordelrosal.com/boru-bats-chatbot/

This folder documents everything else related to Boru Bats that existed at the time
of consolidation, and what happened to it. Nothing outside this repo was deleted.

## What's live and canonical

- **Frontend**: the 5-advisor chat UI ("The High King's Armoury") at the repo root
  `index.html`. Pick a consultant, chat with them; bat recommendations render as
  cards inside the chat response (not a separate filter-grid page).
- **Backend**: Cloudflare Worker `boru-bats-bot` (`worker/worker.js`). OpenAI gpt-5.5
  via the Responses API, with a remote MCP tool (`/mcp` on this same worker) exposing
  `search_bats` (full curated catalog) and `check_wbsc_legality` (full official
  WBSC-Europe + USA Softball list). Deployed from `worker/` via `wrangler deploy`.
- **Data**: `bats.json` (full ~3,646-bat official legality list) and the curated
  picks catalog live alongside `index.html` for GitHub Pages to serve directly.

## What else existed, and its disposition

### 1. `sBs/softball/boru-bats-chatbot` (old Dropbox folder, not git-tracked)
An earlier, parallel dev location containing a *different* frontend design:
"Boru Bats: Hot Bat Picker", a filter-grid/catalog-browser UI (weight/balance/price
sliders, no chat, no consultant photos) instead of the chat-first design. It shared
the same backend worker. Superseded by this repo. A copy of its distinctive parts
is archived here:
- `archive/hot-bat-picker-frontend/` — that frontend's `index.html` + `picks.json`
- `archive/cloudflare-site-deploy/` — its `site/` folder, the Cloudflare Pages
  deploy source that publishes that frontend to `bats.kluxy.app` (see #2 below)

The old folder itself was left in place (not deleted) — recommend deleting it once
you've confirmed you don't need anything else from it, since everything of value is
now either in this repo or archived here.

### 2. Cloudflare Worker+assets `boru-bats-site` — **currently still live** at bats.kluxy.app
This deploys the "Hot Bat Picker" frontend above (archived in
`archive/cloudflare-site-deploy/`). It is a **second live surface** for Boru Bats,
separate from victordelrosal.com/boru-bats-chatbot/. Since the instruction was to
keep just one thing live, **this is flagged, not yet acted on** — taking down a live
custom domain felt like a separate decision from fixing the frontend regression.
Ask to have it torn down (or left running) — nothing destructive was done here.

### 3. Cloudflare Pages project `bats-kluxy` (bats-kluxy.pages.dev)
A **genuinely separate tool**, not a duplicate of the chatbot: a standalone WBSC
approved-bat list checker ("kluxy · Approved Bats"). The main chat UI links to it
directly (see the "approved-bat checker" link in the footer and in a few chat
replies) as a companion reference tool. Left alone — it isn't part of "the mess."

### 4. `boru-bats.pages.dev`
Listed in the worker's CORS allowlist but the domain doesn't resolve — no real
deployment exists here. Nothing to archive; the allowlist entry is harmless.

### 5. GitHub repo `victordelrosal/boru-bats-chatbot`
The one real GitHub repo (confirmed via `gh repo list` — no other bat/boru repos
exist on the account). This is what `sBs/boru-bats` is cloned from, and what
`victordelrosal.com/boru-bats-chatbot/` serves via the GitHub Pages
project-repo-under-custom-domain cascade from the `victordelrosal.github.io`
user site.

## Git history note

The "Hot Bat Picker" variant was briefly (accidentally) pushed live as this repo's
`index.html` on 2026-07-07 (commit `15587c4`) before being reverted (`376acde`). Full
history, including that variant and the original "High King's Armoury" commits, is
still in `git log` if ever needed beyond what's copied into this archive folder.
