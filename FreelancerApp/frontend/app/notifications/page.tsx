'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

// Mock data — replace with notificationsApi.getAll() once routes/notifications.py is built
const MOCK_NOTIFICATIONS = [
  { id: 1, message: 'Your booking for Pipe Repair has been accepted.',     time: '2 hrs ago',  read: false },
  { id: 2, message: 'Bob Jones completed your job. Leave a review!',        time: '1 day ago',  read: false },
  { id: 3, message: 'New job posted matching your Plumbing skills.',        time: '2 days ago', read: true },
  { id: 4, message: 'Your payment of $120.00 was processed successfully.', time: '3 days ago', read: true },
]

export default function NotificationsPage() {
  const [notes, setNotes] = useState(MOCK_NOTIFICATIONS)

  const unread = notes.filter(n => !n.read).length

  function markRead(id: number) {
    // → notificationsApi.markRead(id)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotes(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-2xl mx-auto animate-fade-up">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-3xl text-navy">Notifications</h1>
          {unread > 0 && (
            <span className="text-xs bg-brand-teal text-white px-2.5 py-1 rounded-full font-semibold">
              {unread} new
            </span>
          )}
        </div>
        <p className="text-brand-muted mb-8">Stay up to date on your jobs and activity.</p>

        {unread > 0 && (
          <button onClick={markAllRead}
            className="text-sm text-brand-teal hover:underline mb-6 block">
            Mark all as read
          </button>
        )}

        <div className="flex flex-col gap-3">
          {notes.map(n => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`px-5 py-4 rounded-xl border cursor-pointer transition-all ${
                n.read
                  ? 'bg-white border-gray-100 text-brand-muted'
                  : 'bg-white border-brand-teal/30 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-3">
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-brand-teal shrink-0 mt-1.5" />
                )}
                <div className={n.read ? 'pl-5' : ''}>
                  <p className={`text-sm ${n.read ? 'text-brand-muted' : 'text-navy font-medium'}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-brand-muted mt-1">{n.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notes.every(n => n.read) && (
          <p className="text-center text-brand-muted text-sm mt-10">
            You&apos;re all caught up ✓
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
