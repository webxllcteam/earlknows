import Link from 'next/link'
import type { Metadata } from 'next'

import { payloadClient, SITE_NAME } from '@/lib/payload'
import { resolvePlace } from '@/lib/places'
import { submitApplication } from './actions'

export const dynamic = 'force-dynamic'

type Search = { place?: string; service?: string; sent?: string; error?: string }

export const metadata: Metadata = {
  title: 'Apply to be listed',
  description:
    'Earl lists a small number of contractors per trade in each metro, on purpose. Apply to be one of them.',
  alternates: { canonical: '/apply' },
}

const field: React.CSSProperties = {
  padding: '0.7rem 0.8rem',
  border: '1px solid var(--line)',
  borderRadius: '4px',
  background: 'var(--surface)',
  color: 'var(--ink)',
  font: 'inherit',
  width: '100%',
}

const button: React.CSSProperties = {
  padding: '0.8rem 1.2rem',
  border: 0,
  borderRadius: '4px',
  background: 'var(--forest)',
  color: '#fff',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
  justifySelf: 'start',
}

export default async function ApplyPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { place: placeSlug, service: serviceSlug, sent, error } = await searchParams
  const payload = await payloadClient()

  const [services, markets] = await Promise.all([
    payload.find({
      collection: 'services',
      where: { active: { equals: true } },
      sort: 'sortOrder',
      limit: 100,
    }),
    payload.find({
      collection: 'markets',
      where: { active: { equals: true } },
      sort: 'name',
      limit: 100,
    }),
  ])

  // The link that sent them here carries a place and a trade — preselect both.
  // A place may be a city, in which case we want the market it belongs to.
  let presetMarketId: number | undefined
  if (placeSlug) {
    const place = await resolvePlace(placeSlug)
    if (place?.kind === 'market') presetMarketId = place.id
    else if (place?.kind === 'city' && place.marketId) presetMarketId = place.marketId
  }

  const presetService = serviceSlug
    ? services.docs.find((s) => s.slug === serviceSlug)
    : undefined

  // Which panels are already full, so we can say so before they type anything.
  const listings = await payload.find({
    collection: 'listings',
    where: { status: { equals: 'live' } },
    depth: 0,
    limit: 500,
  })
  const fullPanels = new Set(
    listings.docs
      .filter((l) => {
        const taken = Array.isArray(l.providers) ? l.providers.length : 0
        return taken >= (l.maxProviders ?? 3)
      })
      .map((l) => {
        const s = typeof l.service === 'object' ? l.service?.id : l.service
        const m = typeof l.market === 'object' ? l.market?.id : l.market
        return `${s}-${m}`
      }),
  )

  const presetIsFull =
    presetService && presetMarketId
      ? fullPanels.has(`${presetService.id}-${presetMarketId}`)
      : false

  if (sent) {
    const waitlisted = sent === 'waitlisted'
    return (
      <div className="wrap narrow">
        <nav className="crumbs">
          <Link href="/">{SITE_NAME}</Link> / Apply
        </nav>
        <section className="hero">
          <h1>{waitlisted ? "You're on the list." : 'Got it.'}</h1>
          <p className="lede">
            {waitlisted
              ? "That panel is full right now, so Earl has you on the waitlist. He caps each list deliberately — when a slot opens, you'll hear from him before it's advertised anywhere."
              : "Earl will look you up, check your license and insurance, and be in touch. He doesn't list anyone he hasn't checked out."}
          </p>
        </section>
        <p>
          <Link href="/">Back to Earl Knows</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="wrap narrow">
      <nav className="crumbs">
        <Link href="/">{SITE_NAME}</Link> / Apply
      </nav>

      <section className="hero">
        <h1>Apply to be listed</h1>
        <p className="lede">
          Earl recommends a short list of contractors per trade in each metro — never eight
          companies at once. Fewer names means the people on the list actually get the work.
        </p>
      </section>

      {presetIsFull && (
        <div className="unclaimed">
          <strong>
            {presetService?.name} in that metro is full right now.
          </strong>
          <p style={{ margin: '0.4rem 0 0' }}>
            Apply anyway and Earl will put you on the waitlist. He&apos;d rather have someone ready
            than scramble when a slot opens.
          </p>
        </div>
      )}

      <h2>How it works</h2>
      <ul className="plain-list">
        <li>
          <strong>One flat monthly fee per trade, per metro.</strong> Not per lead, so a busy month
          never costs you more.
        </li>
        <li>
          <strong>Leads go to one contractor.</strong> Never sold to several companies at once.
        </li>
        <li>
          <strong>The list is capped.</strong> When it&apos;s full, it&apos;s full — that&apos;s the
          whole point.
        </li>
        <li>
          <strong>Earl checks you out first.</strong> License, insurance, and a look at your work.
        </li>
      </ul>

      <h2>Your details</h2>
      {error === 'missing' && (
        <p style={{ color: '#b3261e' }}>
          Please add your business name, a phone number and an email.
        </p>
      )}

      <form action={submitApplication}>
        <input type="hidden" name="placeSlug" value={placeSlug ?? ''} />
        <input type="hidden" name="serviceSlug" value={serviceSlug ?? ''} />

        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '34rem' }}>
          <label>
            <span className="meta">Trade</span>
            <select name="serviceId" defaultValue={presetService?.id ?? ''} style={field} required>
              <option value="">Choose a trade…</option>
              {services.docs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="meta">Where you work</span>
            <select name="marketId" defaultValue={presetMarketId ?? ''} style={field} required>
              <option value="">Choose a metro…</option>
              {markets.docs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}, {m.state}
                </option>
              ))}
            </select>
          </label>

          <input name="businessName" placeholder="Business name" required style={field} />
          <input name="contactName" placeholder="Your name" style={field} />
          <input name="phone" placeholder="Phone" required style={field} />
          <input name="email" type="email" placeholder="Email" required style={field} />
          <input name="website" placeholder="Website (optional)" style={field} />
          <input name="licenseNumber" placeholder="License number" style={field} />
          <input
            name="yearsInBusiness"
            type="number"
            min="0"
            placeholder="Years in the trade"
            style={field}
          />
          <textarea
            name="message"
            rows={4}
            placeholder="Anything Earl should know — the work you do, who you'd rather not compete with, how busy you are."
            style={field}
          />

          <button type="submit" style={button}>
            Send it to Earl
          </button>
        </div>
      </form>
    </div>
  )
}
