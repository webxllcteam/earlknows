import type { CollectionConfig } from 'payload'

/**
 * A contractor asking to be listed. Doubles as the waitlist: if the territory
 * panel is already full, the application is still captured and marked waitlisted.
 * Waitlist volume is a demand curve for our own inventory.
 */
export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    useAsTitle: 'businessName',
    defaultColumns: ['businessName', 'service', 'city', 'status', 'createdAt'],
    description: 'Contractors who want in. Approve by creating a Provider from one.',
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
        { label: 'Waitlisted — panel full', value: 'waitlisted' },
        { label: 'Vetting', value: 'vetting' },
        { label: 'Approved', value: 'approved' },
        { label: 'Declined', value: 'declined' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'businessName', type: 'text', required: true },
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
      type: 'row',
      fields: [
        { name: 'service', type: 'relationship', relationTo: 'services', admin: { width: '50%' } },
        { name: 'city', type: 'relationship', relationTo: 'cities', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'licenseNumber', type: 'text', admin: { width: '50%' } },
        { name: 'yearsInBusiness', type: 'number', admin: { width: '50%' } },
      ],
    },
    { name: 'message', type: 'textarea', admin: { description: 'Anything they told us.' } },
    { name: 'notes', type: 'textarea', admin: { description: 'Internal only.' } },
  ],
}
