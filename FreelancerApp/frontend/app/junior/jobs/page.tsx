'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

const JOB_CAP   = 5
const JOBS_TAKEN = 1

const MOCK_JOBS = [
  { id: 1, title: 'Plumbing Assistant Needed', trade: 'Plumbing',  city: 'New York', supervisor: 'Bob Jones',    posted: '3 hrs ago' },
  { id: 2, title: 'Electrical Work Assistant',  trade: 'Electrical', city: 'Brooklyn', supervisor: 'Charlie Brown', posted: '1 day ago' },
]

export default function JuniorJobsPage() {
  const [filter, setFilter] = useState('')
  const remaining = JOB_CAP - JOBS_TAKEN

  const filtered = MOCK_JOBS.filter(j =>
    !filter || j.city.toLowerCase().includes(filter.toLowerCase()) || j.trade.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">Browse Jobs</h1>
        <p className="text-brand-muted mb-6">Jobs available for junior apprentices in your area.</p>

        {/* Job cap bar */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-navy text-sm">Job Cap</p>
            <p className="text-sm text-brand-muted">{JOBS_TAKEN} / {JOB_CAP} slots used</p>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-amber rounded-full transition-all"
              style={{ width: `${(JOBS_TAKEN / JOB_CAP) * 100}%` }}
            />
          </div>
          <p className="text-xs text-brand-muted mt-2">
            You can take {remaining} more job{remaining !== 1 ? 's' : ''} before reaching your cap.
            Your supervisor can increase this limit.
          </p>
        </div>

        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search by trade or city…"
          className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-teal"
        />

        <div className="flex flex-col gap-4">
          {filtered.map(job => (
            <div key={job.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-navy">{job.title}</h3>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">{job.trade}</span>
                </div>
                <p className="text-sm text-brand-muted">Supervisor: {job.supervisor} · {job.city} · {job.posted}</p>
              </div>
              <button
                disabled={remaining <= 0}
                className="px-4 py-2 bg-brand-teal text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ml-4 shrink-0"
              >
                {remaining > 0 ? 'Apply' : 'Cap reached'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
