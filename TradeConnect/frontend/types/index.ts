// ============================================================
// types/index.ts — mirrors freelancer_db schema exactly
// ============================================================

export type UserType = 'Employer' | 'Tradesperson' | 'Junior'

export interface User {
  user_id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  user_type: UserType
  is_active: boolean
  last_login_at?: string
  created_at: string
}

export interface Tradesperson {
  tradesperson_id: number
  user_id: number
  trade_category: string
  license_number?: string
  license_state?: string
  license_expiry?: string
  experience_year: number
  endorse_id?: number | null  // null = main tradesperson, number = junior under that ID
  job_limit: number
  avg_rating: number
  is_verified: boolean
}

export interface Service {
  service_id: number
  tradesperson_id: number
  service_name: string
  description?: string
  hourly_rate?: number
  trade_type?: string
}

export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
export type PaymentMethod = 'card' | 'cash' | 'online'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface Booking {
  booking_id: number
  user_id: number
  tradesperson_id: number
  service_id: number
  scheduled_at: string
  status: BookingStatus
  city?: string
  address?: string
  quoted_price?: number
  created_at: string
}

export interface Payment {
  payment_id: number
  booking_id: number
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  paid_at?: string
}

export type ReviewRequestStatus = 'pending' | 'submitted'

export interface ReviewRequest {
  review_request_id: number
  booking_id: number
  employer_id: number
  tradesperson_id: number
  status: ReviewRequestStatus
  created_at: string
  submitted_at?: string
}

export interface Review {
  review_id: number
  booking_id: number
  reviewer_user_id: number
  tradesperson_id: number
  rating: number   // 1–5 (CHECK constraint in DB)
  comment?: string
  created_at: string
}

// ── Auth payloads ──────────────────────────────────────────
export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  password: string
  user_type: UserType
  phone?: string
  city?: string
  state?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthResponse {
  message: string
  user?: User
  error?: string
}

// ── Enriched / joined types (for frontend display) ─────────
export interface BookingWithDetails extends Booking {
  service?: Service
  tradesperson_user?: User
  tradesperson?: Tradesperson
  payment?: Payment
}

export interface TradespersonWithUser extends Tradesperson {
  user: User
  services?: Service[]
}
