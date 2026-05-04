'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { StarRating } from '@/components/ui/StarRating'
import type { TradespersonWithUser } from '@/types'

// Mock data — replace with tradespeopleApi.search(filters) once route exists
const MOCK_TRADESPEOPLE: (TradespersonWithUser & { service_name: string })[] = [
  {
    tradesperson_id: 1, user_id: 2, trade_category: 'Plumbing',
    experience_year: 5, endorse_id: null, job_limit: 5, avg_rating: 5.0,
    is_verified: true, service_name: 'Pipe Repair, Drain Cleaning',
    user: { user_id: 2, first_name: 'Bob', last_name: 'Jones', email: 'bob@email.com',
            city: 'New York', state: 'NY', user_type: 'Tradesperson', is_active: true, created_at: '' },
  },
  {
    tradesperson_id: 2, user_id: 3, trade_category: 'Electrical',
    experience_year: 4, endorse_id: null, job_limit: 5, avg_rating: 4.5,
    is_verified: true, service_name: 'Wiring Installation',
    user: { user_id: 3, first_name: 'Charlie', last_name: 'Brown', email: 'charlie@email.com',
            city: 'New York', state: 'NY', user_type: 'Tradesperson', is_active: true, created_at: '' },
  },
]

const TRADE_TYPES = ['All', 'Plumbing', 'Electrical', 'Carpentry', 'HVAC', 'Painting']

export default function BrowsePage() {
  const [tradeFilter, setTradeFilter] = useState('All')
  const [cityFilter,  setCityFilter]  = useState('')

  const filtered = MOCK_TRADESPEOPLE.filter(t =>
    (tradeFilter === 'All' || t.trade_category === tradeFilter) &&
    (!cityFilter || t.user.city?.toLowerCase().includes(cityFilter.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">Find a Tradesperson</h1>
        <p className="text-brand-muted mb-8">Browse verified professionals in your area.</p>

        {/* Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <div className="flex gap-2">
            {TRADE_TYPES.map(t => (
              <button key={t} onClick={() => setTradeFilter(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  tradeFilter === t
                    ? 'bg-brand-teal text-white border-brand-teal'
                    : 'bg-white text-brand-muted border-gray-200 hover:border-brand-teal'
                }`}>
                {t}
              </button>
            ))}
          </div>
          <input
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            placeholder="Filter by city…"
            className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-teal"
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(t => (
            <div key={t.tradesperson_id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-navy text-lg">
                    {t.user.first_name} {t.user.last_name}
                  </h3>
                  <p className="text-brand-muted text-sm">{t.trade_category} · {t.user.city}, {t.user.state}</p>
                </div>
                {t.is_verified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                    ✓ Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <StarRating value={Math.round(t.avg_rating)} readonly size="sm" />
                <span className="text-sm text-brand-muted">{t.avg_rating.toFixed(1)}</span>
              </div>

              <p className="text-sm text-brand-muted mb-4">{t.service_name}</p>
              <p className="text-xs text-brand-muted mb-4">{t.experience_year} yrs experience</p>

              <button className="w-full py-2.5 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:bg-brand-steel transition-colors">
                Book now
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
