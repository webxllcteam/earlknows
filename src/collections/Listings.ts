import type { CollectionConfig, Where } from 'payload'

/**
 * A Listing is one service in one market — the unit Earl sells.
 *
 * A contractor covers a metro, not a town, so the subscription is per trade per
 * metro. The panel, the cap and the price all live here, and it renders
 * /[market]/[service].
 *
 * City pages (see CityPages) inherit this panel but own their own words — that
 * separation is what keeps them from being near-duplicates of each other.
 */
export const Listings: CollectionConfig = {
  slug: 'listings',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'status', 'provider', 'monthlyRate'],
    description: 'One service × one market. This is what a contractor buys.',
    group: 'Network',
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Keep a readable label so the admin list is scannable.
        const serviceId = typeof data.service === 'object' ? data.service?.id : data.service
        const marketId = typeof data.market === 'object' ? data.market?.id : data.market
        if (serviceId && marketId) {
          try {
            const [service, market] = await Promise.all([
              req.payload.findByID({ collection: 'services', id: serviceId, depth: 0 }),
              req.payload.findByID({ collection: 'markets', id: marketId, depth: 0 }),
            ])
            data.label = `${service.name} — ${market.name}, ${market.state}`
          } catch {
            // Leave the existing label alone if either lookup fails.
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar', description: 'Generated automatically.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Paused', value: 'paused' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'service',
          type: 'relationship',
          relationTo: 'services',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'market',
          type: 'relationship',
          relationTo: 'markets',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'providers',
      type: 'relationship',
      relationTo: 'providers',
      hasMany: true,
      // Only offer contractors who said they cover this trade in this market.
      // A provider's declared coverage does not list them — this field does.
      filterOptions: ({ data }) => {
        const serviceId =
          typeof data?.service === 'object' ? data?.service?.id : (data?.service as number)
        const marketId =
          typeof data?.market === 'object' ? data?.market?.id : (data?.market as number)

        const and: Where[] = [{ status: { equals: 'active' } }]
        if (serviceId) and.push({ services: { contains: serviceId } })
        if (marketId) and.push({ serviceAreas: { contains: marketId } })
        return { and }
      },
      admin: {
        description:
          'THIS is what publishes a contractor on the page. Only active providers who cover this trade in this metro appear here. Shown in rotating order — never ranked.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'maxProviders',
          type: 'number',
          required: true,
          defaultValue: 3,
          min: 1,
          admin: {
            width: '50%',
            description:
              'How many providers we currently accept in this metro. Once the panel is full, applicants are waitlisted.',
          },
        },
        {
          name: 'monthlyRate',
          type: 'number',
          admin: { width: '50%', description: 'Flat USD per slot, per month. One subscription per trade per metro.' },
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Page content',
          description: 'What makes this page worth ranking. Generic copy here is the whole risk.',
          fields: [
            {
              name: 'metaTitle',
              type: 'text',
              admin: { description: 'Under ~60 characters. Falls back to a generated title.' },
            },
            {
              name: 'metaDescription',
              type: 'textarea',
              admin: { description: 'Under ~155 characters.' },
            },
            {
              name: 'intro',
              type: 'richText',
              admin: { description: 'Opening copy for this service in this city.' },
            },
            {
              name: 'localNotes',
              type: 'richText',
              admin: {
                description:
                  'The part nobody can copy: permit rules, climate, what fails here and why. Write what only someone working in this market would know.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'priceLow',
                  type: 'number',
                  admin: { width: '50%', description: 'Typical job, low end (USD).' },
                },
                {
                  name: 'priceHigh',
                  type: 'number',
                  admin: { width: '50%', description: 'Typical job, high end (USD).' },
                },
              ],
            },
            {
              name: 'faqs',
              type: 'array',
              admin: { description: 'Published as FAQPage schema. Four or five real questions.' },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}
