// Mobirio — Supabase Database Type Definitions (17 tables)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ---------------------------------------------------------------------------
// Enum-like union types
// ---------------------------------------------------------------------------

export type UserRole = "customer" | "vendor" | "admin";
export type EngineType = "electric" | "single" | "parallel_twin" | "v_twin" | "inline_3" | "inline_4" | "supercharged_inline_4" | "flat_6";
export type LicenseType = "none" | "gentsuki" | "kogata" | "futsu" | "oogata";
export type OptionCategory = "safety" | "accessory" | "insurance" | "other";
export type PricingDuration = "2h" | "4h" | "1day" | "24h" | "32h" | "overtime" | "additional24h";
export type RentalDuration = "2h" | "4h" | "1day" | "24h" | "32h";
export type ReservationStatus = "pending" | "confirmed" | "in_use" | "completed" | "cancelled" | "no_show";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded" | "partially_refunded";
export type PaymentType = "ec_credit" | "onsite_cash" | "onsite_credit";
export type PaymentSettlement = "unpaid" | "partial" | "paid" | "refunded";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";
export type NotificationType = "booking_confirmed" | "booking_cancelled" | "booking_reminder" | "review_request" | "payment_received" | "vendor_approved" | "system";
export type VehicleClass = "ev" | "50" | "125" | "250" | "400" | "950" | "1100" | "1500";
export type CouponDiscountType = "fixed" | "percentage";

