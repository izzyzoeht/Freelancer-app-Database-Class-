'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function JuniorSetupPage() {
  const [endorseEmail, setEndorseEmail] = useState('')
  const [submitted,    setSubmitted]    = useState(false)
  const [docName,      setDocName]      = useState('')

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">My Setup</h1>
        <p className="text-brand-muted mb-8">Upload your training docs and request endorsement.</p>

        {/* Training docs */}
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
            <p className="mt-3 text-sm text-green-600 font-medium">✓ {docName} ready to upload</p>
          )}
        </section>

        {/* Endorsement request */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-navy mb-4">Request Senior Endorsement</h2>
          <p className="text-sm text-brand-muted mb-4">
            Enter the email of your supervising tradesperson. They will be asked to endorse your profile
            — this unlocks your ability to accept jobs independently.
          </p>

          {submitted ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">✉️</p>
              <p className="font-semibold text-navy">Request sent!</p>
              <p className="text-sm text-brand-muted mt-1">Your supervisor will receive an email to endorse you.</p>
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
              <button
                onClick={() => endorseEmail && setSubmitted(true)}
                className="px-6 py-3 bg-brand-navy text-white font-semibold rounded-xl text-sm hover:bg-brand-steel transition-colors"
              >
                Send endorsement request
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
