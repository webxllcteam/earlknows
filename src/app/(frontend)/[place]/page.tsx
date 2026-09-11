import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { payloadClient, SITE_NAME, SITE_URL } from '@/lib/payload'
import { citiesInMarket, resolvePlace } from '@/lib/places'

export const revalidate = 3600

type Params = { place: string }

export async function generateStaticParams() {
  const payload = await payloadClient()
  const [cities, markets] = await Promise.all([
    payload.find({ collection: 'cities', where: { active: { equals: true } }, limit: 500 }),
    payload.find({ collection: 'markets', where: { active: { equals: true } }, limit: 200 }),
  ])
  return [
    ...cities.docs.map((c) => ({ place: String(c.slug) })),
    ...markets.docs.map((m) => ({ place: String(m.slug) })),
  ]
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { place: slug } = await params
  const place = await resolvePlace(slug)
  if (!place) return {}

  const where = place.kind === 'city' ? `${place.name}, ${place.state}` : `the ${place.name}`

  return {
    title: `Vetted contractors in ${where}`,
    description: `Earl keeps a short list of contractors in ${where}. One trade at a time, capped on purpose — never a form sold to eight companies.`,
    alternates: { canonical: `/${slug}` },
  }
}

export default async function PlacePage({ params }: { params: Promise<Params> }) {
  const { place: slug } = await params
  const place = await resolvePlace(slug)
  if (!place) notFound()

  const payload = await payloadClient()

  // A city shows its own listings. A market shows the trades it has live pages for.
  const trades: { slug: string; name: string; note: string }[] = []

  if (place.kind === 'city') {
    const listings = await payload.find({
      collection: 'listings',
      where: { and: [{ city: { equals: place.id } }, { status: { equals: 'live' } }] },
      depth: 2,
      limit: 200,
    })
    for (const l of listings.docs) {
      const service = l.service as { slug?: string; name?: string }
      if (!service?.slug) continue
      const panel = Array.isArray(l.providers) ? l.providers.length : 0
      trades.push({
        slug: service.slug,
        name: String(service.name),
        note:
          panel === 0
            ? 'Earl is still vetting'
            : `${panel} vetted ${panel === 1 ? 'contractor' : 'contractors'}`,
      })
    }
  } else {
    const pages = await payload.find({
      collection: 'market-pages',
      where: { and: [{ market: { equals: place.id } }, { status: { equals: 'live' } }] },
      depth: 1,
      limit: 200,
    })
    for (const p of pages.docs) {
      const service = p.service as { slug?: string; name?: string }
      if (!service?.slug) continue
      trades.push({
        slug: service.slug,
        name: String(service.name),
        note: 'Across the whole valley',
      })
    }
  }

  const towns = place.kind === 'market' ? await citiesInMarket(place.id) : []

  const heading =
    place.kind === 'city'
      ? `Contractors in ${place.name}, ${place.state}`
      : `Contractors across the ${place.name}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: place.name, item: `${SITE_URL}/${slug}` },
    ],
  }

  return (
    <div className="wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="crumbs">
        <Link href="/">{SITE_NAME}</Link> / {place.name}
      </nav>

      <section className="hero">
        <h1>{heading}</h1>
        <p className="lede">
          {place.kind === 'city'
            ? `Earl vets a small number of contractors in ${place.name}${place.county ? ` and the rest of ${place.county}` : ''}, and recommends only those. Pick a trade.`
            : `Everyone Earl recommends across the ${place.name}. Pick a trade, or jump straight to your town.`}
        </p>
      </section>

      {trades.length > 0 ? (
        <section>
          <h2>Trades</h2>
          <ul className="grid">
            {trades.map((t) => (
              <li key={t.slug}>
                <Link className="card" href={`/${slug}/${t.slug}`}>
                  <span className="card-title">{t.name}</span>
                  <span className="card-note">{t.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p>Earl is still lining people up here. Check back shortly.</p>
      )}

      {towns.length > 0 && (
        <section>
          <h2>Towns in the {place.name}</h2>
          <ul className="grid">
            {towns.map((t) => (
              <li key={t.id}>
                <Link className="card" href={`/${t.slug}`}>
                  <span className="card-title">
                    {t.name}, {t.state}
                  </span>
                  {t.county && <span className="card-note">{t.county}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
