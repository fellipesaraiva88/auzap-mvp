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
      ai_interactions: {
        Row: {
          action_type: Database["public"]["Enums"]["ai_action_type"]
          confidence_score: number | null
          conversation_id: string
          created_at: string
          error_message: string | null
          executed_at: string | null
          id: string
          input_data: Json
          message_id: string
          organization_id: string
          output_data: Json | null
          status: Database["public"]["Enums"]["ai_action_status"]
        }
        Insert: {
          action_type: Database["public"]["Enums"]["ai_action_type"]
          confidence_score?: number | null
          conversation_id: string
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          input_data: Json
          message_id: string
          organization_id: string
          output_data?: Json | null
          status?: Database["public"]["Enums"]["ai_action_status"]
        }
        Update: {
          action_type?: Database["public"]["Enums"]["ai_action_type"]
          confidence_score?: number | null
          conversation_id?: string
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          input_data?: Json
          message_id?: string
          organization_id?: string
          output_data?: Json | null
          status?: Database["public"]["Enums"]["ai_action_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_interactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      aurora_automations: {
        Row: {
          actions: Json
          conditions: Json | null
          created_at: string
          description: string | null
          error_count: number
          execution_count: number
          id: string
          last_executed_at: string | null
          name: string
          next_execution_at: string | null
          organization_id: string
          status: Database["public"]["Enums"]["automation_status"]
          success_count: number
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
          updated_at: string
        }
        Insert: {
          actions: Json
          conditions?: Json | null
          created_at?: string
          description?: string | null
          error_count?: number
          execution_count?: number
          id?: string
          last_executed_at?: string | null
          name: string
          next_execution_at?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["automation_status"]
          success_count?: number
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json | null
          created_at?: string
          description?: string | null
          error_count?: number
          execution_count?: number
          id?: string
          last_executed_at?: string | null
          name?: string
          next_execution_at?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["automation_status"]
          success_count?: number
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["automation_trigger"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aurora_automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      aurora_proactive_messages: {
        Row: {
          conversion_count: number
          created_at: string
          delivered_count: number
          id: string
          message_content: string
          metadata: Json | null
          organization_id: string
          response_count: number
          scheduled_for: string
          sent_count: number
          status: Database["public"]["Enums"]["aurora_message_status"]
          target_audience: Json
          trigger_type: Database["public"]["Enums"]["aurora_trigger_type"]
          updated_at: string
        }
        Insert: {
          conversion_count?: number
          created_at?: string
          delivered_count?: number
          id?: string
          message_content: string
          metadata?: Json | null
          organization_id: string
          response_count?: number
          scheduled_for: string
          sent_count?: number
          status?: Database["public"]["Enums"]["aurora_message_status"]
          target_audience: Json
          trigger_type: Database["public"]["Enums"]["aurora_trigger_type"]
          updated_at?: string
        }
        Update: {
          conversion_count?: number
          created_at?: string
          delivered_count?: number
          id?: string
          message_content?: string
          metadata?: Json | null
          organization_id?: string
          response_count?: number
          scheduled_for?: string
          sent_count?: number
          status?: Database["public"]["Enums"]["aurora_message_status"]
          target_audience?: Json
          trigger_type?: Database["public"]["Enums"]["aurora_trigger_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aurora_proactive_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_owner_numbers: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          name: string | null
          organization_id: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string | null
          organization_id: string
          phone_number: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          name?: string | null
          organization_id?: string
          phone_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorized_owner_numbers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          contact_id: string
          created_at: string
          created_by: Database["public"]["Enums"]["booking_created_by"]
          created_by_user_id: string | null
          duration_minutes: number
          id: string
          internal_notes: string | null
          notes: string | null
          organization_id: string
          pet_id: string
          price_cents: number
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          contact_id: string
          created_at?: string
          created_by: Database["public"]["Enums"]["booking_created_by"]
          created_by_user_id?: string | null
          duration_minutes: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          organization_id: string
          pet_id: string
          price_cents: number
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          contact_id?: string
          created_at?: string
          created_by?: Database["public"]["Enums"]["booking_created_by"]
          created_by_user_id?: string | null
          duration_minutes?: number
          id?: string
          internal_notes?: string | null
          notes?: string | null
          organization_id?: string
          pet_id?: string
          price_cents?: number
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          metadata: Json | null
          name: string | null
          notes: string | null
          organization_id: string
          phone_number: string
          source: Database["public"]["Enums"]["contact_source"]
          status: Database["public"]["Enums"]["contact_status"]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          organization_id: string
          phone_number: string
          source: Database["public"]["Enums"]["contact_source"]
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          organization_id?: string
          phone_number?: string
          source?: Database["public"]["Enums"]["contact_source"]
          status?: Database["public"]["Enums"]["contact_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to_user_id: string | null
          contact_id: string
          created_at: string
          id: string
          last_human_message_at: string | null
          last_message_at: string
          metadata: Json | null
          organization_id: string
          priority: Database["public"]["Enums"]["conversation_priority"]
          status: Database["public"]["Enums"]["conversation_status"]
          tags: string[] | null
          updated_at: string
          whatsapp_chat_id: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          contact_id: string
          created_at?: string
          id?: string
          last_human_message_at?: string | null
          last_message_at?: string
          metadata?: Json | null
          organization_id: string
          priority?: Database["public"]["Enums"]["conversation_priority"]
          status?: Database["public"]["Enums"]["conversation_status"]
          tags?: string[] | null
          updated_at?: string
          whatsapp_chat_id: string
        }
        Update: {
          assigned_to_user_id?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          last_human_message_at?: string | null
          last_message_at?: string
          metadata?: Json | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["conversation_priority"]
          status?: Database["public"]["Enums"]["conversation_status"]
          tags?: string[] | null
          updated_at?: string
          whatsapp_chat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          is_read: boolean
          media_url: string | null
          metadata: Json | null
          organization_id: string
          sender: Database["public"]["Enums"]["message_sender"]
          sent_by_user_id: string | null
          type: Database["public"]["Enums"]["message_type"]
          whatsapp_message_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          is_read?: boolean
          media_url?: string | null
          metadata?: Json | null
          organization_id: string
          sender: Database["public"]["Enums"]["message_sender"]
          sent_by_user_id?: string | null
          type: Database["public"]["Enums"]["message_type"]
          whatsapp_message_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          is_read?: boolean
          media_url?: string | null
          metadata?: Json | null
          organization_id?: string
          sender?: Database["public"]["Enums"]["message_sender"]
          sent_by_user_id?: string | null
          type?: Database["public"]["Enums"]["message_type"]
          whatsapp_message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          ai_config: Json | null
          business_info: Json | null
          created_at: string
          id: string
          notifications: Json | null
          operating_hours: Json | null
          organization_id: string
          pricing: Json | null
          updated_at: string
        }
        Insert: {
          ai_config?: Json | null
          business_info?: Json | null
          created_at?: string
          id?: string
          notifications?: Json | null
          operating_hours?: Json | null
          organization_id: string
          pricing?: Json | null
          updated_at?: string
        }
        Update: {
          ai_config?: Json | null
          business_info?: Json | null
          created_at?: string
          id?: string
          notifications?: Json | null
          operating_hours?: Json | null
          organization_id?: string
          pricing?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_type: string[]
          created_at: string
          id: string
          name: string
          plan_type: string
          settings: Json | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          business_type?: string[]
          created_at?: string
          id?: string
          name: string
          plan_type?: string
          settings?: Json | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_type?: string[]
          created_at?: string
          id?: string
          name?: string
          plan_type?: string
          settings?: Json | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          age_years: number | null
          behavioral_notes: string | null
          birth_date: string | null
          breed: string | null
          color: string | null
          contact_id: string
          created_at: string
          gender: string | null
          id: string
          is_active: boolean
          is_neutered: boolean | null
          medical_notes: string | null
          name: string
          organization_id: string
          photos: string[] | null
          size: Database["public"]["Enums"]["pet_size"] | null
          species: Database["public"]["Enums"]["pet_species"]
          updated_at: string
          vaccination_record: Json | null
          weight_kg: number | null
        }
        Insert: {
          age_years?: number | null
          behavioral_notes?: string | null
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          contact_id: string
          created_at?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          is_neutered?: boolean | null
          medical_notes?: string | null
          name: string
          organization_id: string
          photos?: string[] | null
          size?: Database["public"]["Enums"]["pet_size"] | null
          species: Database["public"]["Enums"]["pet_species"]
          updated_at?: string
          vaccination_record?: Json | null
          weight_kg?: number | null
        }
        Update: {
          age_years?: number | null
          behavioral_notes?: string | null
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          contact_id?: string
          created_at?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          is_neutered?: boolean | null
          medical_notes?: string | null
          name?: string
          organization_id?: string
          photos?: string[] | null
          size?: Database["public"]["Enums"]["pet_size"] | null
          species?: Database["public"]["Enums"]["pet_species"]
          updated_at?: string
          vaccination_record?: Json | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_followups: {
        Row: {
          booking_id: string | null
          contact_id: string
          created_at: string
          delivered_at: string | null
          id: string
          message_template: string
          metadata: Json | null
          organization_id: string
          personalized_message: string | null
          pet_id: string | null
          read_at: string | null
          response_received: boolean
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["followup_status"]
          type: Database["public"]["Enums"]["followup_type"]
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          contact_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_template: string
          metadata?: Json | null
          organization_id: string
          personalized_message?: string | null
          pet_id?: string | null
          read_at?: string | null
          response_received?: boolean
          scheduled_for: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["followup_status"]
          type: Database["public"]["Enums"]["followup_type"]
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          contact_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_template?: string
          metadata?: Json | null
          organization_id?: string
          personalized_message?: string | null
          pet_id?: string | null
          read_at?: string | null
          response_received?: boolean
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["followup_status"]
          type?: Database["public"]["Enums"]["followup_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_followups_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_followups_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_followups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_followups_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: Database["public"]["Enums"]["service_category"]
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          price_cents: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["service_category"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          id: string
          instance_key: string
          instance_name: string
          organization_id: string
          phone_number: string | null
          qr_code: string | null
          session_data: Json | null
          status: Database["public"]["Enums"]["instance_status"]
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          instance_key: string
          instance_name: string
          organization_id: string
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["instance_status"]
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          instance_key?: string
          instance_name?: string
          organization_id?: string
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["instance_status"]
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_organization_id: {
        Args: { _user_id: string }
        Returns: string
      }
    }
    Enums: {
      ai_action_status: "pending" | "completed" | "failed" | "cancelled"
      ai_action_type:
        | "create_contact"
        | "update_contact"
        | "create_pet"
        | "update_pet"
        | "create_booking"
        | "update_booking"
        | "cancel_booking"
        | "create_sale"
        | "schedule_followup"
        | "escalate_to_human"
      app_role: "owner" | "admin" | "manager" | "employee"
      aurora_message_status:
        | "draft"
        | "scheduled"
        | "sent"
        | "delivered"
        | "cancelled"
      aurora_trigger_type:
        | "weather_alert"
        | "seasonal_campaign"
        | "capacity_optimization"
        | "customer_lifecycle"
        | "inventory_alert"
        | "health_reminder"
      automation_status: "active" | "paused" | "completed" | "error"
      automation_trigger:
        | "time_based"
        | "event_based"
        | "condition_based"
        | "ai_detected"
      booking_created_by: "ai" | "human" | "customer"
      booking_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      contact_source:
        | "whatsapp_ai"
        | "whatsapp_manual"
        | "website"
        | "phone"
        | "referral"
      contact_status: "new" | "active" | "inactive" | "blocked"
      conversation_priority: "low" | "normal" | "high" | "urgent"
      conversation_status: "active" | "waiting_human" | "resolved" | "archived"
      followup_status:
        | "pending"
        | "sent"
        | "delivered"
        | "read"
        | "cancelled"
        | "failed"
      followup_type:
        | "appointment_reminder"
        | "feedback_request"
        | "vaccine_reminder"
        | "birthday_greeting"
        | "reactivation"
        | "checkout_reminder"
        | "payment_reminder"
        | "review_request"
      instance_status: "disconnected" | "connecting" | "connected" | "error"
      message_direction: "inbound" | "outbound"
      message_sender: "customer" | "ai" | "human"
      message_type:
        | "text"
        | "image"
        | "audio"
        | "video"
        | "document"
        | "location"
      pet_size: "pequeno" | "medio" | "grande" | "gigante"
      pet_species: "dog" | "cat" | "bird" | "rabbit" | "other"
      service_category:
        | "banho_tosa"
        | "veterinaria"
        | "hotel"
        | "creche"
        | "produtos"
        | "outros"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_action_status: ["pending", "completed", "failed", "cancelled"],
      ai_action_type: [
        "create_contact",
        "update_contact",
        "create_pet",
        "update_pet",
        "create_booking",
        "update_booking",
        "cancel_booking",
        "create_sale",
        "schedule_followup",
        "escalate_to_human",
      ],
      app_role: ["owner", "admin", "manager", "employee"],
      aurora_message_status: [
        "draft",
        "scheduled",
        "sent",
        "delivered",
        "cancelled",
      ],
      aurora_trigger_type: [
        "weather_alert",
        "seasonal_campaign",
        "capacity_optimization",
        "customer_lifecycle",
        "inventory_alert",
        "health_reminder",
      ],
      automation_status: ["active", "paused", "completed", "error"],
      automation_trigger: [
        "time_based",
        "event_based",
        "condition_based",
        "ai_detected",
      ],
      booking_created_by: ["ai", "human", "customer"],
      booking_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      contact_source: [
        "whatsapp_ai",
        "whatsapp_manual",
        "website",
        "phone",
        "referral",
      ],
      contact_status: ["new", "active", "inactive", "blocked"],
      conversation_priority: ["low", "normal", "high", "urgent"],
      conversation_status: ["active", "waiting_human", "resolved", "archived"],
      followup_status: [
        "pending",
        "sent",
        "delivered",
        "read",
        "cancelled",
        "failed",
      ],
      followup_type: [
        "appointment_reminder",
        "feedback_request",
        "vaccine_reminder",
        "birthday_greeting",
        "reactivation",
        "checkout_reminder",
        "payment_reminder",
        "review_request",
      ],
      instance_status: ["disconnected", "connecting", "connected", "error"],
      message_direction: ["inbound", "outbound"],
      message_sender: ["customer", "ai", "human"],
      message_type: ["text", "image", "audio", "video", "document", "location"],
      pet_size: ["pequeno", "medio", "grande", "gigante"],
      pet_species: ["dog", "cat", "bird", "rabbit", "other"],
      service_category: [
        "banho_tosa",
        "veterinaria",
        "hotel",
        "creche",
        "produtos",
        "outros",
      ],
    },
  },
} as const
