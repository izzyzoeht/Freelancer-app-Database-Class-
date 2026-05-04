// ============================================================
// lib/api.ts — all Flask API calls in one place
// Base URL is read from .env.local → NEXT_PUBLIC_API_URL
// ============================================================

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 
      'Content-Type': 'application/json', 
      ...options.headers 
    },
    ...options,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : {}

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed with status ${res.status}`)
  }

  return data as T
}

// ── Auth (/api/auth) ─────────────────────────────────────────
// Routes: routes/auth.py  ✅ implemented

export const authApi = {
  /** POST /api/auth/register */
  register: (body: {
    first_name: string
    last_name: string
    email: string
    password: string
    user_type: string
    phone?: string
    city?: string
    state?: string
  }) => request<{ message: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  /** POST /api/auth/login */
  login: (body: { email: string; password: string }) =>
    request<{ message: string; user_id?: number }>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  /** POST /api/auth/logout */
  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),
}

// ── Reviews (/api/reviews) ───────────────────────────────────
// Routes: routes/reviews.py  ⚠️  not yet implemented — stubs below

export const reviewsApi = {
  /** GET /api/reviews/tradesperson/:id */
  getForTradesperson: (tradesperson_id: number) =>
    request<{ reviews: import('@/types').Review[] }>(`/api/reviews/tradesperson/${tradesperson_id}`),

  /** GET /api/reviews/requests — pending requests for logged-in employer */
  getRequests: () =>
    request<{ requests: import('@/types').ReviewRequest[] }>('/api/reviews/requests'),

  /** POST /api/reviews */
  submit: (body: { booking_id: number; tradesperson_id: number; rating: number; comment?: string }) =>
    request<{ message: string }>('/api/reviews', { method: 'POST', body: JSON.stringify(body) }),
}

// ── Notifications (/api/notifications) ──────────────────────
// Routes: routes/notifications.py  ⚠️  not yet implemented

export const notificationsApi = {
  /** GET /api/notifications */
  getAll: () => request<{ notifications: unknown[] }>('/api/notifications'),

  /** PATCH /api/notifications/:id/read */
  markRead: (id: number) =>
    request<{ message: string }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
}

// ── Bookings (/api/bookings) ─────────────────────────────────
// ⚠️  not yet implemented — add routes as team builds them

export const bookingsApi = {
  /** GET /api/bookings — bookings for logged-in user */
  getAll: () => request<{ bookings: import('@/types').Booking[] }>('/api/bookings'),

  /** GET /api/bookings/:id */
  getOne: (id: number) => request<{ booking: import('@/types').BookingWithDetails }>(`/api/bookings/${id}`),

  /** POST /api/bookings */
  create: (body: {
    tradesperson_id: number
    service_id: number
    scheduled_at: string
    address: string
    city: string
  }) => request<{ message: string; booking_id: number }>('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),

  /** PATCH /api/bookings/:id/status */
  updateStatus: (id: number, status: import('@/types').BookingStatus) =>
    request<{ message: string }>(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}

// ── Services (/api/services) ─────────────────────────────────
// ⚠️  not yet implemented

export const servicesApi = {
  /** GET /api/services?trade_type=Plumbing&city=NYC */
  search: (params?: { trade_type?: string; city?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ services: import('@/types').Service[] }>(`/api/services${qs ? `?${qs}` : ''}`)
  },

  /** GET /api/services/tradesperson/:id */
  getForTradesperson: (tradesperson_id: number) =>
    request<{ services: import('@/types').Service[] }>(`/api/services/tradesperson/${tradesperson_id}`),
}

// ── Payments (/api/payments) ─────────────────────────────────
// ⚠️  not yet implemented

export const paymentsApi = {
  /** GET /api/payments/booking/:id */
  getForBooking: (booking_id: number) =>
    request<{ payment: import('@/types').Payment }>(`/api/payments/booking/${booking_id}`),

  /** POST /api/payments */
  create: (body: { booking_id: number; amount: number; method: import('@/types').PaymentMethod }) =>
    request<{ message: string }>('/api/payments', { method: 'POST', body: JSON.stringify(body) }),
}

// ── Tradespeople (/api/tradespeople) ────────────────────────
// ⚠️  not yet implemented

export const tradespeopleApi = {
  /** GET /api/tradespeople — browse/search */
  search: (params?: { trade_category?: string; city?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request<{ tradespeople: import('@/types').TradespersonWithUser[] }>(`/api/tradespeople${qs ? `?${qs}` : ''}`)
  },

  /** GET /api/tradespeople/:id */
  getOne: (id: number) =>
    request<{ tradesperson: import('@/types').TradespersonWithUser }>(`/api/tradespeople/${id}`),

  /** POST /api/tradespeople/profile — create/update tradesperson profile */
  upsert: (body: Partial<import('@/types').Tradesperson>) =>
    request<{ message: string }>('/api/tradespeople/profile', { method: 'POST', body: JSON.stringify(body) }),
}
