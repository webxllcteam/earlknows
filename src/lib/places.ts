import { payloadClient } from '@/lib/payload'

export type Place =
  | { kind: 'city'; id: number; name: string; slug: string; state: string; county?: string | null; marketId: number | null }
  | { kind: 'market'; id: number; name: string; slug: string; state: string }

/**
 * A place is a city or a market. Both are things people search for, so both get
 * /[place]/[service] pages. Cities are billable; markets aggregate their cities.
 */
export async function resolvePlace(slug: string): Promise<Place | null> {
  const payload = await payloadClient()

  const cities = await payload.find({
    collection: 'cities',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
    depth: 1,
  })
  const city = cities.docs[0]
  if (city) {
    return {
      kind: 'city',
      id: city.id,
      name: city.name,
      slug: String(city.slug),
      state: city.state,
      county: city.county,
      marketId: typeof city.market === 'object' ? (city.market?.id ?? null) : (city.market ?? null),
    }
  }

  const markets = await payload.find({
    collection: 'markets',
    where: { and: [{ slug: { equals: slug } }, { active: { equals: true } }] },
    limit: 1,
  })
  const market = markets.docs[0]
  if (market) {
    return {
      kind: 'market',
      id: market.id,
      name: market.name,
      slug: String(market.slug),
      state: market.state,
    }
  }

  return null
}

/** Cities that belong to a market and are live. */
export async function citiesInMarket(marketId: number) {
  const payload = await payloadClient()
  const res = await payload.find({
    collection: 'cities',
    where: { and: [{ market: { equals: marketId } }, { active: { equals: true } }] },
    limit: 500,
    depth: 0,
  })
  return res.docs
}
