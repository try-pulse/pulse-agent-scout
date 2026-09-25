# Scout

Scout is a deterministic sample Pulse agent. It responds to delegated issues and mentions without an LLM or an API key. This repository runs on its own with Node.js 22 or later. It installs `@pulse/agent-sdk` from the packed SDK artifact checked into `vendor/`; no SDK checkout is needed.

## Run locally

```bash
npm ci
npm test
cp .env.example .env
# Fill in the five required values in .env, then:
set -a; . ./.env; set +a
npm start
```

Scout serves `GET /healthz`, `GET /oauth/authorize`, `GET /oauth/callback`, and `POST /webhook` on `PORT` (default 3000). Set `BASE_URL` to the public URL reaching that server. Keep `INSTALL_SECRET`, `PULSE_CLIENT_SECRET`, and `PULSE_WEBHOOK_SECRET` private.

To connect it to Pulse:

1. Set the redirect URI in `pulse-agent-app.json` to `<BASE_URL>/oauth/callback` and the webhook URL to `<BASE_URL>/webhook`.
2. Register the manifest with `POST /api/v1/agent-apps`. Copy the returned client ID, client secret, and webhook secret into `.env`; the secrets are shown once.
3. Start Scout and open `<BASE_URL>/oauth/authorize?install_secret=<INSTALL_SECRET>` as a workspace admin.
4. Delegate an issue to Scout or mention it in an issue comment.

The six tests use a fake Pulse API and signed webhooks; they need no credentials. For a slower local run, set `SCOUT_STEP_DELAY_MS=20000` and `SCOUT_HEARTBEAT_MS=15000`.

## What Scout demonstrates

On a new agent session, Scout posts a thought, creates a plan, moves a backlog or todo issue into progress, reads context, and posts either a summary or an elicitation when the issue lacks a description. It handles follow-ups, Stop, permission changes, token revocation, and ended sessions. The default token store is a local JSON file: use durable shared storage for multiple replicas.

## SDK artifact

The dependency in `package.json` points at `vendor/pulse-agent-sdk-0.1.0.tgz`, built by `npm pack` from `pulse-agent-sdk/packages/sdk`. To refresh it after an SDK change, pack the SDK and run:

```bash
npm run sync:sdk -- /path/to/pulse-agent-sdk-0.1.0.tgz
npm ci
npm test
```

The sync command copies the artifact, refreshes its integrity in `package-lock.json`, and keeps this repository installable independently. The checked-in tarball is version `0.1.0`.

## Docker

From this repository root, run `docker build -t pulse-agent-scout .`. Mount a persistent writable volume at `/data` for the token file, provide the values from `.env` as environment variables, and expose port 3000 through a public HTTPS endpoint.
