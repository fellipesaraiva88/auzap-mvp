// Auto-generated from Supabase schema
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string
          role: 'owner' | 'admin' | 'staff'
          auth_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          full_name: string
          role: 'owner' | 'admin' | 'staff'
          auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string
          role?: 'owner' | 'admin' | 'staff'
          auth_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          whatsapp_instance_id: string | null
          phone_number: string
          full_name: string | null
          email: string | null
          address: string | null
          notes: string | null
          tags: string[]
          last_interaction_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          whatsapp_instance_id?: string | null
          phone_number: string
          full_name?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          tags?: string[]
          last_interaction_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          whatsapp_instance_id?: string | null
          phone_number?: string
          full_name?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          tags?: string[]
          last_interaction_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          organization_id: string
          contact_id: string
          name: string
          species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
          breed: string | null
          age_years: number | null
          age_months: number | null
          weight_kg: number | null
          color: string | null
          gender: 'male' | 'female' | 'unknown' | null
          is_neutered: boolean | null
          medical_notes: string | null
          allergies: string[]
          vaccinations: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id: string
          name: string
          species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
          breed?: string | null
          age_years?: number | null
          age_months?: number | null
          weight_kg?: number | null
          color?: string | null
          gender?: 'male' | 'female' | 'unknown' | null
          is_neutered?: boolean | null
          medical_notes?: string | null
          allergies?: string[]
          vaccinations?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string
          name?: string
          species?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
          breed?: string | null
          age_years?: number | null
          age_months?: number | null
          weight_kg?: number | null
          color?: string | null
          gender?: 'male' | 'female' | 'unknown' | null
          is_neutered?: boolean | null
          medical_notes?: string | null
          allergies?: string[]
          vaccinations?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          organization_id: string
          contact_id: string
          pet_id: string | null
          service_id: string
          whatsapp_instance_id: string | null
          scheduled_start: string
          scheduled_end: string
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          cancellation_reason: string | null
          notes: string | null
          reminder_sent_at: string | null
          price_cents: number | null
          created_by_ai: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id: string
          pet_id?: string | null
          service_id: string
          whatsapp_instance_id?: string | null
          scheduled_start: string
          scheduled_end: string
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          cancellation_reason?: string | null
          notes?: string | null
          reminder_sent_at?: string | null
          price_cents?: number | null
          created_by_ai?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string
          pet_id?: string | null
          service_id?: string
          whatsapp_instance_id?: string | null
          scheduled_start?: string
          scheduled_end?: string
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          cancellation_reason?: string | null
          notes?: string | null
          reminder_sent_at?: string | null
          price_cents?: number | null
          created_by_ai?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      whatsapp_instances: {
        Row: {
          id: string
          organization_id: string
          instance_name: string
          phone_number: string | null
          status: 'disconnected' | 'connecting' | 'connected' | 'qr_pending'
          qr_code: string | null
          session_data: Json | null
          last_connected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          instance_name: string
          phone_number?: string | null
          status: 'disconnected' | 'connecting' | 'connected' | 'qr_pending'
          qr_code?: string | null
          session_data?: Json | null
          last_connected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          instance_name?: string
          phone_number?: string | null
          status?: 'disconnected' | 'connecting' | 'connected' | 'qr_pending'
          qr_code?: string | null
          session_data?: Json | null
          last_connected_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      authorized_owner_numbers: {
        Row: {
          id: string
          organization_id: string
          phone_number: string
          owner_name: string
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          phone_number: string
          owner_name: string
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          phone_number?: string
          owner_name?: string
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
