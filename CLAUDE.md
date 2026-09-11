@AGENTS.md

# Earl Knows — project log

**One vetted pro per trade per city.** A local home-services referral site.
Launching in Boise, ID; architected to work anywhere.

## How to use this file

This is the durable memory for the project. Conversations get long and ideas get
lost — this file is the thing that doesn't.

- **Decisions** get logged with the date and the *reasoning*, not just the outcome.
  When a decision changes, amend the entry and note what changed and why. Don't
  delete history — a decision we reversed is worth remembering so we don't
  re-litigate it.
- **Tasks** get checked off as they ship.
- **Open questions** live at the bottom until answered, then move into Decisions.

---

## The business

Homeowner needs a contractor. Earl recommends a small, vetted panel — not eight
companies who all call at dinner. Contractors pay a flat monthly fee to be on
that panel.

The competitors we're positioned against:

| | Model | Economics |
|---|---|---|
| **Angi / HomeAdvisor** | Lead shared with 3–8 contractors | $15–120/lead, ~10% close, $1,000–1,400 per booked job. 1,800+ BBB complaints; $7.2M FTC settlement over lead-quality claims. |
| **Google LSA** | Exclusive lead, one at a time | ~$53/lead, 31% booking on answered calls. Auction — rotates by design. |
| **Earl Knows** | Small vetted panel, flat monthly | Predictable cost. No per-lead billing, so no lead-quality disputes. |

---

## Decisions

### Business model

- **2026-09-11 — Panel size is configurable per territory.** Not a fixed "one pro
  per city." Each territory has a `maxProviders` cap that we set per market.
  Start at 1–3, open up when a market proves out.
  *Evolved from:* an earlier "exactly one provider per territory" plan. Rejected
  because it caps revenue per market arithmetically, gives every page a
  single point of supply failure, and can't load-balance lead volume.

- **2026-09-11 — Over-cap providers go on a waitlist.** They see "not accepting
  new providers here right now" and can leave details. This doubles as a demand
  curve for our own inventory: lots of waitlisted roofers in Boise means the cap
  or the price is too low.

- **2026-09-11 — Providers are shown in rotation, not ranked.** The page says
  the order rotates so everyone gets a fair shot. We do **not** call any provider
  a "top recommendation" while the order is arbitrary — that's the exact
  misrepresentation Angi settled with the FTC over, and our contractors are
  already primed to distrust it.
  *Revisit when:* we have real performance data (response time, close rate,
  completed jobs). Merit ranking is the better long-term product because it makes
  providers compete on quality — but it has to be earned and disclosed.

- **2026-09-11 — Lead routing is round-robin, not random.** Route to whoever has
  received fewest leads this month. Random is lumpy at low volume: 3 providers
  and 10 leads can easily land 6/3/1, where round-robin gives 4/3/3. Display
  order and lead routing are separate concerns.

- **2026-09-11 — Pricing is a flat monthly fee per listing slot, priced per
  territory.** Free for the first 60 days as acquisition.
  *Rejected:* volume-tiered billing (free ≤5 referrals, $49 for 6–10, etc.).
  It's per-lead pricing in a costume, and it creates a perverse incentive we
  can't design away — Earl would profit by sending more leads, which is precisely
  the accusation Angi settled. Cliff edges also generate a dispute at every tier
  boundary. Flat fees keep the upside with us (we set cap *and* price per market)
  without putting variability on the contractor's invoice.

### Product

- **2026-09-11 — Everything must be crawlable.** Organic search is the entire
  traffic strategy. Provider listings live on static `/[service]/[city]/` pages.
  The lead form sits *on* that page — it never gates the content.

- **2026-09-11 — Every provider gets their own page.** An "about us" style profile
  covering what they do. Adds indexable surface area and gives providers something
  they'd actually link to from their own site.

- **2026-09-11 — Schema uses the provider's real NAP.** `LocalBusiness` markup
  carries the contractor's actual name, address, and phone — never a fabricated
  listing for Earl. Fake local listings are what gets directory sites de-indexed,
  and complete `LocalBusiness` markup correlates with local-pack appearance
  30–50% more often.

- **2026-09-11 — Local content per page is mandatory, not optional.** 200 pages
  off one template with the city swapped is a doorway network. December 2025's
  core update hit affiliate/directory sites hardest at 71%. Every territory page
  needs something only someone working that market would know — permit rules,
  climate failure modes, real price ranges.

### Technical

