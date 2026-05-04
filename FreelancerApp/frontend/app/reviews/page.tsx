'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { StarRating } from '@/components/ui/StarRating'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Review, ReviewRequest } from '@/types'

// Mock data — replace with reviewsApi.getRequests() + reviewsApi.getForTradesperson()
const MOCK_REQUESTS: ReviewRequest[] = [
  {
    review_request_id: 1, booking_id: 1, employer_id: 1, tradesperson_id: 1,
    status: 'pending', created_at: '2026-04-20T12:00:00Z',
  },
]

const MOCK_REVIEWS: (Review & { tradesperson_name: string })[] = [
  {
    review_id: 1, booking_id: 1, reviewer_user_id: 1, tradesperson_id: 1,
    rating: 5, comment: 'Great service, very professional!',
    created_at: '2026-04-20T14:00:00Z', tradesperson_name: 'Bob Jones',
  },
]

export default function ReviewsPage() {
  const [activeTab, setActiveTab]  = useState<'pending' | 'submitted'>('pending')
  const [rating,    setRating]     = useState(0)
  const [comment,   setComment]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)

  async function handleSubmit(req: ReviewRequest) {
    if (!rating) return
    setSubmitting(true)
    // → reviewsApi.submit({ booking_id: req.booking_id, tradesperson_id: req.tradesperson_id, rating, comment })
    await new Promise(r => setTimeout(r, 800))  // simulate API call
    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">Reviews</h1>
        <p className="text-brand-muted mb-8">Leave reviews for completed jobs and see your history.</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
          {(['pending', 'submitted'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                activeTab === tab ? 'bg-white text-navy shadow-sm' : 'text-brand-muted hover:text-navy'
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Pending review requests — Trigger 3 in DB creates these automatically on booking completion */}
        {activeTab === 'pending' && (
          <div className="flex flex-col gap-4">
            {MOCK_REQUESTS.filter(r => r.status === 'pending').length === 0 && (
              <p className="text-brand-muted text-center py-16">No pending reviews.</p>
            )}
            {MOCK_REQUESTS.filter(r => r.status === 'pending').map(req => (
              <div key={req.review_request_id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-navy">Booking #{req.booking_id}</p>
                    <p className="text-sm text-brand-muted">Tradesperson ID: {req.tradesperson_id}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>

                {submitted ? (
                  <div className="text-center py-6">
                    <p className="text-3xl mb-2">🎉</p>
                    <p className="font-semibold text-green-700">Review submitted!</p>
                    <p className="text-sm text-brand-muted mt-1">Thank you for your feedback.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-sm text-brand-muted mb-2">Your rating (required, 1–5)</p>
                      <StarRating value={rating} onChange={setRating} size="lg" />
                    </div>
                    <div>
                      <p className="text-sm text-brand-muted mb-2">Comment (optional)</p>
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={3}
                        placeholder="How was the job?"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-teal resize-none"
                      />
                    </div>
                    <button
                      onClick={() => handleSubmit(req)}
                      disabled={!rating || submitting}
                      className="px-6 py-3 bg-brand-teal text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                      {submitting ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submitted reviews history */}
        {activeTab === 'submitted' && (
          <div className="flex flex-col gap-4">
            {MOCK_REVIEWS.length === 0 && (
              <p className="text-brand-muted text-center py-16">No submitted reviews yet.</p>
            )}
            {MOCK_REVIEWS.map(r => (
              <div key={r.review_id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-navy">{r.tradesperson_name}</p>
                  <p className="text-xs text-brand-muted">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <StarRating value={r.rating} readonly size="sm" />
                {r.comment && <p className="text-sm text-brand-muted mt-3">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
