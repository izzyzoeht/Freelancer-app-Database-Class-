// ============================================================
// lib/api.ts - every Flask API call in one place.
// Mirrors the backend route map after Phase 1+2+3.
// ============================================================

import type {
  User, UserType,
  Tradesperson, TradespersonWithUser,
  Service,
  BookingWithDetails, BookingStatus,
  Payment, PaymentMethod, Subscription,
  Review, ReviewRequest,
  JobPosting, JobPostingStatus,
  JobApplication, ApplicationStatus,
  EndorsementRequest, EndorsementStatus,
  UploadedDocument,
} from '@/types'

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = options.body instanceof FormData
    ? options.headers
    : { 'Content-Type': 'application/json', ...options.headers }

  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  })

  const text = await res.text()
  let data: any = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { error: text || `Request failed with status ${res.status}` }
  }

  if (!res.ok) {
    throw new Error(data.error ?? `Request failed with status ${res.status}`)
  }

  return data as T
}

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

  me: () => request<{ user: User }>('/api/auth/me'),
}

export const usersApi = {
  updateProfile: (body: Partial<Pick<User,
    'first_name' | 'last_name' | 'phone' | 'address' | 'city' | 'state' | 'zip'
  >>) =>
    request<{ message: string; user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

export const tradespeopleApi = {
  search: (params?: { trade_category?: string; city?: string }) => {
    const qs = new URLSearchParams()
    if (params?.trade_category) qs.append('trade_category', params.trade_category)
    if (params?.city) qs.append('city', params.city)
    return request<{ tradespeople: TradespersonWithUser[] }>(
      `/api/tradespeople${qs.toString() ? `?${qs}` : ''}`,
    )
  },
  getById: (tp_id: number) =>
    request<{ tradesperson: TradespersonWithUser }>(`/api/tradespeople/${tp_id}`),

  getMe: () =>
    request<{ tradesperson: TradespersonWithUser }>('/api/tradespeople/me'),

  updateProfile: (body: Partial<Pick<Tradesperson,
    'trade_category' | 'experience_year' | 'bio' | 'hourly_rate' | 'availability'
  >>) =>
    request<{ message: string }>('/api/tradespeople/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

export const servicesApi = {
  search: (params?: { trade_category?: string; city?: string }) => {
    const qs = new URLSearchParams()
    if (params?.trade_category) qs.append('trade_category', params.trade_category)
    if (params?.city) qs.append('city', params.city)
    return request<{ services: Service[] }>(
      `/api/services${qs ? `?${qs}` : ''}`,
    )
  },
  getByTradesperson: (tp_id: number) =>
    request<{ services: Service[] }>(`/api/services/tradesperson/${tp_id}`),

  create: (body: Partial<Pick<Service, 'service_name' | 'description' | 'base_price'>>) =>
    request<{ message: string; service_id: number }>('/api/services', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (service_id: number, body: Partial<Pick<Service, 'service_name' | 'description' | 'base_price'>>) =>
    request<{ message: string }>(`/api/services/${service_id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (service_id: number) =>
    request<{ message: string }>(`/api/services/${service_id}`, { method: 'DELETE' }),
}

export const bookingsApi = {
  search: (params?: { status?: BookingStatus; city?: string }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.append('status', params.status)
    if (params?.city) qs.append('city', params.city)
    return request<{ bookings: BookingWithDetails[] }>(
      `/api/bookings${qs ? `?${qs}` : ''}`,
    )
  },
  getById: (id: number) =>
    request<{ booking: BookingWithDetails }>(`/api/bookings/${id}`),

  create: (body: {
    service_id?: number; tradesperson_id?: number; job_posting_id?: number
    scheduled_date: string; notes?: string; total_price?: number
  }) =>
    request<{ message: string; booking_id: number }>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateStatus: (id: number, body: { status: BookingStatus; completion_notes?: string }) =>
    request<{ message: string }>(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
}

export const paymentsApi = {
  getByBooking: (booking_id: number) =>
    request<{ payment: Payment | null }>(`/api/payments/booking/${booking_id}`),

  create: (body: {
    booking_id: number; amount: number; payment_method: PaymentMethod
  }) =>
    request<{ message: string; payment: Payment }>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export const subscriptionsApi = {
  getPlans: () =>
    request<{ plans: any[] }>('/api/subscriptions/plans'),

  getMe: () =>
    request<{ subscription: Subscription | null }>('/api/subscriptions/me'),

  subscribe: (body: { plan_id: number }) =>
    request<{ message: string; subscription: Subscription }>('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  cancel: () =>
    request<{ message: string }>('/api/subscriptions/me/cancel', { method: 'POST' }),
}

export const reviewsApi = {
  getByTradesperson: (tp_id: number) =>
    request<{ reviews: Review[] }>(`/api/reviews/tradesperson/${tp_id}`),

  getRequests: () =>
    request<{ requests: ReviewRequest[] }>('/api/reviews/requests'),

  getSubmitted: () =>
    request<{ reviews: Review[] }>('/api/reviews/submitted'),

  create: (body: {
    booking_id: number; rating: number; comment?: string
  }) =>
    request<{ message: string; review: Review }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export const jobPostingsApi = {
  search: (params?: { status?: JobPostingStatus; trade_category?: string; city?: string }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.append('status', params.status)
    if (params?.trade_category) qs.append('trade_category', params.trade_category)
    if (params?.city) qs.append('city', params.city)
    return request<{ postings: JobPosting[] }>(
      `/api/job_postings${qs ? `?${qs}` : ''}`,
    )
  },
  getById: (posting_id: number) =>
    request<{ posting: JobPosting }>(`/api/job_postings/${posting_id}`),

  create: (body: {
    title: string; description: string; trade_category: string
    city?: string; budget?: number; deadline?: string
  }) =>
    request<{ message: string; posting_id: number }>('/api/job_postings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  close: (posting_id: number) =>
    request<{ message: string }>(`/api/job_postings/${posting_id}/close`, { method: 'POST' }),

  cancel: (posting_id: number) =>
    request<{ message: string }>(`/api/job_postings/${posting_id}/cancel`, { method: 'POST' }),
}

export const jobApplicationsApi = {
  getMine: () =>
    request<{ applications: JobApplication[] }>('/api/job_applications/mine'),

  create: (body: { posting_id: number; message?: string }) =>
    request<{ message: string; application_id: number }>('/api/job_applications', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  decide: (application_id: number, body: { action: ApplicationStatus }) =>
    request<{ message: string }>(`/api/job_applications/${application_id}/decide`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  withdraw: (application_id: number) =>
    request<{ message: string }>(`/api/job_applications/${application_id}/withdraw`, { method: 'POST' }),
}

export const endorsementRequestsApi = {
  getMine: () =>
    request<{ requests: EndorsementRequest[] }>('/api/endorsement_requests/mine'),

  getIncoming: () =>
    request<{ requests: EndorsementRequest[] }>('/api/endorsement_requests/incoming'),

  create: (body: { tradesperson_id: number; skill: string; message?: string }) =>
    request<{ message: string; request_id: number }>('/api/endorsement_requests', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  decide: (request_id: number, body: { action: EndorsementStatus }) =>
    request<{ message: string }>(`/api/endorsement_requests/${request_id}/decide`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  withdraw: (request_id: number) =>
    request<{ message: string }>(`/api/endorsement_requests/${request_id}/withdraw`, { method: 'POST' }),
}

export const notificationsApi = {
  getAll: () =>
    request<{ notifications: any[] }>('/api/notifications'),

  markRead: (notification_id: number) =>
    request<{ message: string }>(`/api/notifications/${notification_id}/read`, { method: 'POST' }),

  markAllRead: () =>
    request<{ message: string }>('/api/notifications/read-all', { method: 'POST' }),
}

export const documentsApi = {
  getMine: () =>
    request<{ documents: UploadedDocument[] }>('/api/documents/mine'),

  getInfo: (doc_id: number) =>
    request<{ document: UploadedDocument }>(`/api/documents/${doc_id}/info`),

  upload: (formData: FormData) =>
    request<{ message: string; document_id: number }>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    }),

  delete: (doc_id: number) =>
    request<{ message: string }>(`/api/documents/${doc_id}`, { method: 'DELETE' }),
}

export const adminApi = {
  getSettings: () =>
    request<{ settings: any }>('/api/admin/settings'),

  updateSettings: (body: any) =>
    request<{ message: string }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  getUsers: () =>
    request<{ users: User[] }>('/api/admin/users'),

  updateUser: (user_id: number, body: Partial<User>) =>
    request<{ message: string }>(`/api/admin/users/${user_id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  getSubscriptionPlans: () =>
    request<{ plans: any[] }>('/api/admin/subscription-plans'),

  createSubscriptionPlan: (body: any) =>
    request<{ message: string; plan_id: number }>('/api/admin/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateSubscriptionPlan: (plan_id: number, body: any) =>
    request<{ message: string }>(`/api/admin/subscription-plans/${plan_id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
}

export const revenueApi = {
  getSummary: () =>
    request<{ summary: any }>('/api/revenue/summary'),

  export: (format: 'csv' | 'xlsx') =>
    request<Blob>(`/api/revenue/export?format=${format}`),
}
