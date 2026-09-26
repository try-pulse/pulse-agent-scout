# Scout

A sample Pulse agent app that answers delegated issues and @mentions. Scout is deterministic: it uses no LLM and needs no model API key, so it is the quickest way to see the whole agent app flow work end to end. Built with [`@try-pulse/agent-sdk`](https://www.npmjs.com/package/@try-pulse/agent-sdk) on Node.js.

## How it works

1. `POST /webhook` receives signed `AgentSessionEvent` webhooks. The SDK verifies the signature over the raw body, answers `200` right away (Pulse requires a `2xx` within 5 seconds), and deduplicates deliveries.
2. On `created`, Scout posts a thought within the 10-second window, creates a plan, moves a backlog or todo issue to in progress, reads the issue's context, and posts a summary. When the issue has no description, it asks for one with an elicitation instead.
3. A `prompted` follow-up continues the same session. A Stop ends the run with one final response within 60 seconds. Scout also handles permission changes, token revocation and ended sessions.

## Prerequisites

- Node.js 22 or later
- A Pulse workspace where you can register an agent app, and a workspace admin to install it
- A public HTTPS URL that reaches this server (for local development, an HTTPS tunnel such as ngrok)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Register the agent app in Pulse

Edit `pulse-agent-app.json`: set `oauth.redirect_uris` to `<BASE_URL>/oauth/callback` and `webhook.url` to `<BASE_URL>/webhook`.

In Pulse, open **Settings → API → Agent apps**, choose **Import manifest**, and paste the file. You can also send it to `POST https://api.trypulse.tech/api/v1/agent-apps` with your session token and `X-Workspace-ID`. Pulse shows the client secret (`pulse_sk_…`) and webhook secret (`pwhsec_…`) once; copy them.

### 3. Configure the environment

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `PULSE_CLIENT_ID`, `PULSE_CLIENT_SECRET`, `PULSE_WEBHOOK_SECRET` | From step 2 |
| `BASE_URL` | The public HTTPS origin of this server |
| `INSTALL_SECRET` | A long random secret that guards `/oauth/authorize` |
| `PORT` | Local port, default `3000` |
| `PULSE_API_URL` | Optional; defaults to `https://api.trypulse.tech/api/v1` |
| `TOKEN_FILE` | Where installation tokens are stored, default `.pulse-tokens.json` |
| `SCOUT_STEP_DELAY_MS`, `SCOUT_HEARTBEAT_MS` | Optional; slow Scout down (for example `20000` and `15000`) to watch heartbeats, queued follow-ups and Stop |

### 4. Start the server

```bash
set -a; . ./.env; set +a
npm start
```

### 5. Install the app in your workspace

As a workspace admin, open `<BASE_URL>/oauth/authorize?install_secret=<INSTALL_SECRET>`. This starts OAuth with `actor=app`: Pulse shows the consent screen, you pick the teams the app may work in, and Pulse creates the app's own user.

### 6. Use it

Delegate an issue to Scout, or @mention it in a comment. Follow the session in the issue's agent panel; reply there to send a follow-up, or press Stop.

## Tests

```bash
npm test
```

The six tests use a fake Pulse API and signed webhooks, so they need no credentials.

## Project structure

```
src/
  main.ts      HTTP server: /healthz, /webhook, /oauth/authorize, /oauth/callback
  scout.ts     Agent session handling: thought, plan, status, summary or elicitation, Stop
  context.ts   Reads the issue's context from Pulse
test/          Tests with a fake Pulse API
pulse-agent-app.json   Agent app manifest
Dockerfile     Container image
```

The default token store writes a local JSON file; use durable shared storage if you run more than one replica.

## Docker

```bash
docker build -t pulse-agent-scout .
```

Mount a writable volume at `/data` for the token file, pass the variables from `.env`, and expose port 3000 through a public HTTPS endpoint.

## Learn more

- [Pulse agent developer docs](https://trypulse.tech/docs/developers/agents)
- [`@try-pulse/agent-sdk`](https://github.com/try-pulse/pulse-agent-sdk)
- [Claude Managed Agents for Pulse](https://github.com/try-pulse/pulse-claude-managed-agents-demo), the same flow with a Claude agent
