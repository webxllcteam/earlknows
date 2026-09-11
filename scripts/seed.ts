import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const upsert = async (collection: 'services' | 'cities', slug: string, data: object) => {
  const existing = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
  if (existing.docs[0]) return existing.docs[0]
  // @ts-expect-error — data shape is validated by Payload at runtime
  return payload.create({ collection, data })
}

const service = await upsert('services', 'roofing', {
  name: 'Roofing',
  slug: 'roofing',
  shortDescription: 'Tear-offs, re-roofs, storm damage and repairs.',
  sortOrder: 10,
  active: true,
})

const city = await upsert('cities', 'boise', {
  name: 'Boise',
  slug: 'boise',
  state: 'ID',
  county: 'Ada County',
  active: true,
})

const existingTerritory = await payload.find({
  collection: 'territories',
  where: { and: [{ service: { equals: service.id } }, { city: { equals: city.id } }] },
  limit: 1,
})

if (!existingTerritory.docs[0]) {
  await payload.create({
    collection: 'territories',
    data: {
      service: service.id,
      city: city.id,
      status: 'live',
      maxProviders: 3,
      priceLow: 9000,
      priceHigh: 28000,
    },
  })
  console.log('seeded territory: Roofing — Boise, ID (cap 3)')
} else {
  console.log('territory already exists')
}

console.log('done')
process.exit(0)
