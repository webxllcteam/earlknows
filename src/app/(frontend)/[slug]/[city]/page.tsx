import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { payloadClient, SITE_NAME, SITE_URL } from '@/lib/payload'
import { LeadForm } from './LeadForm'

export const revalidate = 3600

type Params = { slug: string; city: string }
type Search = { sent?: string; error?: string }

type ProviderDoc = {
  id: number
  businessName: string
  slug?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  yearsInBusiness?: number | null
  licenseNumber?: string | null
  bio?: unknown
  address?: Record<string, string> | null
}

/** Deterministic daily rotation — stable within a day so static output stays valid. */
function rotateDaily<T>(items: T[]): T[] {
  if (items.length < 2) return items
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  const offset = dayOfYear % items.length
  return [...items.slice(offset), ...items.slice(0, offset)]
}

export async function generateStaticParams() {
  const payload = await payloadClient()
  const territories = await payload.find({ collection: 'territories', depth: 1, limit: 1000 })
  return territories.docs
    .map((t) => {
      const service = t.service as { slug?: string }
      const city = t.city as { slug?: string }
      if (!service?.slug || !city?.slug) return null
      return { slug: service.slug, city: city.slug }
    })
    .filter((v): v is { slug: string; city: string } => v !== null)
}

async function getTerritory(serviceSlug: string, citySlug: string) {
  const payload = await payloadClient()
  const [services, cities] = await Promise.all([
    payload.find({ collection: 'services', where: { slug: { equals: serviceSlug } }, limit: 1 }),
    payload.find({ collection: 'cities', where: { slug: { equals: citySlug } }, limit: 1 }),
  ])
  const service = services.docs[0]
  const city = cities.docs[0]
  if (!service || !city) return null

  const territories = await payload.find({
    collection: 'territories',
    where: { and: [{ service: { equals: service.id } }, { city: { equals: city.id } }] },
    depth: 2,
    limit: 1,
  })
  const territory = territories.docs[0]
  if (!territory || territory.status === 'paused') return null

  return { territory, service, city }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, city: citySlug } = await params
  const found = await getTerritory(slug, citySlug)
  if (!found) return {}
  const { territory, service, city } = found

  const title = territory.metaTitle || `${service.name} in ${city.name}, ${city.state}`
  const description =
    territory.metaDescription ||
    `Vetted ${String(service.name).toLowerCase()} contractors in ${city.name}, ${city.state}. Earl recommends a short list — never eight companies at once.`

  return {
    title,
    description,
    alternates: { canonical: `/${slug}/${citySlug}` },
    openGraph: { title, description, type: 'website' },
  }
}

