# NextFlow

A simple dashboard for managing multiple Next.js sites.
Dev-tier people sign in with GitHub, install a GitHub App on the repos we work on, and (later) connect those sites.

Localhost is enough for identity and App install. The sites themselves stay on Vercel; this dashboard does not invent another host.

## Where this is

Working locally:

- Postgres via Prisma
- GitHub OAuth login (`read:user`, `user:email` only) — identity, not repo access
- First GitHub login creates workspace `nextflow` and makes that user the owner
- `/dashboard` is the site list: production URL, last publish, Vercel status
- Header shows who you are; Install GitHub App / Connect Vercel only if missing
- GitHub App install stores `installation_id` + account on `github_installations`
- Dashboard lists repos that install can see (Octokit + a short-lived installation token; the token is not stored)
- `TOKEN_ENCRYPTION_KEY` (AES-256-GCM) is ready for host tokens at rest
- Vercel Integration OAuth stores access tokens encrypted on `host_connections`; dashboard lists those projects
- A site is a GitHub repo + Vercel project row; connecting the same repo twice is rejected
- Site list reads latest production URL and status from Vercel (one failed site does not fail the list)
- Second GitHub users get a `users` row on first login, then the owner adds them as a workspace member. Repo collaborator access is not the dashboard gate.

OAuth login tokens and GitHub App installation tokens are not stored (not in the JWT, not in the cookie, not in Postgres). Vercel host tokens are AES-256-GCM ciphertext on `host_connections`. The GitHub App private key stays in `.env.local`.

## Setup

```bash
cp .env.example .env.local
```

Fill `.env.local` (`TOKEN_ENCRYPTION_KEY` is `openssl rand -base64 32`, not `AUTH_SECRET`), then:

```bash
npm install
npm run db:migrate
npm test
npm run dev
```

Restart `next dev` after any env change. Routes:

- `/` — home and sign in (signed-in non-members land here)
- `/debug/session` — session diagnostics
- `/dashboard` — site list (unsigned users and non-members redirect to `/`)

Field-by-field GitHub form values live in `.env.example`

## 1. GitHub OAuth App (who you are)

Create an **OAuth App** at [github.com/settings/developers](https://github.com/settings/developers) — this is not the GitHub App below.

| Field | Local value |
| --- | --- |
| Homepage URL | `http://localhost:3000` |
| Authorization callback URL | `http://localhost:3000/api/auth/callback/github` |

Put `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` in `.env.local`. Scopes stay `read:user` and `user:email`. That login cannot read private repos.

## 2. GitHub App (repo access)

Create a **GitHub App** once at [github.com/settings/apps/new](https://github.com/settings/apps/new). Operators install that same App from the dashboard; NextFlow does not create an App per user.

| Field | Local value |
| --- | --- |
| Homepage URL | `http://localhost:3000` |
| Callback URL | `http://localhost:3000/api/github/setup` |
| Setup URL | `http://localhost:3000/api/github/setup` |
| Redirect on update | on |
| Webhook | inactive |
| Repository permissions | **Contents** read, **Metadata** read |
| Install | Only on this account |
| Request user authorization during installation | off |

Without Contents + Metadata, GitHub will only offer “No repositories” and the dashboard cannot later list repos.

Env:

- `GITHUB_APP_ID`
- `GITHUB_APP_SLUG` (URL slug, lowercased when we build the install URL)
- `GITHUB_APP_PRIVATE_KEY` — **one quoted line** with `\n` between PEM lines

```
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

An unquoted multiline PEM is truncated; setup then 500s with `DECODER routines::unsupported`. `*.pem` downloads belong in env, not in git (already gitignored).

Install from **Install GitHub App** on `/dashboard`, pick **Only select repositories**, choose the private repo(s). GitHub redirects to `/api/github/setup?installation_id=…`. The dashboard should show `account (User|Organization) · <installation_id>`.

## 3. Vercel Integration (host access)

Create an **Integration** at [vercel.com/dashboard/integrations/console](https://vercel.com/dashboard/integrations/console). This is not Sign in with Vercel, and not GitHub.

| Field | Local value |
| --- | --- |
| Redirect URL | `http://localhost:3000/api/vercel/callback` |
| API scopes | **Project** read, **Deployment** read |
| Webhook URL | empty |

Do not list it on the Marketplace. Put `VERCEL_CLIENT_ID`, `VERCEL_CLIENT_SECRET`, and `VERCEL_INTEGRATION_SLUG` in `.env.local`, restart, then **Connect Vercel** on `/dashboard`. Vercel returns a long-lived access token; we encrypt it and list projects. The session cookie is unchanged.

## 4. Second dev (workspace membership)

The GitHub App and Vercel Integration are workspace-level. A teammate does **not** reinstall them, and GitHub repo collaborator access is not what opens `/dashboard`.

1. They sign in with GitHub once (same OAuth App). That creates a `users` row and **no** membership.
2. You (owner) add their GitHub username on `/dashboard`.
3. They refresh `/dashboard` and see the same sites.

**Local test:** keep yourself signed in in one browser. Open a **second browser** or a separate Chrome/Firefox profile (incognito works). Sign that browser into the second GitHub account, then Sign in with GitHub on `http://localhost:3000`. Same tab / same profile will reuse your first GitHub identity.

They should land on `/` (“not on the team yet”). Add them from the owner dashboard (the team list is there). They refresh `/dashboard` and see the same sites. A third GitHub account that is never added still cannot see the sites.
