import DashboardLayout from '@/components/layout/DashboardLayout'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StarRating } from '@/components/ui/StarRating'
import type { BookingStatus } from '@/types'
import Link from 'next/link'

const MOCK_BOOKINGS = [
  { booking_id: 1, service_name: 'Pipe Repair',   employer: 'Alice Smith', status: 'completed' as BookingStatus, scheduled_at: '2026-04-20', quoted_price: 120 },
  { booking_id: 2, service_name: 'Drain Cleaning', employer: 'Eva Green',  status: 'accepted'  as BookingStatus, scheduled_at: '2026-04-25', quoted_price: 90 },
]

const STATS = [
  { label: 'Active Jobs',    value: '1' },
  { label: 'Completed',      value: '1' },
  { label: 'Avg Rating',     value: '5.0' },
  { label: 'Total Earned',   value: '$120' },
]

export default function TradespersonDashboard() {
  return (
    <DashboardLayout>
      <div className="p-8 max-w-5xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">Your Dashboard</h1>
        <p className="text-brand-muted mb-8">Here's an overview of your work.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {STATS.map(s => (
            <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-2xl font-display text-navy">{s.value}</p>
              <p className="text-sm text-brand-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Rating summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex items-center gap-6">
          <div>
            <p className="text-5xl font-display text-navy">5.0</p>
            <p className="text-sm text-brand-muted mt-1">Average rating</p>
          </div>
          <div>
            <StarRating value={5} readonly size="lg" />
            <p className="text-sm text-brand-muted mt-2">Based on 1 review</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-10">
          <Link href="/tradesperson/jobs"
            className="px-5 py-3 rounded-xl bg-brand-teal text-white font-semibold text-sm hover:opacity-90 transition-opacity">
            Browse Available Jobs
          </Link>
          <Link href="/reviews"
            className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-navy font-semibold text-sm hover:border-brand-teal transition-colors">
            View My Reviews
          </Link>
        </div>

        {/* Recent bookings */}
        <section>
          <h2 className="font-display text-xl text-navy mb-4">Recent Bookings</h2>
          <div className="flex flex-col gap-3">
            {MOCK_BOOKINGS.map(b => (
              <div key={b.booking_id}
                className="bg-white rounded-xl px-6 py-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-navy">{b.service_name}</p>
                  <p className="text-sm text-brand-muted">{b.employer} · {b.scheduled_at}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-navy">${b.quoted_price}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