export default async function TerritoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<Search>
}) {
  const { slug, city: citySlug } = await params
  const { sent, error } = await searchParams

  const found = await getTerritory(slug, citySlug)
  if (!found) notFound()

  const { territory, service, city } = found
  const pageUrl = `${SITE_URL}/${slug}/${citySlug}`

  const allProviders = (
    Array.isArray(territory.providers) ? territory.providers : []
  ).filter((p): p is ProviderDoc => typeof p === 'object' && p !== null)
  const providers = rotateDaily(allProviders)
  const faqs = Array.isArray(territory.faqs) ? territory.faqs : []
  const serviceLower = String(service.name).toLowerCase()

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: service.name, item: `${SITE_URL}/${slug}` },
        { '@type': 'ListItem', position: 3, name: city.name, item: pageUrl },
      ],
    },
    {
      '@type': 'Service',
      name: `${service.name} in ${city.name}, ${city.state}`,
      serviceType: service.name,
      areaServed: {
        '@type': 'City',
        name: city.name,
        address: { '@type': 'PostalAddress', addressRegion: city.state, addressCountry: 'US' },
      },
      ...(territory.priceLow && territory.priceHigh
        ? {
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'USD',
              lowPrice: territory.priceLow,
              highPrice: territory.priceHigh,
            },
          }
        : {}),
    },
  ]

  // Panel of businesses: ItemList pointing at each provider's own page, rather
  // than stacking several LocalBusiness nodes on one page.
  if (providers.length > 0) {
    graph.push({
      '@type': 'ItemList',
      name: `Vetted ${serviceLower} contractors in ${city.name}`,
      numberOfItems: providers.length,
      itemListOrder: 'https://schema.org/ItemListUnordered',
      itemListElement: providers.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'LocalBusiness',
          name: p.businessName,
          ...(p.phone ? { telephone: p.phone } : {}),
          ...(p.website ? { url: p.website } : {}),
          ...(p.slug ? { '@id': `${SITE_URL}/pros/${p.slug}` } : {}),
          ...(p.address?.street || p.address?.city
            ? {
                address: {
                  '@type': 'PostalAddress',
                  ...(p.address.street ? { streetAddress: p.address.street } : {}),
                  ...(p.address.city ? { addressLocality: p.address.city } : {}),
                  ...(p.address.state ? { addressRegion: p.address.state } : {}),
                  ...(p.address.zip ? { postalCode: p.address.zip } : {}),
                  addressCountry: 'US',
                },
              }
            : {}),
          areaServed: { '@type': 'City', name: city.name },
        },
      })),
    })
  }

  if (faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
  }

  const panelFull = providers.length >= (territory.maxProviders ?? 3)

  return (
    <div className="wrap narrow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }}
      />

      <nav className="crumbs">
        <Link href="/">{SITE_NAME}</Link> / <Link href={`/${slug}`}>{service.name}</Link> / {city.name}
      </nav>

      <section className="hero">
        <h1>
          {service.name} in {city.name}, {city.state}
        </h1>
        <p className="lede">
          {providers.length > 0
            ? `Earl vets ${serviceLower} contractors here and recommends ${providers.length === 1 ? 'one' : `these ${providers.length}`}. Not eight companies who all call you at dinner.`
            : `Earl is still vetting ${serviceLower} contractors in ${city.name}. Leave your details and he'll be in touch when there's someone worth recommending.`}
        </p>
      </section>

      {territory.intro ? <RichText data={territory.intro as never} /> : null}

      {providers.length > 0 && (
        <>
          <h2>Earl&apos;s {serviceLower} contractors in {city.name}</h2>
          {providers.length > 1 && (
            <p className="meta">
              Listed in rotating order — it changes daily so everyone gets a fair shot. Earl
              doesn&apos;t sell placement.
            </p>
          )}
          {providers.map((p) => (
            <div className="provider" key={p.id}>
              <span className="vetted">Vetted by Earl</span>
              <h3 className="provider-name" style={{ marginTop: 0 }}>
                {p.slug ? <Link href={`/pros/${p.slug}`}>{p.businessName}</Link> : p.businessName}
              </h3>
              <p className="meta">
                {p.phone}
                {p.yearsInBusiness ? ` · ${p.yearsInBusiness} years in the trade` : ''}
                {p.licenseNumber ? ` · License ${p.licenseNumber}` : ''}
              </p>
              {p.bio ? <RichText data={p.bio as never} /> : null}
            </div>
          ))}
        </>
      )}

      {territory.priceLow && territory.priceHigh ? (
        <>
          <h2>What it usually costs</h2>
          <p>
            Most {serviceLower} jobs in {city.name} land between{' '}
            <strong>${territory.priceLow.toLocaleString()}</strong> and{' '}
            <strong>${territory.priceHigh.toLocaleString()}</strong>, depending on scope.
          </p>
        </>
      ) : null}

      {territory.localNotes ? (
        <>
          <h2>What matters locally</h2>
          <RichText data={territory.localNotes as never} />
        </>
      ) : null}

      <h2>Get a quote</h2>
      {sent ? (
        <div className="provider">
          <strong>Got it.</strong>
          <p style={{ margin: '0.4rem 0 0' }}>
            Earl passed your details to one contractor — just one — and they&apos;ll call you
            directly.
          </p>
        </div>
      ) : (
        <LeadForm
          servicePath={slug}
          cityPath={citySlug}
          serviceId={service.id}
          cityId={city.id}
          providerIds={allProviders.map((p) => p.id)}
          error={error}
        />
      )}

      {faqs.length > 0 && (
        <>
          <h2>Questions people ask</h2>
          {faqs.map((f, i) => (
            <div className="faq" key={i}>
              <h3>{f.question}</h3>
              <p>{f.answer}</p>
            </div>
          ))}
        </>
      )}

      <h2>Are you a {serviceLower} contractor in {city.name}?</h2>
      <p>
        {panelFull
          ? `Earl's list here is full right now — he caps it deliberately so the contractors on it actually get work. Put your name down and he'll come back to you when a slot opens.`
          : `Earl is taking applications in ${city.name}. He lists a small number on purpose.`}{' '}
        <Link href={`/apply?service=${slug}&city=${citySlug}`}>
          {panelFull ? 'Join the waitlist' : 'Apply to be listed'}
        </Link>
        .
      </p>
    </div>
  )
}
