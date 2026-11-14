# Civix Security Fixes — Guide

This patch closes an account-takeover bug plus several other auth problems.
Everything below was tested against a local build of the app.

---

## Part 1 — Bugs fixed

### 🔴 Critical

**1. Password reset leaked the reset code (account takeover)**
`src/app/api/auth/recover/route.ts`
- Before: `action: "request"` returned the 6-digit `code` in the JSON response, and the
  `contractMemo` (`CIVIX-KEY-123456`) *contained the code too*. Anyone could type any
  username, read the code from the response, and set a new password.
- Fixed:
  - The code is **never** sent to the browser. The memo is now a separate random value (`CIVIX-REC-XXXXXXXX`).
  - Codes are made with `crypto` instead of `Math.random()`.
  - Max **5 wrong guesses**, then the request locks.
  - Asking again within 30 min reuses the same request (no code spam).
  - After a successful reset, every other pending request for that account is cancelled; a code can't be reused.
  - New password must be at least 8 characters.
  - Reset requests, failed guesses and resets are written to the security log.

**2. OAuth `redirect_uri` was never checked (account takeover on partner apps)**
`src/app/api/oauth/authorize/route.ts`
- Before: any `redirect_uri` was accepted, so a crafted link sent a logged-in user's
  auth code to an attacker's site.
- Fixed: `redirect_uri` must exactly match one of the app's registered `redirect_uris`.
  Apps that aren't `active` can't issue codes.

**3. `client_secret` was optional on the token endpoint**
`src/app/api/oauth/token/route.ts`
- Before: leaving `client_secret` out skipped the check entirely.
- Fixed: `client_secret` is required and compared in constant time. If `redirect_uri` is sent
  it must match the one the code was issued for. A code can only be exchanged once, even
  with two requests at the same moment. Form-encoded bodies are accepted as well as JSON.

**4. Hardcoded JWT secrets in a public repo (forge any login, including admin)**
`src/lib/auth.ts`, `src/app/api/oauth/token/route.ts`, new `src/lib/security.ts`
- Before: if `CIVIX_JWT_SECRET` wasn't set, the app used a secret anyone can read on GitHub.
- Fixed: no fallback. If the variable is missing or shorter than 32 characters, logins
  fail with a clear error instead of silently using a public key. JWT verification is pinned to HS256.

### 🟠 High

**5. Anyone could verify themselves to Tier 2/Tier 3**
`src/app/api/verify/route.ts`
- Before: `submit_proof` accepted any text as "proof" and instantly upgraded the user
  to whatever tier they asked for.
- Fixed: submitting proof now puts the request in a **"submitted"** queue. An admin checks
  the in-game contract and approves or rejects it in **Admin → Security**.
  Only real tier names are accepted.

**6. New apps went live instantly and were marked "verified"**
`src/app/api/apps/route.ts`
- Before: any logged-in user could register an app that was `active` + `verified`
  straight away, and use it to collect other users' identities with one click.
- Fixed: new apps start as **pending / unverified** until an admin sets them to Active.
  The redirect URI must be a full `https://` URL (`http://localhost` is allowed for testing).
  The one-click launch route also refuses to issue codes for apps that aren't active.

**7. Revoke endpoint had no authentication**
`src/app/api/oauth/revoke/route.ts`
- Before: anyone could disconnect any user from any app by sending their `citizen_id`.
- Fixed: requires `client_id` + `client_secret`, and an app can only revoke its own codes
  and its own authorizations.

### 🟡 Medium

**8. Client secrets stored in plain text and made with `Math.random()`**
- New secrets use `crypto` and only a SHA-256 hash is stored.
- Old plain-text secrets still work and are automatically re-saved hashed the first time they're used.
- New **Rotate secret** button in Admin → Applications.

**9. Live OAuth codes were sent to the admin page**
`src/app/api/admin/route.ts` — the audit list now only gets the first 12 characters.

**10. Admin inputs weren't validated** — `set_citizen_tier` and `set_app_status` now only accept known values.

**11. Cookie and JWT lifetimes didn't match** — the session cookie lasted 60 days but the token
expired after 30. Both are 30 days now.

