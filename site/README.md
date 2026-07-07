# bats.kluxy.app deploy (Cloudflare Worker, static assets)

Canonical host for the Boru Bats picker is the Worker `boru-bats-site` with a
custom domain `bats.kluxy.app` (Worker custom domains auto-provision DNS + cert,
which is why this path works without a DNS-edit token).

Redeploy after editing the site:
    cd sBs/softball/boru-bats-chatbot/site
    # edit public/index.html etc., then:
    npx wrangler deploy

The chat backend is a separate Worker `boru-bats-bot` (holds the OpenAI key as a
secret, model gpt-5.5). Its source lives in ../worker/. CORS allows bats.kluxy.app.
