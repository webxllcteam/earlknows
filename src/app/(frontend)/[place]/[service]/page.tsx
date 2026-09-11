import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { payloadClient, SITE_NAME, SITE_URL, safeStaticParams } from '@/lib/payload'
import { citiesInMarket, resolvePlace, type Place } from '@/lib/places'
import { LeadForm } from './LeadForm'

// This page reads searchParams for the lead form's sent/error state, which is
// incompatible with ISR caching (DYNAMIC_SERVER_USAGE). Rendered per request
// instead; Cloudflare caches it at the edge.
// TODO: move form state into useActionState so this can go back to ISR.
export const dynamic = 'force-dynamic'

type Params = { place: string; service: string }
type Search = { sent?: string; error?: string }

type ProviderDoc = {
  id: number
  businessName: string
  slug?: string | null
  phone?: string | null
  website?: string | null
  yearsInBusiness?: number | null
  licenseNumber?: string | null
  bio?: unknown
  address?: Record<string, string> | null
  subServices?: unknown
}

type Faq = { question: string; answer: string }

/** Deterministic daily rotation — stable within a day so static output stays valid. */
function rotateDaily<T>(items: T[]): T[] {
  if (items.length < 2) return items
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  const offset = dayOfYear % items.length
  return [...items.slice(offset), ...items.slice(0, offset)]
}

const toProviders = (v: unknown): ProviderDoc[] =>
  (Array.isArray(v) ? v : []).filter(
    (p): p is ProviderDoc => typeof p === 'object' && p !== null && 'businessName' in p,
  )

export async function generateStaticParams() {
  return safeStaticParams(async () => {
  const payload = await payloadClient()
  const [listings, cityPages] = await Promise.all([
    payload.find({
      collection: 'listings',
      where: { status: { equals: 'live' } },
      depth: 1,
      limit: 1000,
    }),
    payload.find({
      collection: 'city-pages',
      where: { status: { equals: 'live' } },
      depth: 1,
      limit: 2000,
    }),
  ])

  const params: { place: string; service: string }[] = []

  for (const l of listings.docs) {
    const service = l.service as { slug?: string }
    const market = l.market as { slug?: string; active?: boolean }
    if (service?.slug && market?.slug && market.active !== false) {
      params.push({ place: market.slug, service: service.slug })
    }
  }
  for (const p of cityPages.docs) {
    const service = p.service as { slug?: string }
    const city = p.city as { slug?: string; active?: boolean }
    if (service?.slug && city?.slug && city.active !== false) {
      params.push({ place: city.slug, service: service.slug })
    }
  }
  return params
  })
}

/** Everything a page needs, whether it's a city listing or a market aggregate. */
async function getPageData(placeSlug: string, serviceSlug: string) {
  const payload = await payloadClient()

  const place = await resolvePlace(placeSlug)
  if (!place) return null

  const services = await payload.find({
    collection: 'services',
    where: { slug: { equals: serviceSlug } },
    limit: 1,
  })
  const service = services.docs[0]
  if (!service) return null

  // Billing sits on the category. A sub-service page inherits its parent's
  // panel, then keeps only the providers who declared they do this work.
  const parentId =
    typeof service.parent === 'object' ? service.parent?.id : (service.parent as number | undefined)
  const billingServiceId = parentId ?? service.id
  const isSubService = Boolean(parentId)

  const forThisService = (list: ProviderDoc[]) => {
    if (!isSubService) return list
    return list.filter((p) => {
      const subs = (p as { subServices?: unknown }).subServices
      if (!Array.isArray(subs)) return false
      return subs.some((x) => (typeof x === 'object' && x ? (x as { id: number }).id : x) === service.id)
    })
  }

  if (place.kind === 'market') {
    const res = await payload.find({
      collection: 'listings',
      where: {
        and: [
          { service: { equals: billingServiceId } },
          { market: { equals: place.id } },
          { status: { equals: 'live' } },
        ],
      },
      depth: 2,
      limit: 1,
    })
    const listing = res.docs[0]
    if (!listing) return null

    return {
      place,
      service,
      providers: forThisService(toProviders(listing.providers)),
      maxProviders: listing.maxProviders ?? 3,
      content: {
        metaTitle: listing.metaTitle,
        metaDescription: listing.metaDescription,
        intro: listing.intro,
        localNotes: listing.localNotes,
        priceLow: listing.priceLow,
        priceHigh: listing.priceHigh,
        faqs: (Array.isArray(listing.faqs) ? listing.faqs : []) as Faq[],
      },
      billable: true as const,
    }
  }

  // City page: its own words, but the panel comes from its market's listing.
  if (!place.marketId) return null

  const [pages, listings] = await Promise.all([
    payload.find({
      collection: 'city-pages',
      where: {
        and: [
          { service: { equals: service.id } },
          { city: { equals: place.id } },
          { status: { equals: 'live' } },
        ],
      },
      depth: 1,
      limit: 1,
    }),
    payload.find({
      collection: 'listings',
      where: {
        and: [
          { service: { equals: billingServiceId } },
          { market: { equals: place.marketId } },
          { status: { equals: 'live' } },
        ],
      },
      depth: 2,
      limit: 1,
    }),
  ])

  const cityPage = pages.docs[0]
  if (!cityPage) return null

  const listing = listings.docs[0]

  return {
    place,
    service,
    providers: forThisService(toProviders(listing?.providers)),
    maxProviders: listing?.maxProviders ?? 3,
    content: {
      metaTitle: cityPage.metaTitle,
      metaDescription: cityPage.metaDescription,
      intro: cityPage.intro,
      localNotes: cityPage.localNotes,
      priceLow: cityPage.priceLow,
      priceHigh: cityPage.priceHigh,
      faqs: (Array.isArray(cityPage.faqs) ? cityPage.faqs : []) as Faq[],
    },
    billable: false as const,
  }
}

