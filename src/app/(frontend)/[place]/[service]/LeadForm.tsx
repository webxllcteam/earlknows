import React from 'react'
import { submitLead } from './actions'

const input: React.CSSProperties = {
  padding: '0.7rem 0.8rem',
  border: '1px solid var(--line)',
  borderRadius: '4px',
  background: 'var(--surface)',
  color: 'var(--ink)',
  font: 'inherit',
  width: '100%',
}

const button: React.CSSProperties = {
  padding: '0.8rem 1.2rem',
  border: 0,
  borderRadius: '4px',
  background: 'var(--forest)',
  color: '#fff',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
}

export function LeadForm({
  placeSlug,
  serviceSlug,
  serviceId,
  cityId,
  providerIds,
  error,
}: {
  placeSlug: string
  serviceSlug: string
  serviceId: number
  cityId?: number
  providerIds: number[]
  error?: string
}) {
  return (
    <form action={submitLead}>
      {error === 'missing' && (
        <p style={{ color: '#b3261e' }}>Please add your name and a phone number.</p>
      )}
      <input type="hidden" name="placeSlug" value={placeSlug} />
      <input type="hidden" name="serviceSlug" value={serviceSlug} />
      <input type="hidden" name="serviceId" value={String(serviceId)} />
      {cityId !== undefined && <input type="hidden" name="cityId" value={String(cityId)} />}
      <input type="hidden" name="providerIds" value={providerIds.join(',')} />

      <div style={{ display: 'grid', gap: '0.75rem', maxWidth: '32rem' }}>
        <input name="name" placeholder="Your name" required style={input} />
        <input name="phone" placeholder="Phone" required style={input} />
        <input name="email" type="email" placeholder="Email (optional)" style={input} />
        <input name="zip" placeholder="Zip code" style={input} />
        <textarea name="message" placeholder="What do you need done?" rows={4} style={input} />
        <button type="submit" style={button}>
          Send it to Earl
        </button>
      </div>
    </form>
  )
}
