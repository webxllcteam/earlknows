import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { SITE_NAME, SITE_URL } from '@/lib/payload'
import './styles.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — one vetted pro per city`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Earl recommends one vetted contractor per trade in each city. One name, not eight — and no form sold to a dozen companies.',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">
              Earl<span>Knows</span>
            </Link>
            <span className="tagline">One vetted pro per city</span>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <p>
              Earl recommends one contractor per trade per city. We are paid by the contractors we
              list, and we only list one — so there is no incentive to sell your details around.
            </p>
            <p>© {new Date().getFullYear()} Earl Knows</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