const placeLabel = (place: Place) =>
  place.kind === 'city' ? `${place.name}, ${place.state}` : `the ${place.name}`

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { place: placeSlug, service: serviceSlug } = await params
  const data = await getPageData(placeSlug, serviceSlug)
  if (!data) return {}

  const { place, service, content } = data
  const title = content.metaTitle || `${service.name} in ${placeLabel(place)}`
  const description =
    content.metaDescription ||
    `Vetted ${String(service.name).toLowerCase()} contractors in ${placeLabel(place)}. Earl recommends a short list — never eight companies at once.`

  return {
    title,
    description,
    alternates: { canonical: `/${placeSlug}/${serviceSlug}` },
    openGraph: { title, description, type: 'website' },
  }
}

export default async function ServicePlacePage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<Search>
}) {
  const { place: placeSlug, service: serviceSlug } = await params
  const { sent, error } = await searchParams

  const data = await getPageData(placeSlug, serviceSlug)
  if (!data) notFound()

  const { place, service, content, billable, maxProviders } = data
  const providers = rotateDaily(data.providers)
  const serviceLower = String(service.name).toLowerCase()
  const pageUrl = `${SITE_URL}/${placeSlug}/${serviceSlug}`

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: place.name, item: `${SITE_URL}/${placeSlug}` },
        { '@type': 'ListItem', position: 3, name: service.name, item: pageUrl },
      ],
    },
    {
      '@type': 'Service',
      name: `${service.name} in ${placeLabel(place)}`,
      serviceType: service.name,
      areaServed: {
        '@type': place.kind === 'city' ? 'City' : 'AdministrativeArea',
        name: place.name,
        address: { '@type': 'PostalAddress', addressRegion: place.state, addressCountry: 'US' },
      },
      ...(content.priceLow && content.priceHigh
        ? {
            offers: {
              '@type': 'AggregateOffer',
              priceCurrency: 'USD',
              lowPrice: content.priceLow,
              highPrice: content.priceHigh,
            },
          }
        : {}),
    },
  ]

  if (providers.length > 0) {
    graph.push({
      '@type': 'ItemList',
      name: `Vetted ${serviceLower} contractors in ${place.name}`,
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
          areaServed: { '@type': 'City', name: place.name },
        },
      })),
    })
  }

  if (content.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: content.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    })
  }

  const panelFull = billable && providers.length >= maxProviders

  return (
    <div className="wrap narrow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
        }}
      />

      <nav className="crumbs">
        <Link href="/">{SITE_NAME}</Link> / <Link href={`/${placeSlug}`}>{place.name}</Link> /{' '}
        {service.name}
      </nav>

      <section className="hero">
        <h1>
          {service.name} in {placeLabel(place)}
        </h1>
        <p className="lede">
          {providers.length > 0
            ? `Earl vets ${serviceLower} contractors here and recommends ${providers.length === 1 ? 'one' : `these ${providers.length}`}. Not eight companies who all call you at dinner.`
            : `Earl is still vetting ${serviceLower} contractors here. Leave your details and he'll be in touch when there's someone worth recommending.`}
        </p>
      </section>

      {content.intro ? <RichText data={content.intro as never} /> : null}

      {providers.length > 0 && (
        <>
          <h2>
            Earl&apos;s {serviceLower} contractors in {place.name}
          </h2>
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

      {content.priceLow && content.priceHigh ? (
        <>
          <h2>What it usually costs</h2>
          <p>
            Most {serviceLower} jobs in {place.name} land between{' '}
            <strong>${content.priceLow.toLocaleString()}</strong> and{' '}
            <strong>${content.priceHigh.toLocaleString()}</strong>, depending on scope.
          </p>
        </>
      ) : null}

      {content.localNotes ? (
        <>
          <h2>What matters locally</h2>
          <RichText data={content.localNotes as never} />
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
          placeSlug={placeSlug}
          serviceSlug={serviceSlug}
          serviceId={service.id}
          cityId={place.kind === 'city' ? place.id : undefined}
          providerIds={data.providers.map((p) => p.id)}
          error={error}
        />
      )}

      {content.faqs.length > 0 && (
        <>
          <h2>Questions people ask</h2>
          {content.faqs.map((f, i) => (
            <div className="faq" key={i}>
              <h3>{f.question}</h3>
              <p>{f.answer}</p>
            </div>
          ))}
        </>
      )}

      {billable && (
        <>
          <h2>
            Are you a {serviceLower} contractor in {place.name}?
          </h2>
          <p>
            {panelFull
              ? `Earl's list here is full right now — he caps it deliberately so the contractors on it actually get work. Put your name down and he'll come back to you when a slot opens.`
              : `Earl is taking applications in ${place.name}. He lists a small number on purpose.`}{' '}
            <Link href={`/apply?place=${placeSlug}&service=${serviceSlug}`}>
              {panelFull ? 'Join the waitlist' : 'Apply to be listed'}
            </Link>
            .
          </p>
        </>
      )}
    </div>
  )
}