// ---------------------------------------------------------------------------
// Database interface
// ---------------------------------------------------------------------------

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      // 1. users
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          is_banned: boolean;
          banned_at: string | null;
          banned_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          is_banned?: boolean;
          banned_at?: string | null;
          banned_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          is_banned?: boolean;
          banned_at?: string | null;
          banned_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 2. vendors
      vendors: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          description: string | null;
          address: string | null;
          prefecture: string | null;
          city: string | null;
          postal_code: string | null;
          latitude: number | null;
          longitude: number | null;
          contact_email: string | null;
          contact_phone: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          business_hours: Json | null;
          square_merchant_id: string | null;
          square_access_token: string | null;
          square_location_id: string | null;
          square_oauth_refresh_token: string | null;
          commission_rate: number;
          is_active: boolean;
          is_approved: boolean;
          approved_at: string | null;
          approved_by: string | null;
          rental_hours_start: string | null;
          rental_hours_end: string | null;
          regular_holidays: Json;
          web_stop_rules: Json;
          parking_type: string | null;
          parking_count: number | null;
          jaf_discount_enabled: boolean;
          insurance_company: string | null;
          insurance_phone: string | null;
          line_id: string | null;
          min_rental_age: number;
          two_hour_plan: boolean;
          request_booking: boolean;
          request_cutoff_hours: number;
          store_description_html: string | null;
          youtube_url: string | null;
          payment_cash: boolean;
          payment_credit: boolean;
          report_emails: Json;
          name_en: string | null;
          trade_name: string | null;
          trade_name_en: string | null;
          representative_name: string | null;
          fax: string | null;
          contact_emails: Json;
          access_info: string | null;
          hp_url: string | null;
          corporate_code: string | null;
          branch_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          description?: string | null;
          address?: string | null;
          prefecture?: string | null;
          city?: string | null;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          business_hours?: Json | null;
          square_merchant_id?: string | null;
          square_access_token?: string | null;
          square_location_id?: string | null;
          square_oauth_refresh_token?: string | null;
          commission_rate?: number;
          is_active?: boolean;
          is_approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          rental_hours_start?: string | null;
          rental_hours_end?: string | null;
          regular_holidays?: Json;
          web_stop_rules?: Json;
          parking_type?: string | null;
          parking_count?: number | null;
          jaf_discount_enabled?: boolean;
          insurance_company?: string | null;
          insurance_phone?: string | null;
          line_id?: string | null;
          min_rental_age?: number;
          two_hour_plan?: boolean;
          request_booking?: boolean;
          request_cutoff_hours?: number;
          store_description_html?: string | null;
          youtube_url?: string | null;
          payment_cash?: boolean;
          payment_credit?: boolean;
          report_emails?: Json;
          name_en?: string | null;
          trade_name?: string | null;
          trade_name_en?: string | null;
          representative_name?: string | null;
          fax?: string | null;
          contact_emails?: Json;
          access_info?: string | null;
          hp_url?: string | null;
          corporate_code?: string | null;
          branch_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          address?: string | null;
          prefecture?: string | null;
          city?: string | null;
          postal_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          logo_url?: string | null;
          cover_image_url?: string | null;
          business_hours?: Json | null;
          square_merchant_id?: string | null;
          square_access_token?: string | null;
          square_location_id?: string | null;
          square_oauth_refresh_token?: string | null;
          commission_rate?: number;
          is_active?: boolean;
          is_approved?: boolean;
          approved_at?: string | null;
          approved_by?: string | null;
          rental_hours_start?: string | null;
          rental_hours_end?: string | null;
          regular_holidays?: Json;
          web_stop_rules?: Json;
          parking_type?: string | null;
          parking_count?: number | null;
          jaf_discount_enabled?: boolean;
          insurance_company?: string | null;
          insurance_phone?: string | null;
          line_id?: string | null;
          min_rental_age?: number;
          two_hour_plan?: boolean;
          request_booking?: boolean;
          request_cutoff_hours?: number;
          store_description_html?: string | null;
          youtube_url?: string | null;
          payment_cash?: boolean;
          payment_credit?: boolean;
          report_emails?: Json;
          name_en?: string | null;
          trade_name?: string | null;
          trade_name_en?: string | null;
          representative_name?: string | null;
          fax?: string | null;
          contact_emails?: Json;
          access_info?: string | null;
          hp_url?: string | null;
          corporate_code?: string | null;
          branch_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 3. vendor_business_hours
      vendor_business_hours: {
        Row: {
          id: string;
          vendor_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          day_of_week?: number;
          open_time?: string;
          close_time?: string;
          is_closed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // 4. vendor_holidays
      vendor_holidays: {
        Row: {
          id: string;
          vendor_id: string;
          date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          date?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // 5. bikes
      bikes: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          model: string;
          manufacturer: string;
          year: number | null;
          displacement: number | null;
          engine_type: EngineType | null;
          seat_height: number | null;
          weight: number | null;
          license_type: LicenseType | null;
          description: string | null;
          image_urls: string[];
          hourly_rate_2h: number;
          hourly_rate_4h: number;
          daily_rate_1day: number;
          daily_rate_24h: number;
          daily_rate_32h: number;
          overtime_rate_per_hour: number;
          additional_24h_rate: number;
          is_available: boolean;
          is_featured: boolean;
          sort_order: number;
          is_published: boolean;
          model_code: string | null;
          frame_number: string | null;
          display_name: string | null;
          color: string | null;
          model_year: number | null;
          first_registration: string | null;
          inspection_expiry: string | null;
          registration_number: string | null;
          insurance_status: string;
          inspection_file_url: string | null;
          equipment: Json;
          is_long_term: boolean;
          long_term_discount: Json | null;
          youtube_url: string | null;
          notes_html: string | null;
          current_mileage: number;
          display_order: number;
          suspension_periods: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          name: string;
          model: string;
          manufacturer: string;
          year?: number | null;
          displacement?: number | null;
          engine_type?: EngineType | null;
          seat_height?: number | null;
          weight?: number | null;
          license_type?: LicenseType | null;
          description?: string | null;
          image_urls?: string[];
          hourly_rate_2h: number;
          hourly_rate_4h: number;
          daily_rate_1day: number;
          daily_rate_24h: number;
          daily_rate_32h: number;
          overtime_rate_per_hour: number;
          additional_24h_rate: number;
          is_available?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          is_published?: boolean;
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
          equipment?: Json;
          is_long_term?: boolean;
          long_term_discount?: Json | null;
          youtube_url?: string | null;
          notes_html?: string | null;
          current_mileage?: number;
          display_order?: number;
          suspension_periods?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          name?: string;
          model?: string;
          manufacturer?: string;
          year?: number | null;
          displacement?: number | null;
          engine_type?: EngineType | null;
          seat_height?: number | null;
          weight?: number | null;
          license_type?: LicenseType | null;
          description?: string | null;
          image_urls?: string[];
          hourly_rate_2h?: number;
          hourly_rate_4h?: number;
          daily_rate_1day?: number;
          daily_rate_24h?: number;
          daily_rate_32h?: number;
          overtime_rate_per_hour?: number;
          additional_24h_rate?: number;
          is_available?: boolean;
          is_featured?: boolean;
          sort_order?: number;
          is_published?: boolean;
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
          equipment?: Json;
          is_long_term?: boolean;
          long_term_discount?: Json | null;
          youtube_url?: string | null;
          notes_html?: string | null;
          current_mileage?: number;
          display_order?: number;
          suspension_periods?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 6. bike_images
      bike_images: {
        Row: {
          id: string;
          bike_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          bike_id: string;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          bike_id?: string;
          url?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // 7. options
      options: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          description: string | null;
          category: OptionCategory;
          price_per_day: number | null;
          price_per_use: number | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          name: string;
          description?: string | null;
          category: OptionCategory;
          price_per_day?: number | null;
          price_per_use?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          name?: string;
          description?: string | null;
          category?: OptionCategory;
          price_per_day?: number | null;
          price_per_use?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 8. bike_options
      bike_options: {
        Row: {
          id: string;
          bike_id: string;
          option_id: string;
          is_included: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          bike_id: string;
          option_id: string;
          is_included?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          bike_id?: string;
          option_id?: string;
          is_included?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // 9. pricing_rules
      pricing_rules: {
        Row: {
          id: string;
          vendor_id: string;
          bike_id: string | null;
          duration: PricingDuration;
          price: number;
          is_active: boolean;
          valid_from: string | null;
          valid_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          bike_id?: string | null;
          duration: PricingDuration;
          price: number;
          is_active?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          bike_id?: string | null;
          duration?: PricingDuration;
          price?: number;
          is_active?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 10. reservations
      reservations: {
        Row: {
          id: string;
          user_id: string;
          bike_id: string;
          vendor_id: string;
          start_datetime: string;
          end_datetime: string;
          rental_duration: RentalDuration;
          status: ReservationStatus;
          base_amount: number;
          option_amount: number;
          cdw_amount: number;
          noc_amount: number;
          insurance_amount: number;
          total_amount: number;
          payment_settlement: PaymentSettlement;
          checkin_at: string | null;
          checkout_at: string | null;
          notes: string | null;
          cancel_reason: string | null;
          cancelled_at: string | null;
          departure_mileage: number | null;
          return_mileage: number | null;
          memo: string | null;
          customer_note: string | null;
          contract_output_count: number;
          contract_last_output: string | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          additional_charges: Json | null;
          cdw_enabled: boolean;
          coupon_code: string | null;
          coupon_discount: number;
          jaf_discount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bike_id: string;
          vendor_id: string;
          start_datetime: string;
          end_datetime: string;
          rental_duration: RentalDuration;
          status?: ReservationStatus;
          base_amount: number;
          option_amount?: number;
          cdw_amount?: number;
          noc_amount?: number;
          insurance_amount?: number;
          total_amount: number;
          payment_settlement?: PaymentSettlement;
          checkin_at?: string | null;
          checkout_at?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          departure_mileage?: number | null;
          return_mileage?: number | null;
          memo?: string | null;
          customer_note?: string | null;
          contract_output_count?: number;
          contract_last_output?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          additional_charges?: Json | null;
          cdw_enabled?: boolean;
          coupon_code?: string | null;
          coupon_discount?: number;
          jaf_discount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bike_id?: string;
          vendor_id?: string;
          start_datetime?: string;
          end_datetime?: string;
          rental_duration?: RentalDuration;
          status?: ReservationStatus;
          base_amount?: number;
          option_amount?: number;
          cdw_amount?: number;
          noc_amount?: number;
          insurance_amount?: number;
          total_amount?: number;
          payment_settlement?: PaymentSettlement;
          checkin_at?: string | null;
          checkout_at?: string | null;
          notes?: string | null;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          departure_mileage?: number | null;
          return_mileage?: number | null;
          memo?: string | null;
          customer_note?: string | null;
          contract_output_count?: number;
          contract_last_output?: string | null;
          confirmed_at?: string | null;
          confirmed_by?: string | null;
          additional_charges?: Json | null;
          cdw_enabled?: boolean;
          coupon_code?: string | null;
          coupon_discount?: number;
          jaf_discount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 11. reservation_options
      reservation_options: {
        Row: {
          id: string;
          reservation_id: string;
          option_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          option_id: string;
          quantity: number;
          unit_price: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          reservation_id?: string;
          option_id?: string;
          quantity?: number;
          unit_price?: number;
          subtotal?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      // 12. payments
      payments: {
        Row: {
          id: string;
          reservation_id: string;
          vendor_id: string;
          payment_type: PaymentType;
          square_payment_id: string | null;
          square_order_id: string | null;
          square_location_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          refund_amount: number | null;
          note: string | null;
          square_response: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          vendor_id: string;
          payment_type: PaymentType;
          square_payment_id?: string | null;
          square_order_id?: string | null;
          square_location_id?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          refund_amount?: number | null;
          note?: string | null;
          square_response?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reservation_id?: string;
          vendor_id?: string;
          payment_type?: PaymentType;
          square_payment_id?: string | null;
          square_order_id?: string | null;
          square_location_id?: string | null;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          refund_amount?: number | null;
          note?: string | null;
          square_response?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 13. vendor_payouts
      vendor_payouts: {
        Row: {
          id: string;
          vendor_id: string;
          period_start: string;
          period_end: string;
          gross_amount: number;
          commission_amount: number;
          net_amount: number;
          status: PayoutStatus;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          period_start: string;
          period_end: string;
          gross_amount: number;
          commission_amount: number;
          net_amount: number;
          status?: PayoutStatus;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          period_start?: string;
          period_end?: string;
          gross_amount?: number;
          commission_amount?: number;
          net_amount?: number;
          status?: PayoutStatus;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 14. reviews
      reviews: {
        Row: {
          id: string;
          reservation_id: string;
          user_id: string;
          bike_id: string;
          vendor_id: string;
          rating: number;
          title: string | null;
          comment: string | null;
          vendor_reply: string | null;
          vendor_replied_at: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reservation_id: string;
          user_id: string;
          bike_id: string;
          vendor_id: string;
          rating: number;
          title?: string | null;
          comment?: string | null;
          vendor_reply?: string | null;
          vendor_replied_at?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reservation_id?: string;
          user_id?: string;
          bike_id?: string;
          vendor_id?: string;
          rating?: number;
          title?: string | null;
          comment?: string | null;
          vendor_reply?: string | null;
          vendor_replied_at?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 15. favorites
      favorites: {
        Row: {
          id: string;
          user_id: string;
          bike_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bike_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bike_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      // 16. notifications
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          body?: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // 17. messages
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          reservation_id: string | null;
          subject: string | null;
          body: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          reservation_id?: string | null;
          subject?: string | null;
          body: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          reservation_id?: string | null;
          subject?: string | null;
          body?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // 18. vendor_closures
      vendor_closures: {
        Row: {
          id: string;
          vendor_id: string;
          closure_date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          closure_date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          closure_date?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // 19. vendor_announcements
      vendor_announcements: {
        Row: {
          id: string;
          vendor_id: string;
          announcement_type: string;
          title: string;
          url: string | null;
          image_url: string | null;
          detail_html: string | null;
          published_from: string | null;
          published_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          announcement_type?: string;
          title: string;
          url?: string | null;
          image_url?: string | null;
          detail_html?: string | null;
          published_from?: string | null;
          published_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          announcement_type?: string;
          title?: string;
          url?: string | null;
          image_url?: string | null;
          detail_html?: string | null;
          published_from?: string | null;
          published_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 20. shop_reviews
      shop_reviews: {
        Row: {
          id: string;
          vendor_id: string;
          user_id: string | null;
          reservation_id: string | null;
          nickname: string | null;
          content: string;
          reply: string | null;
          reply_by: string | null;
          reply_at: string | null;
          is_published: boolean;
          posted_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          user_id?: string | null;
          reservation_id?: string | null;
          nickname?: string | null;
          content: string;
          reply?: string | null;
          reply_by?: string | null;
          reply_at?: string | null;
          is_published?: boolean;
          posted_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          user_id?: string | null;
          reservation_id?: string | null;
          nickname?: string | null;
          content?: string;
          reply?: string | null;
          reply_by?: string | null;
          reply_at?: string | null;
          is_published?: boolean;
          posted_at?: string;
        };
        Relationships: [];
      };

      // 21. vendor_inquiries
      vendor_inquiries: {
        Row: {
          id: string;
          vendor_id: string;
          reservation_id: string | null;
          user_id: string | null;
          content: string;
          reply: string | null;
          status: string;
          created_at: string;
          replied_at: string | null;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          reservation_id?: string | null;
          user_id?: string | null;
          content: string;
          reply?: string | null;
          status?: string;
          created_at?: string;
          replied_at?: string | null;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          reservation_id?: string | null;
          user_id?: string | null;
          content?: string;
          reply?: string | null;
          status?: string;
          created_at?: string;
          replied_at?: string | null;
        };
        Relationships: [];
      };

      // 22. system_settings
      system_settings: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 23. page_views
      page_views: {
        Row: {
          id: string;
          vendor_id: string | null;
          bike_id: string | null;
          page_type: string;
          device_type: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          vendor_id?: string | null;
          bike_id?: string | null;
          page_type: string;
          device_type?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string | null;
          bike_id?: string | null;
          page_type?: string;
          device_type?: string | null;
          viewed_at?: string;
        };
        Relationships: [];
      };

      // 24. coupons
      coupons: {
        Row: {
          id: string;
          vendor_id: string;
          code: string;
          name: string;
          description: string | null;
          discount_type: CouponDiscountType;
          discount_value: number;
          max_discount: number | null;
          min_order_amount: number;
          usage_limit: number | null;
          usage_count: number;
          per_user_limit: number;
          valid_from: string | null;
          valid_until: string | null;
          is_active: boolean;
          target_bike_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          code: string;
          name: string;
          description?: string | null;
          discount_type: CouponDiscountType;
          discount_value: number;
          max_discount?: number | null;
          min_order_amount?: number;
          usage_limit?: number | null;
          usage_count?: number;
          per_user_limit?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
          target_bike_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          discount_type?: CouponDiscountType;
          discount_value?: number;
          max_discount?: number | null;
          min_order_amount?: number;
          usage_limit?: number | null;
          usage_count?: number;
          per_user_limit?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
          target_bike_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 25. coupon_usages
      coupon_usages: {
        Row: {
          id: string;
          coupon_id: string;
          reservation_id: string;
          user_id: string;
          discount_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          reservation_id: string;
          user_id: string;
          discount_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          coupon_id?: string;
          reservation_id?: string;
          user_id?: string;
          discount_amount?: number;
          created_at?: string;
        };
        Relationships: [];
      };

      // Also keep legacy alias for backward compat
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
  };
}

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// ---------------------------------------------------------------------------
// Convenience aliases — Row types
// ---------------------------------------------------------------------------

export type User = Tables<"users">;
export type Vendor = Tables<"vendors">;
export type VendorBusinessHour = Tables<"vendor_business_hours">;
export type VendorHoliday = Tables<"vendor_holidays">;
export type DbBike = Tables<"bikes">;
export type BikeImage = Tables<"bike_images">;
export type Option = Tables<"options">;
export type BikeOption = Tables<"bike_options">;
export type PricingRule = Tables<"pricing_rules">;
export type Reservation = Tables<"reservations">;
export type ReservationOption = Tables<"reservation_options">;
export type Payment = Tables<"payments">;
export type VendorPayout = Tables<"vendor_payouts">;
export type Review = Tables<"reviews">;
export type Favorite = Tables<"favorites">;
export type Notification = Tables<"notifications">;
export type Message = Tables<"messages">;
export type VendorClosure = Tables<"vendor_closures">;
export type VendorAnnouncement = Tables<"vendor_announcements">;
export type ShopReview = Tables<"shop_reviews">;
export type VendorInquiry = Tables<"vendor_inquiries">;
export type PageView = Tables<"page_views">;
export type SystemSetting = Tables<"system_settings">;
export type Coupon = Tables<"coupons">;
export type CouponUsage = Tables<"coupon_usages">;
