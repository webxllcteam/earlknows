import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { payloadClient, SITE_NAME, SITE_URL } from '@/lib/payload'

export const revalidate = 3600

type Params = { slug: string }

export async function generateStaticParams() {
  const payload = await payloadClient()
  const providers = await payload.find({
    collection: 'providers',
    where: { status: { equals: 'active' } },
    limit: 1000,
  })
  return providers.docs
    .filter((p) => typeof p.slug === 'string' && p.slug.length > 0)
    .map((p) => ({ slug: String(p.slug) }))
}

async function getProvider(slug: string) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'providers',
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'active' } }] },
    depth: 1,
    limit: 1,
  })
  return res.docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const provider = await getProvider(slug)
  if (!provider) return {}

  const where = provider.address?.city
    ? ` in ${provider.address.city}, ${provider.address.state ?? ''}`.trimEnd()
    : ''

  return {
    title: provider.businessName,
    description: `${provider.businessName}${where} — vetted by Earl. ${provider.yearsInBusiness ? `${provider.yearsInBusiness} years in the trade. ` : ''}Contact them directly.`,
    alternates: { canonical: `/pros/${slug}` },
  }
}

export default async function ProviderPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const provider = await getProvider(slug)
  if (!provider) notFound()

  const payload = await payloadClient()
  const territories = await payload.find({
    collection: 'territories',
    where: { providers: { contains: provider.id } },
    depth: 2,
    limit: 100,
  })

  const addr = (provider.address ?? {}) as Record<string, string>

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/pros/${slug}`,
    name: provider.businessName,
    ...(provider.phone ? { telephone: provider.phone } : {}),
    ...(provider.email ? { email: provider.email } : {}),
    ...(provider.website ? { url: provider.website } : {}),
    ...(addr.street || addr.city
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(addr.street ? { streetAddress: addr.street } : {}),
            ...(addr.city ? { addressLocality: addr.city } : {}),
            ...(addr.state ? { addressRegion: addr.state } : {}),
            ...(addr.zip ? { postalCode: addr.zip } : {}),
            addressCountry: 'US',
          },
        }
      : {}),
  }

  return (
    <div className="wrap narrow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="crumbs">
        <Link href="/">{SITE_NAME}</Link> / {provider.businessName}
      </nav>

      <section className="hero">
        <span className="vetted">Vetted by Earl</span>
        <h1>{provider.businessName}</h1>
        <p className="lede">
          {provider.phone}
          {provider.yearsInBusiness ? ` · ${provider.yearsInBusiness} years in the trade` : ''}
          {provider.licenseNumber ? ` · License ${provider.licenseNumber}` : ''}
        </p>
      </section>

      {provider.bio ? <RichText data={provider.bio as never} /> : null}

      {(addr.street || addr.city) && (
        <>
          <h2>Where they are</h2>
          <p className="meta">
            {addr.street && (
              <>
                {addr.street}
                <br />
              </>
            )}
            {[addr.city, addr.state].filter(Boolean).join(', ')} {addr.zip}
          </p>
        </>
      )}

      {territories.docs.length > 0 && (
        <>
          <h2>Where Earl recommends them</h2>
          <ul className="grid">
            {territories.docs.map((t) => {
              const service = t.service as { slug?: string; name?: string }
              const city = t.city as { slug?: string; name?: string; state?: string }
              if (!service?.slug || !city?.slug) return null
              return (
                <li key={t.id}>
                  <Link className="card" href={`/${service.slug}/${city.slug}`}>
                    <span className="card-title">{service.name}</span>
                    <span className="card-note">
                      {city.name}, {city.state}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {provider.website && (
        <>
          <h2>Their own site</h2>
          <p>
            <a href={provider.website} rel="nofollow noopener" target="_blank">
              {provider.website}
            </a>
          </p>
        </>
      )}
    </div>
  )
}
