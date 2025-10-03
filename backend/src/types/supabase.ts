export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          quota_instances: number
          quota_messages_monthly: number
          settings: Json | null
          subscription_plan: string
          subscription_status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          quota_instances?: number
          quota_messages_monthly?: number
          settings?: Json | null
          subscription_plan?: string
          subscription_status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          quota_instances?: number
          quota_messages_monthly?: number
          settings?: Json | null
          subscription_plan?: string
          subscription_status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      // ... other tables omitted for brevity
    }
    Enums: {
      internal_role:
        | "super_admin"
        | "tech"
        | "cs"
        | "sales"
        | "marketing"
        | "viewer"
    }
  }
}
