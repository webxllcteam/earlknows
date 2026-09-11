import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const findBySlug = async (collection: 'services' | 'markets' | 'cities', slug: string) => {
  const r = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
  return r.docs[0]
}

// --- admin user (dev only; change the password after logging in) ------------
const users = await payload.find({ collection: 'users', limit: 1 })
if (users.totalDocs === 0) {
  await payload.create({
    collection: 'users',
    data: {
      email: 'webxllcteam@gmail.com',
      password: 'ChangeMe!earl2026',
      name: 'Mike Hermansen',
    },
  })
  console.log('created admin: webxllcteam@gmail.com / ChangeMe!earl2026  (change this)')
}

// --- market ----------------------------------------------------------------
let market = await findBySlug('markets', 'treasure-valley')
if (!market) {
  market = await payload.create({
    collection: 'markets',
    data: {
      name: 'Treasure Valley',
      slug: 'treasure-valley',
      state: 'ID',
      notes: 'Ada and Canyon counties. One panel covers the whole valley.',
      active: true,
    },
  })
  console.log('created market: Treasure Valley')
}

// --- cities in that market -------------------------------------------------
const towns = [
  { name: 'Boise', slug: 'boise', county: 'Ada County' },
  { name: 'Meridian', slug: 'meridian', county: 'Ada County' },
  { name: 'Nampa', slug: 'nampa', county: 'Canyon County' },
  { name: 'Eagle', slug: 'eagle', county: 'Ada County' },
]

for (const t of towns) {
  if (!(await findBySlug('cities', t.slug))) {
    await payload.create({
      collection: 'cities',
      data: { ...t, state: 'ID', market: market.id, active: t.slug === 'boise' },
    })
    console.log(`created city: ${t.name}${t.slug === 'boise' ? '' : ' (inactive — no content yet)'}`)
  }
}

// --- service ---------------------------------------------------------------
let service = await findBySlug('services', 'roofing')
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
  console.log('created service: Roofing')
}

// --- territory -------------------------------------------------------------
const existing = await payload.find({
  collection: 'territories',
  where: { and: [{ service: { equals: service.id } }, { market: { equals: market.id } }] },
  limit: 1,
})

if (!existing.docs[0]) {
  await payload.create({
    collection: 'territories',
    data: {
      service: service.id,
      market: market.id,
      status: 'live',
      maxProviders: 3,
      priceLow: 9000,
      priceHigh: 28000,
    },
  })
  console.log('created territory: Roofing — Treasure Valley, ID (cap 3)')
}

console.log('seed complete')
process.exit(0)