- **2026-09-11 — Stack: Next.js 16.3.3 + Payload CMS 3.89 + Postgres.** Payload
  embeds directly in the Next app (`(payload)` and `(frontend)` route groups), so
  the admin panel is generated from the data model rather than built.

- **2026-09-11 — Not Shopify.** Shopify hardcodes `/products/`, `/collections/`,
  `/pages/` — `/roofing/boise/` is impossible without going headless, and every
  part of this would be bending a product-selling platform into a directory.

- **2026-09-11 — Railway over Vercel.** Railway hosts app + Postgres on one bill
  (~$15–20/mo) and publishes a Payload 3.x deployment guide. Vercel's Hobby tier
  prohibits commercial use, so it would have been Pro at $20/mo *plus* a separate
  database vendor.

- **2026-09-11 — Local Postgres for development, Railway for production.** Schema
  iteration never touches production data. The Railway DB stays private — no
  public TCP proxy needed, since the deployed app connects over the private network.

- **2026-09-11 — URL architecture is service-first.**
  ```
  /                      home
  /[service]/            service hub — accumulates topical authority
  /[service]/[city]/     the money page
  /[city]/               city hub
  /pros/[provider]/      provider profile
  ```
  Root-level `/[slug]/` resolves to either a service or a city, which avoids two
  sibling dynamic segments.

- **2026-09-11 — Page content lives on the Territory record.** The editorial for
  `/roofing/boise/` *is* the roofing-in-Boise pairing. A separate content
  collection would mean keeping two records in sync forever.

- **2026-09-11 — Destructive schema changes prompt interactively and will hang a
  backgrounded dev server.** When a column is dropped and another added, Drizzle
  can't tell a rename from a new column and asks. With no TTY the server blocks
  and every request takes ~90s. In dev with no real data, drop and recreate:
  `dropdb --force earlknows && createdb earlknows`, then re-seed with
  `npx tsx scripts/seed.ts`. Before production has data, switch to real migrations.

- **2026-09-11 — Pin the Payload template to the release tag.** Scaffolding from
  `HEAD` pulls unreleased code that references exports the published packages
  don't have. Use `degit payloadcms/payload/templates/blank#v3.89.0`.

---

## Current state

**Working**
- [x] Repo, Railway project + Postgres, local Postgres 17
- [x] Payload admin at `/admin` with 7 collections
- [x] Data model: services, cities, providers, territories, leads, media, users
- [x] Home page, service hub, city hub
- [x] Territory auto-labelling ("Roofing — Boise, ID")

- [x] Territory `maxProviders` cap + multi-provider panel
- [x] `/[service]/[city]/` money page — panels, daily rotation, JSON-LD
      (BreadcrumbList, Service, ItemList of LocalBusiness, FAQPage)
- [x] Lead form + server action with round-robin routing
- [x] Provider profile pages at `/pros/[slug]/`
- [x] Applications collection (doubles as the waitlist)
- [x] Seed script at `scripts/seed.ts`

**Not started**
- [ ] `/apply` page — the territory page already links to it, so it 404s today
- [ ] Wire applications to auto-waitlist when a panel is full
- [ ] Lead notification email (Resend)
- [ ] `sitemap.ts` / `robots.ts`
- [ ] Deploy to Railway, point `earlknows.com` via Cloudflare
- [ ] R2 storage adapter for uploads (Payload writes to local disk by default,
      which does not survive a container restart)
- [ ] Flat-fee billing (Stripe) — deliberately deferred; invoice by hand first

---

## Open questions

- **What do the first contractors actually want?** Mike has two buddies with
  service businesses in Boise. Asking them whether they'd prefer a flat monthly
  fee or per-lead, and what they'd pay, settles the pricing number faster than
  reasoning about it.
- **Which three services and which markets launch first?**
- **What's the flat fee per slot in Boise?** Unknown until we know lead volume.
- **Trademark clearance on "Earl Knows"** before the name goes anywhere public.
  (Chose Earl over Otis specifically because Otis AI — a funded ad-tech startup —
  occupies the same Class 35 space.)

---

## Conventions

- **Next.js 16 has breaking changes from earlier versions.** `AGENTS.md` points at
  `node_modules/next/dist/docs/` — check there before assuming an API works the
  way it used to.
- `params` and `searchParams` are Promises in the App Router; `await` them.
- Secrets live in `.env` locally (gitignored) and Railway env vars in production.
  Never paste them into chat.
- Local dev DB: `postgres://mikehermansen@localhost:5432/earlknows`
  (Postgres 17 via Homebrew, running as a service).
- Dev server: `pnpm dev` → http://localhost:3000
