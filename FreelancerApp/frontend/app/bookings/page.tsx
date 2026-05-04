'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { BookingStatus } from '@/types'

// Mock data — swap for bookingsApi.getAll() once route exists
const MOCK_BOOKINGS = [
  {
    booking_id: 1, service_name: 'Pipe Repair',    other_party: 'Bob Jones',
    status: 'completed' as BookingStatus, scheduled_at: '2026-04-20 10:00', quoted_price: 120,
    address: '123 Main St, New York',    payment_status: 'paid',
  },
  {
    booking_id: 2, service_name: 'Wiring',          other_party: 'Charlie Brown',
    status: 'accepted'  as BookingStatus, scheduled_at: '2026-04-25 14:00', quoted_price: 150,
    address: '456 Park Ave, New York',   payment_status: 'pending',
  },
]

const ALL_STATUSES: BookingStatus[] = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled']

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all')

  const filtered = MOCK_BOOKINGS.filter(b => statusFilter === 'all' || b.status === statusFilter)

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">My Bookings</h1>
        <p className="text-brand-muted mb-8">Track all your job bookings and their status.</p>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              statusFilter === 'all' ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-muted border-gray-200 hover:border-brand-navy'
            }`}>
            All
          </button>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border capitalize transition-all ${
                statusFilter === s ? 'bg-brand-navy text-white border-brand-navy' : 'bg-white text-brand-muted border-gray-200 hover:border-brand-navy'
              }`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        <div className="flex flex-col gap-4">
          {filtered.length === 0 && (
            <p className="text-brand-muted text-center py-16">No bookings found.</p>
          )}
          {filtered.map(b => (
            <div key={b.booking_id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-navy text-lg">{b.service_name}</h3>
                  <p className="text-sm text-brand-muted mt-0.5">With {b.other_party}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-brand-muted text-xs uppercase tracking-wide mb-0.5">Scheduled</p>
                  <p className="text-navy font-medium">{b.scheduled_at}</p>
                </div>
                <div>
                  <p className="text-brand-muted text-xs uppercase tracking-wide mb-0.5">Location</p>
                  <p className="text-navy font-medium">{b.address}</p>
                </div>
                <div>
                  <p className="text-brand-muted text-xs uppercase tracking-wide mb-0.5">Quoted Price</p>
                  <p className="text-navy font-semibold">${b.quoted_price}</p>
                </div>
              </div>

              {/* Payment row */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-muted">Payment:</span>
                  <StatusBadge status={b.payment_status as 'pending' | 'paid' | 'failed'} />
                </div>
                {b.status === 'completed' && b.payment_status !== 'paid' && (
                  <button className="px-4 py-2 bg-brand-teal text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
                    Pay now
                  </button>
                )}
                {b.status === 'completed' && (
                  <button className="px-4 py-2 border border-gray-200 text-navy text-xs font-semibold rounded-lg hover:border-brand-teal transition-colors">
                    Leave a review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
