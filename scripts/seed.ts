import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const bySlug = async (collection: 'services' | 'markets' | 'cities', slug: string) => {
  const r = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
  return r.docs[0]
}

// --- admin -----------------------------------------------------------------
if ((await payload.find({ collection: 'users', limit: 1 })).totalDocs === 0) {
  await payload.create({
    collection: 'users',
    data: {
      email: 'webxllcteam@gmail.com',
      password: 'earlknows2026',
      name: 'Mike Hermansen',
    },
  })
  console.log('admin: webxllcteam@gmail.com / earlknows2026')
}

// --- market ----------------------------------------------------------------
let market = await bySlug('markets', 'treasure-valley')
if (!market) {
  market = await payload.create({
    collection: 'markets',
    data: {
      name: 'Treasure Valley',
      slug: 'treasure-valley',
      state: 'ID',
      notes: 'Ada and Canyon counties. Groups the towns; not billed.',
      active: true,
    },
  })
  console.log('market: Treasure Valley')
}

// --- cities ----------------------------------------------------------------
const towns = [
  { name: 'Boise', slug: 'boise', county: 'Ada County', active: true },
  { name: 'Meridian', slug: 'meridian', county: 'Ada County', active: false },
  { name: 'Nampa', slug: 'nampa', county: 'Canyon County', active: false },
  { name: 'Eagle', slug: 'eagle', county: 'Ada County', active: false },
]

const cityIds: Record<string, number> = {}
for (const t of towns) {
  const existing = await bySlug('cities', t.slug)
  if (existing) {
    cityIds[t.slug] = existing.id
    continue
  }
  const created = await payload.create({
    collection: 'cities',
    data: { ...t, state: 'ID', market: market.id },
  })
  cityIds[t.slug] = created.id
  console.log(`city: ${t.name}${t.active ? '' : ' (inactive)'}`)
}

// --- service ---------------------------------------------------------------
let service = await bySlug('services', 'roofing')
if (!service) {
  service = await payload.create({
    collection: 'services',
    data: {
      name: 'Roofing',
      slug: 'roofing',
      shortDescription: 'Tear-offs, re-roofs, storm damage and repairs.',
      sortOrder: 10,
      active: true,
    },
  })
  console.log('service: Roofing')
}

// --- listing (billable: service x city) ------------------------------------
const existingListing = await payload.find({
  collection: 'listings',
  where: {
    and: [{ service: { equals: service.id } }, { city: { equals: cityIds.boise } }],
  },
  limit: 1,
})

if (!existingListing.docs[0]) {
  await payload.create({
    collection: 'listings',
    data: {
      service: service.id,
      city: cityIds.boise,
      status: 'live',
      maxProviders: 3,
      priceLow: 9000,
      priceHigh: 28000,
    },
  })
  console.log('listing: Roofing — Boise, ID (cap 3)')
}

// --- market page (draft: only one city live, so it would duplicate) ---------
const existingMarketPage = await payload.find({
  collection: 'market-pages',
  where: { and: [{ service: { equals: service.id } }, { market: { equals: market.id } }] },
  limit: 1,
})

if (!existingMarketPage.docs[0]) {
  await payload.create({
    collection: 'market-pages',
    data: { service: service.id, market: market.id, status: 'draft' },
  })
  console.log('market page: Roofing — Treasure Valley (draft — needs 2+ live cities)')
}

console.log('seed complete')
process.exit(0)
