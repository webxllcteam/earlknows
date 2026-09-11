import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { payloadClient, SITE_NAME, SITE_URL } from '@/lib/payload'

export const revalidate = 3600

type Params = { city: string }

export async function generateStaticParams() {
  const payload = await payloadClient()
  const cities = await payload.find({
    collection: 'cities',
    where: { active: { equals: true } },
    limit: 500,
  })
  return cities.docs.map((c) => ({ city: String(c.slug) }))
}

async function getCity(slug: string) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'cities',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city: citySlug } = await params
  const city = await getCity(citySlug)
  if (!city) return {}

  return {
    title: `Vetted contractors in ${city.name}, ${city.state}`,
    description: `Earl keeps a short list of contractors in ${city.name}. One trade at a time, capped on purpose — never a form sold to eight companies.`,
    alternates: { canonical: `/${citySlug}` },
  }
}

export default async function CityPage({ params }: { params: Promise<Params> }) {
  const { city: citySlug } = await params
  const city = await getCity(citySlug)
  if (!city) notFound()

  const payload = await payloadClient()
  const marketId = typeof city.market === 'object' ? city.market?.id : city.market

  const territories = marketId
    ? await payload.find({
        collection: 'territories',
        where: { and: [{ market: { equals: marketId } }, { status: { equals: 'live' } }] },
        depth: 2,
        limit: 200,
      })
    : { docs: [] as Awaited<ReturnType<typeof payload.find>>['docs'] }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: city.name, item: `${SITE_URL}/${citySlug}` },
    ],
  }

  return (
    <div className="wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="crumbs">
        <Link href="/">{SITE_NAME}</Link> / {city.name}
      </nav>

      <section className="hero">
        <h1>
          Contractors in {city.name}, {city.state}
        </h1>
        <p className="lede">
          Earl vets a small number of contractors in {city.name}
          {city.county ? ` and the rest of ${city.county}` : ''}, and recommends only those. Pick a
          trade.
        </p>
      </section>

      {territories.docs.length > 0 ? (
        <section>
          <h2>Trades</h2>
          <ul className="grid">
            {territories.docs.map((t) => {
              const service = t.service as { slug?: string; name?: string }
              if (!service?.slug) return null
              const panel = Array.isArray(t.providers) ? t.providers.length : 0
              return (
                <li key={t.id}>
                  <Link className="card" href={`/${citySlug}/${service.slug}`}>
                    <span className="card-title">{service.name}</span>
                    <span className="card-note">
                      {panel === 0
                        ? 'Earl is still vetting'
                        : `${panel} vetted ${panel === 1 ? 'contractor' : 'contractors'}`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <p>Earl is still lining people up in {city.name}. Check back shortly.</p>
      )}
    </div>
  )
}
