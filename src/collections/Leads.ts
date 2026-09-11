import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'service', 'city', 'status', 'createdAt'],
    description: 'Every inquiry, and what happened to it.',
    group: 'Network',
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'phone', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', admin: { width: '65%' } },
        { name: 'zip', type: 'text', admin: { width: '35%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'service', type: 'relationship', relationTo: 'services', admin: { width: '50%' } },
        { name: 'city', type: 'relationship', relationTo: 'cities', admin: { width: '50%' } },
      ],
    },
    { name: 'message', type: 'textarea' },
    {
      name: 'provider',
      type: 'relationship',
      relationTo: 'providers',
      admin: { description: 'Who this was routed to.', position: 'sidebar' },
    },
    {
      name: 'sourcePage',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar', description: 'Page the form was submitted from.' },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Follow-up notes. Internal only.' },
    },
  ],
}
