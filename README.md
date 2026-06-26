# Krupal Tandel — Portfolio

A static portfolio site with **Cipher**, an embedded AI assistant that answers visitor
questions about Krupal using a real, server-side call to the Anthropic Claude API
(with an offline keyword-based fallback if the live call fails).

## Stack

- Plain HTML/CSS/JS — no build step, no framework.
- `netlify/functions/cipher.js` — a Netlify serverless Function that calls the
  Anthropic Messages API server-side, so the API key never reaches the browser.

## Project structure

```
index.html                   the site
styles.css                   all styles (liquid-glass nav/Cipher panel, layout, etc.)
script.js                    site behaviour + the Cipher chat widget
assets/fonts/                Avenir LT Std font files
netlify/functions/cipher.js  serverless function: calls Claude, returns { reply }
netlify.toml                 Netlify build config (publish + functions dir)
```

## Local development

Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/) if you don't
have it, then from the repo root:

```
npm install -g netlify-cli   # if needed
netlify dev
```

`netlify dev` serves `index.html` and runs the `cipher` function locally (default
`http://localhost:8888`), so the Cipher widget's live API calls work the same as in
production. Opening `index.html` directly in a browser (without `netlify dev`) will
still work for the rest of the site, but Cipher will fall back to its local
knowledge base since there's no function server to call.

## Environment variables

Set these in **Netlify → Site configuration → Environment variables** (or in a local
`.env` file when using `netlify dev`):

| Variable             | Required | Notes                                                              |
| --------------------- | -------- | ------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY`  | Yes      | Server-side only — never exposed to the browser.                   |
| `ANTHROPIC_MODEL`    | No       | Defaults to `claude-haiku-4-5-20251001` if unset.                   |

Without `ANTHROPIC_API_KEY`, the function returns an error and the widget transparently
falls back to its built-in knowledge base — the site still works, Cipher just won't
have live, open-ended answers.

## Deploying

Push to the connected Git repo, or run `netlify deploy --prod`. Netlify reads
`netlify.toml` for the publish directory (`.`) and functions directory
(`netlify/functions`) automatically.