**12. Auth codes and IDs used `Math.random()`** — OAuth auth codes, recovery and verification IDs now use `crypto`.

---

## Part 2 — How to apply and deploy

### Step 1 — Apply the patch
From the repo folder:
```bash
git checkout -b security-fixes
git apply civix-security-fixes.patch
npm install
npx tsc --noEmit        # should print nothing
```
No git? Copy the files from `civix-security-fixes-files.zip` over the matching paths in the repo.
(GitHub web: open each file → ✏️ Edit → paste the new contents → commit.)

### Step 2 — Set the secrets (REQUIRED)
In Vercel → Project → Settings → Environment Variables:

| Name | Value |
|---|---|
| `CIVIX_JWT_SECRET` | a new random string, 64+ characters |
| `CIVIX_OAUTH_JWT_SECRET` | *(optional)* a separate secret for tokens given to partner apps |

Generate one with `openssl rand -hex 32`, or with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

⚠️ Use a **new** value even if you already had one set. If production ever ran without it,
the public fallback was in use, and changing the secret logs out every forged session.
Everyone will have to log in again once.

⚠️ If a partner app checks Civix access tokens with the secret itself, give it the same
`CIVIX_OAUTH_JWT_SECRET` (or `CIVIX_JWT_SECRET`) value.

### Step 3 — Deploy, then rotate the starter app secrets
The starter apps' secrets (`secret_gug_preview`, `secret_bank_preview`, ...) are written in
`src/lib/db.ts`, which is public. After deploying:
1. Go to **/admin → Applications**.
2. Click **Rotate secret** on every app. The new secret is shown **once**: copy it.
3. Give each new secret to that app's owner to put in their `CIVIX_CLIENT_SECRET`.

### Step 4 — Tell partner app developers
- `/api/oauth/token` now **requires** `client_secret`.
- `/api/oauth/revoke` now **requires** `client_id` + `client_secret`.
- The `redirect_uri` they send must exactly match the registered one (same path, no extra slash).
- Newly registered apps need admin approval before they work.

### Step 5 — Check old reset requests and security logs
Old reset requests in `civix_recovery_requests` contain codes that were leaked. They expire
after 30 minutes, but you can clear them:
```sql
UPDATE civix_recovery_requests SET status = 'cancelled' WHERE status = 'pending';
```
To look for accounts that may have been taken over, look for password resets nobody expected,
and check `civix_security_logs` for unusual logins.

---

## Part 3 — How the new admin flows work

### Account recovery (replaces the leaked code)
1. The user opens Login → Recover, enters their username, and gets a memo like `CIVIX-REC-AB12CD34`.
2. They send the in-game notary contract with that memo.
3. An admin (or your Discord bot, through the same API) confirms the contract came **from the
   game profile ID shown**, then opens **Admin → Security → Account Recovery Lookup**,
   pastes the memo, and gets the 6-digit code.
4. The admin DMs the code to the user, and the user enters it on the Recover screen.

✅ Always check that the contract sender matches the game profile ID shown in the lookup.
That check is what stops someone from resetting another person's account.

Bot/API version: `POST /api/admin` with `{ "action": "lookup_recovery", "memo": "CIVIX-REC-..." }` as an admin session.

### Verification (KYC) approval
User submits proof → it shows up in **Admin → Security → Verification Requests** →
check the in-game contract → **Approve** (tier upgraded, user notified) or **Reject**.

---

## Files changed
- `src/lib/security.ts` *(new)*
- `src/lib/auth.ts`, `src/lib/db.ts`
- `src/app/api/auth/recover/route.ts`, `login/route.ts`, `register/route.ts`
- `src/app/api/oauth/authorize/route.ts`, `token/route.ts`, `revoke/route.ts`, `launch/[slug]/route.ts`
- `src/app/api/verify/route.ts`, `src/app/api/apps/route.ts`, `src/app/api/admin/route.ts`
- `src/app/admin/page.tsx` (Security tab, Rotate secret button)
- `src/app/developers/page.tsx` (docs: revoke now needs `client_secret`)
