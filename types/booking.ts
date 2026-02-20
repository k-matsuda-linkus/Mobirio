// Mobirio Booking & Bike Types

import type { VehicleClass } from "@/types/database";

export interface Bike {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  displacement: number | null;
  vehicle_class: VehicleClass;
  hourly_rate_2h: number;
  hourly_rate_4h: number;
  daily_rate_1day: number;
  daily_rate_24h: number;
  daily_rate_32h: number;
  overtime_rate_per_hour: number;
  additional_24h_rate: number;
  image_urls: string[];
  is_available: boolean;
  engine_type: string;
  license_type: string;
  vendor_id: string;
  year?: number | null;
  seat_height?: number | null;
  weight?: number | null;
  description?: string;
  is_featured?: boolean;
  /** 任意保険種別: "mobirio" = Mobirio保険, "other" = 他社保険 */
  insurance_type?: "mobirio" | "other";
  model_code?: string | null;
  frame_number?: string | null;
  display_name?: string | null;
  color?: string | null;
  model_year?: number | null;
  first_registration?: string | null;
  inspection_expiry?: string | null;
  registration_number?: string | null;
  insurance_status?: string;
  inspection_file_url?: string | null;
  equipment?: Record<string, boolean>;
  is_long_term?: boolean;
  youtube_url?: string | null;
  notes_html?: string | null;
  current_mileage?: number;
  display_order?: number;
  is_published?: boolean;
  suspension_periods?: Array<{ id: string; startDate: string; endDate: string }>;
  created_at?: string;
  updated_at?: string;
}

export interface BikeSpecs {
  manufacturer: string;
  model: string;
  year?: number;
  displacement: number;
  engine_type: string;
  seat_height?: number;
  weight?: number;
  license_type: string;
}

export interface BikeSearchFilter {
  keyword: string;
  vehicleClasses: string[];
  priceMin: number | null;
  priceMax: number | null;
  manufacturers: string[];
  sortBy: string;
}

export interface Booking {
  id: string;
  bike_id: string;
  user_id: string;
  vendor_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

export interface DayAvailability {
  date: string;
  status: 'available' | 'booked' | 'unavailable';
}

export type ReservationStatus = 'pending' | 'confirmed' | 'in_use' | 'completed' | 'cancelled' | 'no_show';

export interface BookingFormData {
  bikeId: string;
  vendorId: string;
  startDatetime: string;
  endDatetime: string;
  options: string[];
  cdw: boolean;
  couponCode?: string;
}

export interface PriceCalculation {
  baseAmount: number;
  optionAmount: number;
  cdwAmount: number;
  totalAmount: number;
  rentalDuration: string;
  days: number;
  overtimeHours: number;
}

export interface AvailabilityResult {
  available: boolean;
  conflicts: string[];
}
