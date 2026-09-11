import type { CollectionConfig } from 'payload'

/**
 * A market is a metro area — the commercial unit a contractor actually buys.
 * A roofer sells "the Treasure Valley", not seven separate towns. Cities belong
 * to a market and exist as page surface; territories are sold per market.
 */
export const Markets: CollectionConfig = {
  slug: 'markets',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'state', 'slug', 'active'],
    description: 'Metro areas. Contractors buy a market, not a town.',
    group: 'Catalog',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'e.g. Treasure Valley' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Internal only — markets have no page of their own.' },
    },
    { name: 'state', type: 'text', required: true, defaultValue: 'ID' },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal: coverage boundaries, pricing rationale, anything useful.' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
