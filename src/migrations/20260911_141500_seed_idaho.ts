import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Seeds Idaho geography, the first service, and the Treasure Valley listing.
 *
 * Runs as a migration rather than a script so it executes automatically on
 * deploy and is tracked — Railway's private network means we can't reach the
 * production database from a laptop.
 *
 * No admin user is created on purpose: Payload's first-user flow at /admin lets
 * the owner set their own password rather than having one baked into a commit.
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


export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const m of MARKETS) {
    const existing = await payload.find({
      collection: 'markets',
      where: { slug: { equals: m.slug } },
      limit: 1,
      req,
    })

    const market =
      existing.docs[0] ??
      (await payload.create({
        collection: 'markets',
        data: { name: m.name, slug: m.slug, state: 'ID', notes: m.notes, active: true },
        req,
      }))

    for (const c of m.cities) {
      const found = await payload.find({
        collection: 'cities',
        where: { slug: { equals: c.slug } },
        limit: 1,
        req,
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
          active: c.slug === 'boise',
        },
        req,
      })
    }
  }

  // First service + its Treasure Valley listing, so there is something to see.
  const found = await payload.find({
    collection: 'services',
    where: { slug: { equals: 'roofing' } },
    limit: 1,
    req,
  })

  const service =
    found.docs[0] ??
    (await payload.create({
      collection: 'services',
      data: {
        name: 'Roofing',
        slug: 'roofing',
        shortDescription: 'Tear-offs, re-roofs, storm damage and repairs.',
        sortOrder: 10,
        active: true,
      },
      req,
    }))

  const tv = await payload.find({
    collection: 'markets',
    where: { slug: { equals: 'treasure-valley' } },
    limit: 1,
    req,
  })

  if (tv.docs[0]) {
    const existing = await payload.find({
      collection: 'listings',
      where: {
        and: [{ service: { equals: service.id } }, { market: { equals: tv.docs[0].id } }],
      },
      limit: 1,
      req,
    })
    if (!existing.docs[0]) {
      await payload.create({
        collection: 'listings',
        data: {
          service: service.id,
          market: tv.docs[0].id,
          status: 'live',
          maxProviders: 3,
          monthlyRate: 299,
          priceLow: 9000,
          priceHigh: 28000,
        },
        req,
      })
    }
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  for (const slug of MARKETS.map((m) => m.slug)) {
    const m = await payload.find({
      collection: 'markets',
      where: { slug: { equals: slug } },
      limit: 1,
      req,
    })
    if (m.docs[0]) await payload.delete({ collection: 'markets', id: m.docs[0].id, req })
  }
}
