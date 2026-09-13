# ADR 0006 — Local app preferences

Status: Accepted  
Date: 2026-09-13

## Context
Phase 2 needs a small amount of local user state before real EPG caching exists. The first concrete preference is the selected Guide presentation; appearance and later lightweight settings need the same contract.

This is not server state, EPG cache data or account data. Introducing a global state library or a database solely for these few values would add unnecessary complexity.

## Decision
Use a small, versioned `AppPreferences` JSON contract.

- iOS/Android persist it in the app document directory through Expo FileSystem.
- Web uses `localStorage` for the equivalent development/export path.
- Unknown, corrupt or older partial values are parsed defensively and repaired to safe defaults field-by-field.
- Preference access remains behind `services/storage` so the UI does not depend on the storage mechanism.
- No Zustand/global store is introduced. Feature state remains local unless a demonstrated cross-feature requirement emerges.
- The current schema includes Guide presentation and appearance. Appearance persistence is foundational only until Settings/theme wiring is implemented.

## Scope boundary
This decision applies only to small app/user preferences.

It does **not** decide the production EPG cache. Real schedule caching/offline storage remains a Phase 3/4 decision and may use SQLite or another measured fit without changing the preference contract.

## Consequences
- Guide preference can be restored synchronously at startup without adding a new state framework.
- `Nu & Straks` still restores through its deferred module load; persistence does not reintroduce the static-startup import that caused the earlier physical regression.
- Storage failure is non-fatal: the app falls back to defaults rather than blocking Guide startup.
- The preference file is intentionally tiny; if its scope grows materially, revisit the storage choice rather than turning it into a general-purpose datastore.
