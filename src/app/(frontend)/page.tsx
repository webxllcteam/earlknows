import Link from 'next/link'
import { payloadClient } from '@/lib/payload'

// Rendered per request: the home page queries the database, and Railway's
// private network doesn't exist at build time. Cloudflare caches it at the edge,
// so the origin barely sees this route.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await payloadClient()

  const [cities, services] = await Promise.all([
    payload.find({
      collection: 'cities',
      where: { active: { equals: true } },
      sort: 'name',
      limit: 100,
    }),
    payload.find({
      collection: 'services',
      where: { active: { equals: true } },
      sort: 'sortOrder',
      limit: 100,
    }),
  ])

  return (
    <div className="wrap">
      <section className="hero">
        <h1>Earl knows a guy.</h1>
        <p className="lede">
          A short list of vetted contractors in each town — never eight companies who all call you
          at dinner. Earl caps the list on purpose, so the people on it actually get work.
        </p>
      </section>

      {cities.docs.length > 0 && (
        <section>
          <h2>Where Earl works</h2>
          <ul className="grid">
            {cities.docs.map((city) => (
              <li key={city.id}>
                <Link className="card" href={`/${city.slug}`}>
                  <span className="card-title">
                    {city.name}, {city.state}
                  </span>
                  {city.county && <span className="card-note">{city.county}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {services.docs.length > 0 && (
        <section>
          <h2>Trades he covers</h2>
          <p className="meta">
            {services.docs.map((s) => s.name).join(' · ')}
          </p>
        </section>
      )}
    </div>
  )
}
