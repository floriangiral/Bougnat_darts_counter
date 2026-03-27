# Security Notes

This repository is public. The application must stay deployable without exposing operational secrets.

## Current principles

- Frontend builds only use public `VITE_*` values.
- `VITE_SUPABASE_ANON_KEY` is allowed in the client bundle.
- Supabase service-role credentials must stay server-side or local-only tooling.
- Sensitive data access must stay behind Supabase RLS and RPC policies.

## Required manual settings

These protections cannot be enforced only from this repository and must be configured in the platforms.

### GitHub

- Enable fork pull request approval before secrets are made available.
- Keep branch protection on `preprod` and `main`.
- Require `Quality Gate`, `Security Review`, and `Secret Scan` before merge.
- Keep Dependabot enabled for security updates.

### Vercel

- Protect preview deployments with Vercel Authentication or password protection.
- Restrict project members to the minimum needed.
- Keep production and preproduction as separate Vercel projects/environments when possible.
- Store sensitive values in Vercel or GitHub secrets, never in the repository.

### Supabase

- Use separate projects for local/develop, preprod, and production.
- Keep RLS enabled on all sensitive tables.
- Never expose service-role keys to the frontend.
- Keep Auth redirect URLs limited to known domains and `/auth/callback`.

## Validation checklist

- No service-role key appears in frontend code, public env, or Vercel public vars.
- Preview deployments are not publicly accessible without an explicit gate.
- RLS changes are reviewed and tested before merge.
- Secret scanning passes on pull requests and on the default branch.
