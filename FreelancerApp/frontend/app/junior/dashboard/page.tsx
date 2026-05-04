import DashboardLayout from '@/components/layout/DashboardLayout'
import Link from 'next/link'

const STEPS = [
  { n: 1, label: 'Upload training documents', done: false, href: '/junior/setup' },
  { n: 2, label: 'Request senior endorsement', done: false, href: '/junior/setup' },
  { n: 3, label: 'Get verified by supervisor', done: false, href: '/junior/setup' },
  { n: 4, label: 'Start accepting jobs (within job cap)', done: false, href: '/junior/jobs' },
]

export default function JuniorDashboard() {
  const completed = STEPS.filter(s => s.done).length
  const pct = Math.round((completed / STEPS.length) * 100)

  return (
    <DashboardLayout>
      <div className="p-8 max-w-3xl mx-auto animate-fade-up">
        <h1 className="font-display text-3xl text-navy mb-1">Welcome, Apprentice 👷</h1>
        <p className="text-brand-muted mb-8">Complete your setup to start taking on jobs.</p>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-navy">Profile Completion</p>
            <p className="text-brand-muted text-sm">{completed}/{STEPS.length} steps</p>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-teal rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-brand-muted mt-2">{pct}% complete</p>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3 mb-8">
          {STEPS.map(step => (
            <Link key={step.n} href={step.href}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all ${
                step.done
                  ? 'bg-green-50 border-green-200 opacity-70'
                  : 'bg-white border-gray-200 hover:border-brand-teal hover:shadow-sm'
              }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                step.done ? 'bg-green-500 text-white' : 'bg-gray-100 text-brand-muted'
              }`}>
                {step.done ? '✓' : step.n}
              </div>
              <p className={`font-medium ${step.done ? 'text-green-700 line-through' : 'text-navy'}`}>
                {step.label}
              </p>
            </Link>
          ))}
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="font-semibold text-amber-800 mb-1">Job Cap Notice</p>
          <p className="text-sm text-amber-700">
            As a Junior, you can accept a limited number of jobs until endorsed by a senior tradesperson.
            Your supervisor can raise your limit over time.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
