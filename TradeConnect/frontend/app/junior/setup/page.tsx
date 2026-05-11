'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { tradespeopleApi } from '@/lib/api'

export default function JuniorSetupPage() {
  const [endorseEmail, setEndorseEmail] = useState('')
  const [submitted,    setSubmitted]    = useState(false)
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [docName,      setDocName]      = useState('')

  async function handleEndorse() {
    if (!endorseEmail) return
    setLoading(true); setError('')
    try {
      await tradespeopleApi.requestEndorsement(endorseEmail)
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">My Setup</h1>
        <p className="text-brand-muted mb-8">Upload your training docs and request endorsement.</p>

        {/* Training docs — UI-only stub. The schema has no documents table. */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="font-semibold text-navy mb-4">Training Documents</h2>
          <p className="text-sm text-brand-muted mb-4">
            Upload your training certificates, apprenticeship records, or relevant credentials.
          </p>
          <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-teal transition-colors">
            <input
              type="file"
              className="hidden"
              onChange={e => setDocName(e.target.files?.[0]?.name ?? '')}
            />
            <p className="text-3xl mb-2">📁</p>
            <p className="font-medium text-navy">{docName || 'Click to upload a document'}</p>
            <p className="text-xs text-brand-muted mt-1">PDF, JPG, PNG up to 10 MB</p>
          </label>
          {docName && (
            <p className="mt-3 text-sm text-amber-700 font-medium">
              ⓘ {docName} selected — document storage is not yet enabled in this build.
            </p>
          )}
        </section>

        {/* Endorsement request — wired to /api/tradespeople/endorse */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-navy mb-4">Request Senior Endorsement</h2>
          <p className="text-sm text-brand-muted mb-4">
            Enter the email of your supervising tradesperson. They will be linked as your supervisor —
            this is required before you can accept jobs independently.
          </p>

          {submitted ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">✉️</p>
              <p className="font-semibold text-navy">Supervisor linked!</p>
              <p className="text-sm text-brand-muted mt-1">
                Your profile is now associated with your supervisor.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <input
                type="email"
                value={endorseEmail}
                onChange={e => setEndorseEmail(e.target.value)}
                placeholder="supervisor@email.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-teal"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                onClick={handleEndorse}
                disabled={!endorseEmail || loading}
                className="px-6 py-3 bg-brand-navy text-white font-semibold rounded-xl text-sm hover:bg-brand-steel disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending…' : 'Send endorsement request'}
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
