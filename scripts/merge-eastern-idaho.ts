import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const bySlug = async (slug: string) =>
  (await payload.find({ collection: 'markets', where: { slug: { equals: slug } }, limit: 1 }))
    .docs[0]

const eastern = await bySlug('eastern-idaho')
const pocatello = await bySlug('pocatello-region')

if (!eastern || !pocatello) {
  console.log('nothing to merge')
  process.exit(0)
}

const cities = await payload.find({
  collection: 'cities',
  where: { market: { equals: pocatello.id } },
  limit: 200,
  depth: 0,
})

for (const c of cities.docs) {
  await payload.update({
    collection: 'cities',
    id: c.id,
    data: { market: eastern.id },
  })
  console.log(`moved ${c.name} -> Eastern Idaho`)
}

// Any listings on the old market move too, rather than being orphaned.
const listings = await payload.find({
  collection: 'listings',
  where: { market: { equals: pocatello.id } },
  limit: 200,
  depth: 0,
})
for (const l of listings.docs) {
  await payload.update({ collection: 'listings', id: l.id, data: { market: eastern.id } })
  console.log(`moved listing ${l.label}`)
}

await payload.update({
  collection: 'markets',
  id: eastern.id,
  data: {
    notes:
      'Idaho Falls and Pocatello together, plus Rexburg and Blackfoot. Census MSAs split these into two, but contractors routinely cover the whole corridor — confirmed by local knowledge, not data.',
  },
})

await payload.delete({ collection: 'markets', id: pocatello.id })
console.log('\ndeleted Pocatello Region; merged into Eastern Idaho')
process.exit(0)
