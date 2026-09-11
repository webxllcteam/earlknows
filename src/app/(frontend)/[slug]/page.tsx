import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { payloadClient } from '@/lib/payload'

export const revalidate = 3600

type Params = { slug: string }

export async function generateStaticParams() {
  const payload = await payloadClient()
  const [services, cities] = await Promise.all([
    payload.find({ collection: 'services', where: { active: { equals: true } }, limit: 200 }),
    payload.find({ collection: 'cities', where: { active: { equals: true } }, limit: 200 }),
  ])
  return [
    ...services.docs.map((s) => ({ slug: String(s.slug) })),
    ...cities.docs.map((c) => ({ slug: String(c.slug) })),
  ]
}

async function resolve(slug: string) {
  const payload = await payloadClient()
  const service = await payload.find({
    collection: 'services',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (service.docs[0]) return { kind: 'service' as const, doc: service.docs[0] }

  const city = await payload.find({
    collection: 'cities',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (city.docs[0]) return { kind: 'city' as const, doc: city.docs[0] }

  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const found = await resolve(slug)
  if (!found) return {}

  if (found.kind === 'service') {
    return {
      title: `${found.doc.name} contractors`,
      description:
        found.doc.shortDescription ||
        `Find a vetted ${String(found.doc.name).toLowerCase()} contractor. One per city, no shared leads.`,
      alternates: { canonical: `/${slug}` },
    }
  }
  return {
    title: `Contractors in ${found.doc.name}, ${found.doc.state}`,
    description: `Vetted contractors in ${found.doc.name}, ${found.doc.state}. One per trade — Earl only recommends people he'd use.`,
    alternates: { canonical: `/${slug}` },
  }
}

export default async function HubPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const found = await resolve(slug)
  if (!found) notFound()

  const payload = await payloadClient()

  const territories = await payload.find({
    collection: 'territories',
    where:
      found.kind === 'service'
        ? { service: { equals: found.doc.id } }
        : { city: { equals: found.doc.id } },
    depth: 1,
    limit: 200,
  })

  const isService = found.kind === 'service'
  const heading = isService
    ? `${found.doc.name} contractors`
    : `Contractors in ${found.doc.name}, ${(found.doc as { state?: string }).state}`

  return (
    <div className="wrap">
      <nav className="crumbs">
        <Link href="/">Earl Knows</Link> / {found.doc.name}
      </nav>

      <section className="hero">
        <h1>{heading}</h1>
        <p className="lede">
          {isService
            ? `Earl recommends one ${String(found.doc.name).toLowerCase()} contractor per city. Pick your market.`
            : `One vetted pro per trade in ${found.doc.name}. No shared leads, no call centre.`}
        </p>
      </section>

      {territories.docs.length > 0 ? (
        <section>
          <h2>{isService ? 'Markets' : 'Trades'}</h2>
          <ul className="grid">
            {territories.docs.map((t) => {
              const service = t.service as { slug?: string; name?: string }
              const city = t.city as { slug?: string; name?: string; state?: string }
              if (!service?.slug || !city?.slug) return null
              return (
                <li key={t.id}>
                  <Link className="card" href={`/${service.slug}/${city.slug}`}>
                    <span className="card-title">
                      {isService ? `${city.name}, ${city.state}` : service.name}
                    </span>
                    <span className="card-note">
                      {t.status === 'assigned' ? 'Vetted pro listed' : 'Accepting applications'}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <p>Earl is still lining people up here. Check back shortly.</p>
      )}
    </div>
  )
}
