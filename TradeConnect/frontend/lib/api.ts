// ============================================================
// lib/api.ts — every Flask API call in one place.
// All endpoints implemented; mirrors backend route map exactly.
// ============================================================

import type {
  User, UserType,
  Tradesperson, TradespersonWithUser,
  Service,
  Booking, BookingWithDetails, BookingStatus,
  Payment, PaymentMethod,
  Review, ReviewRequest,
} from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : {}

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed with status ${res.status}`)
  }

  return data as T
}

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  register: (body: {
    first_name: string; last_name: string; email: string; password: string
    user_type: UserType; phone?: string; city?: string; state?: string
  }) =>
    request<{ message: string; user_id: number } & Partial<User>>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  login: (body: { email: string; password: string }) =>
    request<{ message: string } & Partial<User>>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  /** Rehydrate the current session from the backend cookie. */
  me: () => request<{ user: User }>('/api/auth/me'),
}

// ── Users ────────────────────────────────────────────────────
export const usersApi = {
  updateProfile: (body: Partial<Pick<User,
    'first_name' | 'last_name' | 'phone' | 'address' | 'city' | 'state' | 'zip'
  >>) =>
    request<{ message: string; user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

// ── Tradespeople ────────────────────────────────────────────
export const tradespeopleApi = {
  search: (params?: { trade_category?: string; city?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ tradespeople: (TradespersonWithUser & { service_names?: string })[] }>(
      `/api/tradespeople${qs ? `?${qs}` : ''}`,
    )
  },

  getOne: (tp_id: number) =>
    request<{ tradesperson: TradespersonWithUser }>(`/api/tradespeople/${tp_id}`),

  getMe: () =>
    request<{ tradesperson: TradespersonWithUser }>('/api/tradespeople/me'),

  upsert: (body: Partial<Tradesperson>) =>
    request<{ message: string }>('/api/tradespeople/profile', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  requestEndorsement: (supervisor_email: string) =>
    request<{ message: string; supervisor_tradesperson_id: number }>(
      '/api/tradespeople/endorse',
      { method: 'POST', body: JSON.stringify({ supervisor_email }) },
    ),
}

// ── Services ────────────────────────────────────────────────
export const servicesApi = {
  search: (params?: { trade_type?: string; city?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ services: Service[] }>(`/api/services${qs ? `?${qs}` : ''}`)
  },

  getForTradesperson: (tp_id: number) =>
    request<{ services: Service[] }>(`/api/services/tradesperson/${tp_id}`),

  create: (body: {
    service_name: string; description?: string
    hourly_rate?: number; trade_type?: string
  }) =>
    request<{ message: string; service_id: number }>('/api/services', {
      method: 'POST', body: JSON.stringify(body),
    }),
}

// ── Bookings ────────────────────────────────────────────────
// Backend enriches bookings with: service_name, employer_name,
// tradesperson_name, payment_status, payment_amount.
export type EnrichedBooking = BookingWithDetails & {
  service_name?: string
  employer_name?: string
  tradesperson_name?: string
  payment_status?: 'pending' | 'paid' | 'failed'
  payment_amount?: number | null
}

export const bookingsApi = {
  getAll: (params?: { status?: BookingStatus }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ bookings: EnrichedBooking[] }>(
      `/api/bookings${qs ? `?${qs}` : ''}`,
    )
  },

  getOne: (id: number) =>
    request<{ booking: EnrichedBooking }>(`/api/bookings/${id}`),

  create: (body: {
    tradesperson_id: number; service_id: number; scheduled_at: string
    address: string; city: string; quoted_price?: number
  }) =>
    request<{ message: string; booking_id: number }>('/api/bookings', {
      method: 'POST', body: JSON.stringify(body),
    }),

  updateStatus: (id: number, status: BookingStatus) =>
    request<{ message: string }>(`/api/bookings/${id}/status`, {
      method: 'PATCH', body: JSON.stringify({ status }),
    }),
}

// ── Payments ────────────────────────────────────────────────
export const paymentsApi = {
  getForBooking: (booking_id: number) =>
    request<{ payment: Payment | null }>(`/api/payments/booking/${booking_id}`),

  create: (body: { booking_id: number; amount: number; method: PaymentMethod }) =>
    request<{ message: string }>('/api/payments', {
      method: 'POST', body: JSON.stringify(body),
    }),
}

// ── Reviews ─────────────────────────────────────────────────
export type EnrichedReview = Review & {
  tradesperson_name?: string
  reviewer_name?: string
}

export type EnrichedReviewRequest = ReviewRequest & {
  tradesperson_name?: string
  service_name?: string
}

export const reviewsApi = {
  getForTradesperson: (tp_id: number) =>
    request<{ reviews: EnrichedReview[] }>(`/api/reviews/tradesperson/${tp_id}`),

  /** Pending review_requests for the logged-in employer. */
  getRequests: () =>
    request<{ requests: EnrichedReviewRequest[] }>('/api/reviews/requests'),

  /** Reviews already written by the logged-in employer. */
  getSubmitted: () =>
    request<{ reviews: EnrichedReview[] }>('/api/reviews/submitted'),

  submit: (body: {
    booking_id: number; tradesperson_id: number
    rating: number; comment?: string
  }) =>
    request<{ message: string }>('/api/reviews', {
      method: 'POST', body: JSON.stringify(body),
    }),
}

// ── Notifications ────────────────────────────────────────────
export interface NotificationItem {
  id: number
  key: string
  message: string
  created_at: string | null
  time: string         // humanized "2 hrs ago"
  read: boolean
}

export const notificationsApi = {
  getAll: () =>
    request<{ notifications: NotificationItem[]; unread_count: number }>(
      '/api/notifications',
    ),

  markRead: (id: number, key: string) =>
    request<{ message: string }>(
      `/api/notifications/${id}/read?key=${encodeURIComponent(key)}`,
      { method: 'PATCH' },
    ),

  markAllRead: () =>
    request<{ message: string }>('/api/notifications/read-all', {
      method: 'PATCH',
    }),
}

// ── Jobs (tradesperson/junior inbox) ─────────────────────────
export interface AvailableJob {
  id: number
  booking_id: number
  title: string
  trade: string
  city: string
  address: string
  budget: number | null
  employer: string
  employer_id: number
  scheduled_at: string | null
  created_at: string | null
}

export const jobsApi = {
  available: (q?: string) => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : ''
    return request<{ jobs: AvailableJob[] }>(`/api/jobs/available${qs}`)
  },

  cap: () =>
    request<{ job_limit: number; jobs_taken: number; remaining: number }>(
      '/api/jobs/cap',
    ),

  apply: (booking_id: number) =>
    request<{ message: string }>(`/api/jobs/${booking_id}/apply`, {
      method: 'POST',
    }),
}
