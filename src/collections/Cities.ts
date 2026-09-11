import type { CollectionConfig } from 'payload'

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'state', 'market', 'slug', 'active'],
    description: 'Towns with their own page. Only create one you can write real local content for.',
    group: 'Catalog',
  },
  fields: [
    { name: 'name', type: 'text', required: true, admin: { description: 'e.g. Boise' } },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL segment — e.g. "boise".' },
    },
    {
      type: 'row',
      fields: [
        { name: 'state', type: 'text', required: true, defaultValue: 'ID', admin: { width: '30%' } },
        { name: 'county', type: 'text', admin: { width: '70%', description: 'e.g. Ada County' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'lat', type: 'number', admin: { width: '50%' } },
        { name: 'lng', type: 'number', admin: { width: '50%' } },
      ],
    },
    {
      name: 'market',
      type: 'relationship',
      relationTo: 'markets',
      required: true,
      admin: {
        description:
          'Which metro this town belongs to. Territories are sold per market, so every city in a market shares the same panel.',
      },
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}
