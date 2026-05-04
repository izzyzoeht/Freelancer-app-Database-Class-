import type { BookingStatus, PaymentStatus, ReviewRequestStatus } from '@/types'

type AnyStatus = BookingStatus | PaymentStatus | ReviewRequestStatus | 'verified' | 'unverified'

const MAP: Record<string, string> = {
  // Booking
  pending:     'bg-yellow-100 text-yellow-800',
  accepted:    'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-red-100 text-red-800',
  // Payment
  paid:        'bg-green-100 text-green-800',
  failed:      'bg-red-100 text-red-800',
  // Review request
  submitted:   'bg-teal-100 text-teal-800',
  // Misc
  verified:    'bg-green-100 text-green-800',
  unverified:  'bg-gray-100 text-gray-600',
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  const cls = MAP[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
