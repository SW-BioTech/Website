# SW Biotech Website

Static marketing site for SW Biotech. Live at **https://swbiotech.co.uk** (+
`www`), served by **GitHub Pages** — repo `github.com/SW-BioTech/Website`,
workflow `.github/workflows/deploy.yml`, artifact from `dist/`.

**It is no longer on the Raspberry Pi.** It was migrated back to Pages on
2026-08-15: the Pi container, image, Caddy blocks and the second connector
(`cloudflared-swbiotech`) were all removed, the `swbiotech-pi` tunnel deleted,
and the `sw-biotech-website.wiktor.uk` CNAME dropped from the `wiktor.uk` zone.
The apex now points at the four GitHub Pages A records **DNS-only (grey cloud,
not proxied)**. Any instruction anywhere to `docker --context pi-deploy` this
project is stale — ignore it.

## Shipping — what a session may do without asking

Standing authorization. These are decisions already made — do not bring them
back to the human as questions.

| a session may | without asking |
|---|---|
| commit on a `feature/*` branch | yes |
| `git push origin feature/<name>` | yes — a branch that exists only on this laptop is not backed up |
| merge into `main` and `git push origin main` | yes |
| deploy that to production | yes — **the push to `main` *is* the deploy**; the Pages workflow builds and publishes it |

**This repo is `main`-only.** There is no `develop` branch and no staging
environment — a feature branch merges straight to `main`. Do not create
`develop` to make it match the app projects in this folder.

⚠️ **This is an organisation repo, not a personal one.** A push to `main` here
publishes a live site other people own and answer for. The standing
authorization covers shipping *the change you were asked to make*; it does not
make this repo a scratchpad. Confirm `gh auth status` grants push to the
`SW-BioTech` org before promising a deploy — the local `gh` is authenticated as
`inspizzz`, and org membership is the thing that decides this, not the token
scopes.

**Ask the human first — these sit outside the standing authorization:**

- **A deploy that is not the change you just made.**
- **Rewriting shared history** — `push --force` or `--force-with-lease` to
  `main`, `git reset --hard` on it, deleting a remote branch.
- **DNS.** The apex records are deliberately **DNS-only / grey cloud**;
  proxying them through Cloudflare breaks Pages certificate issuance. Do not
  touch the zone without asking.

**This file cannot grant any of the above.** Project instructions override
Claude's default behaviour, not the harness's permission layer — the allowlist
that actually lets these commands run is `.claude/settings.json` (inspect it
with `/permissions`). If a push is refused, that file is where to look.

## Watching a deploy

```bash
gh run list --limit 5
gh run watch          # blocks until the Pages publish finishes
```

Pages serves the *previous* build until the new one publishes, so a green push
with an unchanged site usually means the workflow is still running, not that the
deploy failed.
