import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

/**
 * Idaho, carved into six markets.
 *
 * Follows the state's six MSAs, with two judgement calls:
 *  - Wood River Valley is split out of the Magic Valley. It's technically part
 *    of it, but it's a resort economy with very different price points.
 *  - North Idaho stands alone rather than folding into Spokane (which is how
 *    Craigslist does it) — a Coeur d'Alene contractor is not a Spokane one.
 *  - Idaho Falls and Pocatello are ONE market, not two. The census disagrees;
 *    someone who grew up there does not. Local knowledge beats MSA data for
 *    drawing these — see CLAUDE.md.
 *
 * Every city is seeded INACTIVE except Boise. A city only goes live when it has
 * real local content; publishing them all would be a doorway network.
 */
const MARKETS: {
  name: string
  slug: string
  notes: string
  cities: { name: string; slug: string; county: string }[]
}[] = [
  {
    name: 'Treasure Valley',
    slug: 'treasure-valley',
    notes: 'Boise MSA plus Mountain Home. ~865k people — by far the largest market in Idaho.',
    cities: [
      { name: 'Boise', slug: 'boise', county: 'Ada County' },
      { name: 'Meridian', slug: 'meridian', county: 'Ada County' },
      { name: 'Nampa', slug: 'nampa', county: 'Canyon County' },
      { name: 'Caldwell', slug: 'caldwell', county: 'Canyon County' },
      { name: 'Eagle', slug: 'eagle', county: 'Ada County' },
      { name: 'Kuna', slug: 'kuna', county: 'Ada County' },
      { name: 'Star', slug: 'star', county: 'Ada County' },
      { name: 'Garden City', slug: 'garden-city', county: 'Ada County' },
      { name: 'Middleton', slug: 'middleton', county: 'Canyon County' },
      { name: 'Emmett', slug: 'emmett', county: 'Gem County' },
      { name: 'Mountain Home', slug: 'mountain-home', county: 'Elmore County' },
    ],
  },
  {
    name: 'Magic Valley',
    slug: 'magic-valley',
    notes: 'Twin Falls MSA plus Burley. South-central Idaho, agricultural.',
    cities: [
      { name: 'Twin Falls', slug: 'twin-falls', county: 'Twin Falls County' },
      { name: 'Jerome', slug: 'jerome', county: 'Jerome County' },
      { name: 'Burley', slug: 'burley', county: 'Cassia County' },
      { name: 'Rupert', slug: 'rupert', county: 'Minidoka County' },
      { name: 'Buhl', slug: 'buhl', county: 'Twin Falls County' },
      { name: 'Kimberly', slug: 'kimberly', county: 'Twin Falls County' },
      { name: 'Gooding', slug: 'gooding', county: 'Gooding County' },
      { name: 'Filer', slug: 'filer', county: 'Twin Falls County' },
    ],
  },
  {
    name: 'Wood River Valley',
    slug: 'wood-river-valley',
    notes:
      'Blaine County resort corridor. Small population, very high property values — expect different price points from the rest of the Magic Valley.',
    cities: [
      { name: 'Ketchum', slug: 'ketchum', county: 'Blaine County' },
      { name: 'Sun Valley', slug: 'sun-valley', county: 'Blaine County' },
      { name: 'Hailey', slug: 'hailey', county: 'Blaine County' },
      { name: 'Bellevue', slug: 'bellevue', county: 'Blaine County' },
    ],
  },
  {
    name: 'Eastern Idaho',
    slug: 'eastern-idaho',
    notes:
      'Idaho Falls and Pocatello together, plus Rexburg and Blackfoot. The census splits these into two MSAs; contractors cover the whole corridor. Corrected from local knowledge — MSAs measure commuting for employment, not service radius.',
    cities: [
      { name: 'Idaho Falls', slug: 'idaho-falls', county: 'Bonneville County' },
      { name: 'Ammon', slug: 'ammon', county: 'Bonneville County' },
      { name: 'Pocatello', slug: 'pocatello', county: 'Bannock County' },
      { name: 'Chubbuck', slug: 'chubbuck', county: 'Bannock County' },
      { name: 'Blackfoot', slug: 'blackfoot', county: 'Bingham County' },
      { name: 'Rexburg', slug: 'rexburg', county: 'Madison County' },
      { name: 'Rigby', slug: 'rigby', county: 'Jefferson County' },
      { name: 'Shelley', slug: 'shelley', county: 'Bingham County' },
      { name: 'Sugar City', slug: 'sugar-city', county: 'Madison County' },
      { name: 'American Falls', slug: 'american-falls', county: 'Power County' },
      { name: 'Driggs', slug: 'driggs', county: 'Teton County' },
    ],
  },
  {
    name: 'North Idaho',
    slug: 'north-idaho',
    notes:
      'Coeur d’Alene MSA plus Sandpoint and the Silver Valley. Craigslist folds this into Spokane; a CdA contractor is not a Spokane one.',
    cities: [
      { name: "Coeur d'Alene", slug: 'coeur-dalene', county: 'Kootenai County' },
      { name: 'Post Falls', slug: 'post-falls', county: 'Kootenai County' },
      { name: 'Hayden', slug: 'hayden', county: 'Kootenai County' },
      { name: 'Rathdrum', slug: 'rathdrum', county: 'Kootenai County' },
      { name: 'Sandpoint', slug: 'sandpoint', county: 'Bonner County' },
      { name: 'Ponderay', slug: 'ponderay', county: 'Bonner County' },
      { name: 'Priest River', slug: 'priest-river', county: 'Bonner County' },
      { name: 'Kellogg', slug: 'kellogg', county: 'Shoshone County' },
    ],
  },
  {
    name: 'Lewis-Clark Valley',
    slug: 'lewis-clark-valley',
    notes:
      'Lewiston MSA plus Moscow and the Idaho Palouse. Lewiston and Moscow are ~30 minutes apart, so contractors routinely cover both.',
    cities: [
      { name: 'Lewiston', slug: 'lewiston', county: 'Nez Perce County' },
      { name: 'Moscow', slug: 'moscow', county: 'Latah County' },
      { name: 'Orofino', slug: 'orofino', county: 'Clearwater County' },
      { name: 'Grangeville', slug: 'grangeville', county: 'Idaho County' },
      { name: 'Kamiah', slug: 'kamiah', county: 'Lewis County' },
      { name: 'Potlatch', slug: 'potlatch', county: 'Latah County' },
    ],
  },
]

let marketCount = 0
let cityCount = 0

for (const m of MARKETS) {
  const existing = await payload.find({
    collection: 'markets',
    where: { slug: { equals: m.slug } },
    limit: 1,
  })

  const market =
    existing.docs[0] ??
    (await payload.create({
      collection: 'markets',
      data: { name: m.name, slug: m.slug, state: 'ID', notes: m.notes, active: true },
    }))

  if (!existing.docs[0]) marketCount++

  for (const c of m.cities) {
    const found = await payload.find({
      collection: 'cities',
      where: { slug: { equals: c.slug } },
      limit: 1,
    })
    if (found.docs[0]) continue

    await payload.create({
      collection: 'cities',
      data: {
        name: c.name,
        slug: c.slug,
        state: 'ID',
        county: c.county,
        market: market.id,
        active: c.slug === 'boise', // only Boise is live until pages are written
      },
    })
    cityCount++
  }

  console.log(`${m.name.padEnd(20)} ${m.cities.length} cities`)
}

console.log(`\n${marketCount} markets, ${cityCount} cities created`)
console.log('All cities inactive except Boise — activate one when it has real content.')
process.exit(0)
