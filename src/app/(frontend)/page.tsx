import Link from 'next/link'
import { payloadClient } from '@/lib/payload'

export const revalidate = 3600

export default async function HomePage() {
  const payload = await payloadClient()

  const [services, cities] = await Promise.all([
    payload.find({
      collection: 'services',
      where: { active: { equals: true } },
      sort: 'sortOrder',
      limit: 50,
    }),
    payload.find({
      collection: 'cities',
      where: { active: { equals: true } },
      sort: 'name',
      limit: 50,
    }),
  ])

  return (
    <div className="wrap">
      <section className="hero">
        <h1>Earl knows a guy.</h1>
        <p className="lede">
          One vetted contractor per trade, per city. You get a name — not a form sold to eight
          companies who all call you at dinner.
        </p>
      </section>

      {services.docs.length > 0 && (
        <section>
          <h2>Trades</h2>
          <ul className="grid">
            {services.docs.map((service) => (
              <li key={service.id}>
                <Link className="card" href={`/${service.slug}`}>
                  <span className="card-title">{service.name}</span>
                  {service.shortDescription && (
                    <span className="card-note">{service.shortDescription}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cities.docs.length > 0 && (
        <section>
          <h2>Markets</h2>
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
    </div>
  )
}
