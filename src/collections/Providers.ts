import type { CollectionConfig, Where } from 'payload'

export const Providers: CollectionConfig = {
  slug: 'providers',
  admin: {
    useAsTitle: 'businessName',
    defaultColumns: ['businessName', 'contactName', 'phone', 'status'],
    description: 'Contractors. Vet them here before assigning a territory.',
    group: 'Network',
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'applied',
      options: [
        { label: 'Applied', value: 'applied' },
        { label: 'Vetting', value: 'vetting' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Declined', value: 'declined' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'businessName', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      index: true,
      admin: { description: 'URL segment for their profile page.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'contactName', type: 'text', admin: { width: '50%' } },
        { name: 'phone', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'email', type: 'email', required: true, admin: { width: '50%' } },
        { name: 'website', type: 'text', admin: { width: '50%' } },
      ],
    },
    {
      name: 'address',
      type: 'group',
      admin: {
        description:
          'Their real business address. This is published as LocalBusiness schema — it must be accurate.',
      },
      fields: [
        { name: 'street', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text', admin: { width: '45%' } },
            { name: 'state', type: 'text', defaultValue: 'ID', admin: { width: '20%' } },
            { name: 'zip', type: 'text', admin: { width: '35%' } },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'licenseNumber', type: 'text', admin: { width: '50%' } },
        { name: 'yearsInBusiness', type: 'number', admin: { width: '50%' } },
      ],
    },
    {
      name: 'insuranceExpiry',
      type: 'date',
      admin: { description: 'Re-verify before this date.' },
    },
    {
      name: 'bio',
      type: 'richText',
      admin: { description: 'Why Earl recommends them. This is the trust copy on the page.' },
    },
    { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true },
    {
      type: 'collapsible',
      label: 'Coverage',
      admin: {
        description:
          'What this contractor can do and where they will travel. Filling this in does NOT publish them — it only makes them selectable on matching Territories. Publishing happens on the Listing record.',
      },
      fields: [
        {
          name: 'services',
          type: 'relationship',
          relationTo: 'services',
          hasMany: true,
          admin: { description: 'Categories they subscribe to. This is what they pay for.' },
        },
        {
          name: 'subServices',
          type: 'relationship',
          relationTo: 'services',
          hasMany: true,
          // Only sub-services, and only those under a category they subscribe to.
          filterOptions: ({ data }): Where => {
            const parents = Array.isArray(data?.services)
              ? data.services.map((v: unknown) =>
                  typeof v === 'object' && v ? (v as { id: number }).id : v,
                )
              : []
            if (parents.length === 0) return { parent: { exists: true } }
            const and: Where[] = [{ parent: { exists: true } }, { parent: { in: parents } }]
            return { and }
          },
          admin: {
            description:
              'The specific work they do. A roofer who does not touch metal roofing will not appear on the metal roofing page.',
          },
        },
        {
          name: 'serviceAreas',
          type: 'relationship',
          relationTo: 'markets',
          hasMany: true,
          admin: {
            description:
              'Metros they cover. One subscription per trade per metro — they never pick individual towns.',
          },
        },
        {
          name: 'listedIn',
          type: 'join',
          collection: 'listings',
          on: 'providers',
          admin: {
            allowCreate: false,
            description:
              'Where Earl currently lists them. Read-only. If this is empty the contractor appears nowhere on the site — open the matching Listing and add them to its Providers panel.',
          },
        },
      ],
    },
    {
      name: 'vettingNotes',
      type: 'textarea',
      admin: {
        description: 'Internal only — never rendered on the site.',
        position: 'sidebar',
      },
    },
  ],
}
