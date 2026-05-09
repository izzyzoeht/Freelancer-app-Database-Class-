'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { jobsApi, type AvailableJob } from '@/lib/api'

export default function JuniorJobsPage() {
  const [filter, setFilter] = useState('')
  const [jobs, setJobs] = useState<AvailableJob[]>([])
  const [cap, setCap] = useState({ job_limit: 5, jobs_taken: 0, remaining: 5 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [applyingId, setApplyingId] = useState<number | null>(null)

  // Initial cap fetch
  useEffect(() => {
    jobsApi.cap().then(setCap).catch(() => {})
  }, [])

  // Debounced job-list fetch
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true); setError('')
      try {
        const res = await jobsApi.available(filter.trim() || undefined)
        if (!cancelled) setJobs(res.jobs)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [filter])

  async function handleApply(job: AvailableJob) {
    if (cap.remaining <= 0) return
    setApplyingId(job.booking_id)
    try {
      await jobsApi.apply(job.booking_id)
      setJobs(prev => prev.filter(j => j.booking_id !== job.booking_id))
      // Refresh cap from server (junior may have hit cap)
      const c = await jobsApi.cap()
      setCap(c)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to accept job')
    } finally {
      setApplyingId(null)
    }
  }

  function relativeTime(iso: string | null): string {
    if (!iso) return ''
    const ms = Date.now() - new Date(iso).getTime()
    const min = Math.floor(ms / 60_000)
    if (min < 1)  return 'just now'
    if (min < 60) return `${min} min ago`
    const hr = Math.floor(min / 60)
    if (hr < 24)  return `${hr} hr${hr !== 1 ? 's' : ''} ago`
    const d = Math.floor(hr / 24)
    return `${d} day${d !== 1 ? 's' : ''} ago`
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">Browse Jobs</h1>
        <p className="text-brand-muted mb-6">Jobs available for junior apprentices.</p>

        {/* Job cap bar */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-navy text-sm">Job Cap</p>
            <p className="text-sm text-brand-muted">{cap.jobs_taken} / {cap.job_limit} slots used</p>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-amber rounded-full transition-all"
              style={{ width: `${cap.job_limit ? (cap.jobs_taken / cap.job_limit) * 100 : 0}%` }}
            />
          </div>
          <p className="text-xs text-brand-muted mt-2">
            You can take {cap.remaining} more job{cap.remaining !== 1 ? 's' : ''} before reaching your cap.
            Your supervisor can increase this limit.
          </p>
        </div>

        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search by trade or city…"
          className="w-full mb-6 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-teal"
        />

        {loading ? (
          <p className="text-brand-muted text-center py-16">Loading jobs…</p>
        ) : error ? (
          <p className="text-red-600 text-center py-16">{error}</p>
        ) : jobs.length === 0 ? (
          <p className="text-brand-muted text-center py-16">No available jobs right now.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map(job => (
              <div key={job.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-semibold text-navy">{job.title}</h3>
                    {job.trade && (
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">{job.trade}</span>
                    )}
                  </div>
                  <p className="text-sm text-brand-muted">
                    {job.employer}{job.city ? ` · ${job.city}` : ''} · {relativeTime(job.created_at)}
                  </p>
                </div>
                <button
                  disabled={cap.remaining <= 0 || applyingId === job.booking_id}
                  onClick={() => handleApply(job)}
                  className="px-4 py-2 bg-brand-teal text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ml-4 shrink-0"
                >
                  {cap.remaining <= 0 ? 'Cap reached' : applyingId === job.booking_id ? 'Accepting…' : 'Accept'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
