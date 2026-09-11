# ADR 0001 — Guide-first paid, ad-free product

Status: Accepted
Date: 2026-09-11

## Context
Teevee is being developed as a new premium television-guide product under Bindinc/TVgids.nl supervision. The project is not a redesign of the existing TVgids.nl app. Product quality depends on resisting the tendency to turn the app into a broad entertainment portal.

## Decision
Teevee is a paid, ad-free, guide-first product for iOS and Android. The Guide is the default and primary experience. Core use does not require an account.

The product will not include advertising, engagement-driven feeds, social mechanics or broad streaming-catalogue functionality unless product scope is explicitly changed.

## Consequences
- Guide usability, performance and reliability outrank feature breadth.
- Monetisation comes from subscription rather than advertising.
- Analytics and third-party SDKs should remain minimal.
- Features that do not improve the core guide value require explicit justification.
- A later commercial decision is still required for exact price, trial and paywall timing.
