// Hand-written types matching supabase/migrations/0001_init.sql.
// If you have the Supabase CLI linked to your project, you can regenerate
// this file precisely with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Required by newer @supabase/postgrest-js versions to determine feature
  // availability (e.g. maxAffected, spread-on-many). Matches the deployed
  // Supabase Postgres/PostgREST version.
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          is_wysa: boolean;
          created_at: string;
          average_rating: number | null;
          total_ratings: number | null;
          total_tasks_completed: number | null;
          total_tasks_posted: number | null;
          display_name: string | null;
          date_of_birth: string | null;
          gender: string | null;
          bio: string | null;
          worker_id: string | null;
          account_status: string;
          verification_status: string;
          is_available: boolean;
          on_time_rate: number | null;
          cancellation_rate: number | null;
          email_verified: boolean;
          phone_verified: boolean;
          available_now: boolean;
          accept_emergency_tasks: boolean;
          onboarding_completed: boolean;
          onboarding_step: number;
          role: "customer" | "worker" | null;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_wysa?: boolean;
          created_at?: string;
          average_rating?: number | null;
          total_ratings?: number | null;
          total_tasks_completed?: number | null;
          total_tasks_posted?: number | null;
          display_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          bio?: string | null;
          worker_id?: string | null;
          account_status?: string;
          verification_status?: string;
          is_available?: boolean;
          on_time_rate?: number | null;
          cancellation_rate?: number | null;
          email_verified?: boolean;
          phone_verified?: boolean;
          available_now?: boolean;
          accept_emergency_tasks?: boolean;
          role?: "customer" | "worker" | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_wysa?: boolean;
          created_at?: string;
          average_rating?: number | null;
          total_ratings?: number | null;
          total_tasks_completed?: number | null;
          total_tasks_posted?: number | null;
          display_name?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          bio?: string | null;
          worker_id?: string | null;
          account_status?: string;
          verification_status?: string;
          is_available?: boolean;
          on_time_rate?: number | null;
          cancellation_rate?: number | null;
          email_verified?: boolean;
          phone_verified?: boolean;
          available_now?: boolean;
          accept_emergency_tasks?: boolean;
          role?: "customer" | "worker" | null;
        };
        Relationships: [];
      };
      wysa_profiles: {
        Row: {
          id: string;
          area: string;
          bio: string;
          languages: string[];
          interests: string[];
          activities: string[];
          skills: string[];
          price_per_hour: number;
          verified: boolean;
          rating: number;
          sessions_count: number;
          availability_note: string;
          created_at: string;
        };
        Insert: {
          id: string;
          area?: string;
          bio?: string;
          languages?: string[];
          interests?: string[];
          activities?: string[];
          skills?: string[];
          price_per_hour?: number;
          verified?: boolean;
          rating?: number;
          sessions_count?: number;
          availability_note?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wysa_profiles"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          customer_id: string;
          title: string;
          description: string;
          category: string;
          area: string;
          location_note: string;
          task_date: string | null;
          task_time: string | null;
          duration_id: string;
          custom_hours: number;
          budget: number;
          languages: string[];
          interests: string[];
          platform_fee: number;
          total: number;
          payment_method: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          status: string;
          interested_count: number;
          accepted_wysa_id: string | null;
          confirmed_wysa_id: string | null;
          dispute_reason: string | null;
          dispute_submitted_at: string | null;
          photos: string[] | null;
          location_coordinates: { lat: number; lng: number } | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          customer_id: string;
          title: string;
          description: string;
          category?: string;
          area?: string;
          location_note?: string;
          task_date?: string | null;
          task_time?: string | null;
          duration_id?: string;
          custom_hours?: number;
          budget?: number;
          languages?: string[];
          interests?: string[];
          platform_fee?: number;
          total?: number;
          payment_method?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          status?: string;
          interested_count?: number;
          accepted_wysa_id?: string | null;
          confirmed_wysa_id?: string | null;
          dispute_reason?: string | null;
          dispute_submitted_at?: string | null;
          photos?: string[] | null;
          location_coordinates?: { lat: number; lng: number } | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          task_id: string;
          rater_id: string;
          ratee_id: string;
          stars: number;
          review: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          rater_id: string;
          ratee_id: string;
          stars: number;
          review?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ratings"]["Insert"]>;
        Relationships: [];
      };
      wysa_applications: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          preferred_name: string | null;
          age: number;
          area: string;
          phone: string;
          languages: string[];
          interests: string[];
          activities: string[];
          intro: string;
          hourly_rate: number | null;
          availability: string | null;
          photo_url: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          preferred_name?: string | null;
          age: number;
          area: string;
          phone: string;
          languages?: string[];
          interests?: string[];
          activities?: string[];
          intro: string;
          hourly_rate?: number | null;
          availability?: string | null;
          photo_url?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wysa_applications"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          task_id: string;
          sender_id: string;
          receiver_id: string;
          message_text: string;
          message_type: string;
          image_url: string | null;
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          sender_id: string;
          receiver_id: string;
          message_text: string;
          message_type?: string;
          image_url?: string | null;
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string | null;
          auth: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
          last_used_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh?: string | null;
          auth?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          task_updates: boolean;
          new_messages: boolean;
          payment_notifications: boolean;
          marketing_notifications: boolean;
          email_notifications: boolean;
          push_notifications: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_updates?: boolean;
          new_messages?: boolean;
          payment_notifications?: boolean;
          marketing_notifications?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_preferences"]["Insert"]>;
        Relationships: [];
      };
      identity_verifications: {
        Row: {
          id: string;
          user_id: string;
          verification_type: "aadhaar" | "pan";
          provider: string;
          status: "pending" | "verified" | "failed" | "expired";
          masked_identifier: string | null;
          verified_name: string | null;
          verified_dob: string | null;
          provider_reference: string | null;
          failure_reason: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          verification_type: "aadhaar" | "pan";
          provider?: string;
          status?: "pending" | "verified" | "failed" | "expired";
          masked_identifier?: string | null;
          verified_name?: string | null;
          verified_dob?: string | null;
          provider_reference?: string | null;
          failure_reason?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["identity_verifications"]["Insert"]>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          flat_house: string | null;
          street_area: string | null;
          landmark: string | null;
          city: string | null;
          district: string | null;
          state: string;
          country: string;
          pin_code: string | null;
          latitude: number | null;
          longitude: number | null;
          is_primary: boolean;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          flat_house?: string | null;
          street_area?: string | null;
          landmark?: string | null;
          city?: string | null;
          district?: string | null;
          state?: string;
          country?: string;
          pin_code?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_primary?: boolean;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
        Relationships: [];
      };
      service_locations: {
        Row: {
          id: string;
          user_id: string;
          city: string | null;
          area: string | null;
          latitude: number | null;
          longitude: number | null;
          service_radius: number;
          pin_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          city?: string | null;
          area?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          service_radius?: number;
          pin_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_locations"]["Insert"]>;
        Relationships: [];
      };
      skills: {
        Row: { id: string; name: string; category: string; created_at: string };
        Insert: { id?: string; name: string; category: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["skills"]["Insert"]>;
        Relationships: [];
      };
      worker_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string | null;
          custom_skill_name: string | null;
          experience_years: number | null;
          skill_level: string | null;
          description: string | null;
          certificate_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id?: string | null;
          custom_skill_name?: string | null;
          experience_years?: number | null;
          skill_level?: string | null;
          description?: string | null;
          certificate_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["worker_skills"]["Insert"]>;
        Relationships: [];
      };
      work_experience: {
        Row: {
          id: string;
          user_id: string;
          occupation: string | null;
          years_experience: number | null;
          description: string | null;
          relevant_experience: string | null;
          certifications: string[] | null;
          education: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          occupation?: string | null;
          years_experience?: number | null;
          description?: string | null;
          relevant_experience?: string | null;
          certifications?: string[] | null;
          education?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["work_experience"]["Insert"]>;
        Relationships: [];
      };
      availability: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: string;
          available: boolean;
          start_time: string | null;
          end_time: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_of_week: string;
          available?: boolean;
          start_time?: string | null;
          end_time?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["availability"]["Insert"]>;
        Relationships: [];
      };
      task_preferences: {
        Row: {
          id: string;
          user_id: string;
          preferred_categories: string[] | null;
          min_payment: number | null;
          max_travel_km: number | null;
          preferred_hours: string | null;
          weekday_preference: string | null;
          work_type: string | null;
          remote_preference: string | null;
          emergency_preference: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_categories?: string[] | null;
          min_payment?: number | null;
          max_travel_km?: number | null;
          preferred_hours?: string | null;
          weekday_preference?: string | null;
          work_type?: string | null;
          remote_preference?: string | null;
          emergency_preference?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["task_preferences"]["Insert"]>;
        Relationships: [];
      };
      payout_accounts: {
        Row: {
          id: string;
          user_id: string;
          account_holder_name: string | null;
          masked_account: string | null;
          ifsc_code: string | null;
          upi_id: string | null;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_holder_name?: string | null;
          masked_account?: string | null;
          ifsc_code?: string | null;
          upi_id?: string | null;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payout_accounts"]["Insert"]>;
        Relationships: [];
      };
      emergency_contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          relationship: string | null;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          relationship?: string | null;
          phone: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["emergency_contacts"]["Insert"]>;
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          doc_type: string;
          status: "pending" | "verified" | "rejected" | "expired";
          storage_path: string | null;
          rejection_reason: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          doc_type: string;
          status?: "pending" | "verified" | "rejected" | "expired";
          storage_path?: string | null;
          rejection_reason?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
        Relationships: [];
      };
      verification_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          details: Record<string, unknown> | null;
          actor: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          details?: Record<string, unknown> | null;
          actor?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["verification_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_profile_completion: {
        Args: { p_user_id: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
