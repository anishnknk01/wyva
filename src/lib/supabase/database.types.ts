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
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_wysa?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          is_wysa?: boolean;
          created_at?: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
