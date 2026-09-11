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

// --- Idaho geography lives in scripts/seed-idaho.ts ------------------------
const tv = (await payload.find({
  collection: 'markets',
  where: { slug: { equals: 'treasure-valley' } },
  limit: 1,
})).docs[0]

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

// --- listing (billable: service x market) ----------------------------------
if (tv) {
  const existing = await payload.find({
    collection: 'listings',
    where: { and: [{ service: { equals: service.id } }, { market: { equals: tv.id } }] },
    limit: 1,
  })
  if (!existing.docs[0]) {
    await payload.create({
      collection: 'listings',
      data: {
        service: service.id,
        market: tv.id,
        status: 'live',
        maxProviders: 3,
        monthlyRate: 299,
        priceLow: 9000,
        priceHigh: 28000,
      },
    })
    console.log('listing: Roofing — Treasure Valley (cap 3, $299/mo)')
  }
} else {
  console.log('no Treasure Valley market — run seed-idaho.ts first')
}

console.log('seed complete')
process.exit(0)
