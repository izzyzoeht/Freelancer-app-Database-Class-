'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

const MOCK_JOBS = [
  { id: 1, title: 'Pipe Repair Needed',         trade: 'Plumbing',    city: 'New York', budget: 100, employer: 'Alice Smith',  posted: '2 hrs ago' },
  { id: 2, title: 'Bathroom Electrical Wiring', trade: 'Electrical',  city: 'Brooklyn', budget: 200, employer: 'Eva Green',   posted: '5 hrs ago' },
  { id: 3, title: 'Kitchen Drain Unclog',       trade: 'Plumbing',    city: 'Queens',   budget: 80,  employer: 'Tom Baker',   posted: '1 day ago' },
  { id: 4, title: 'Circuit Breaker Install',    trade: 'Electrical',  city: 'New York', budget: 150, employer: 'Sara Lee',    posted: '1 day ago' },
]

export default function TradespersonJobsPage() {
  const [filter, setFilter] = useState('')

  const filtered = MOCK_JOBS.filter(j =>
    !filter || j.trade.toLowerCase().includes(filter.toLowerCase()) || j.city.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">Available Jobs</h1>
        <p className="text-brand-muted mb-8">Browse jobs matching your trade and region.</p>

        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search by trade or city…"
          className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-brand-teal"
        />

        <div className="flex flex-col gap-4">
          {filtered.map(job => (
            <div key={job.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-navy">{job.title}</h3>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">
                    {job.trade}
                  </span>
                </div>
                <p className="text-sm text-brand-muted">{job.employer} · {job.city} · {job.posted}</p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-4">
                <span className="font-display text-xl text-navy">${job.budget}</span>
                <button className="px-4 py-2 bg-brand-teal text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
