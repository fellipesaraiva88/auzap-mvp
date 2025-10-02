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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_interactions: {
        Row: {
          action_taken: string | null
          completion_tokens: number | null
          confidence_score: number | null
          contact_id: string | null
          conversation_id: string | null
          created_at: string | null
          entities_extracted: Json | null
          id: string
          intent_detected: string | null
          message_id: string | null
          model: string
          organization_id: string
          prompt_tokens: number | null
          total_cost_cents: number | null
        }
        Insert: {
          action_taken?: string | null
          completion_tokens?: number | null
          confidence_score?: number | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          entities_extracted?: Json | null
          id?: string
          intent_detected?: string | null
          message_id?: string | null
          model: string
          organization_id: string
          prompt_tokens?: number | null
          total_cost_cents?: number | null
        }
        Update: {
          action_taken?: string | null
          completion_tokens?: number | null
          confidence_score?: number | null
          contact_id?: string | null
          conversation_id?: string | null
          created_at?: string | null
          entities_extracted?: Json | null
          id?: string
          intent_detected?: string | null
          message_id?: string | null
          model?: string
          organization_id?: string
          prompt_tokens?: number | null
          total_cost_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
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
          action_config: Json
          automation_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          organization_id: string
          run_count: number | null
          success_count: number | null
          trigger_config: Json
          updated_at: string | null
        }
        Insert: {
          action_config: Json
          automation_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          organization_id: string
          run_count?: number | null
          success_count?: number | null
          trigger_config: Json
          updated_at?: string | null
        }
        Update: {
          action_config?: Json
          automation_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          organization_id?: string
          run_count?: number | null
          success_count?: number | null
          trigger_config?: Json
          updated_at?: string | null
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
          content: string
          created_at: string | null
          id: string
          message_type: string
          metadata: Json | null
          organization_id: string
          owner_phone_number: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type: string
          metadata?: Json | null
          organization_id: string
          owner_phone_number: string
          scheduled_for?: string | null
          sent_at?: string | null
          status: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string
          metadata?: Json | null
          organization_id?: string
          owner_phone_number?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
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
          created_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          organization_id: string
          owner_name: string
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id: string
          owner_name: string
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          organization_id?: string
          owner_name?: string
          phone_number?: string
          updated_at?: string | null
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
          cancellation_reason: string | null
          contact_id: string
          created_at: string | null
          created_by_ai: boolean | null
          id: string
          notes: string | null
          organization_id: string
          pet_id: string | null
          price_cents: number | null
          reminder_sent_at: string | null
          scheduled_end: string
          scheduled_start: string
          service_id: string
          status: string
          updated_at: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          contact_id: string
          created_at?: string | null
          created_by_ai?: boolean | null
          id?: string
          notes?: string | null
          organization_id: string
          pet_id?: string | null
          price_cents?: number | null
          reminder_sent_at?: string | null
          scheduled_end: string
          scheduled_start: string
          service_id: string
          status: string
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          contact_id?: string
          created_at?: string | null
          created_by_ai?: boolean | null
          id?: string
          notes?: string | null
          organization_id?: string
          pet_id?: string | null
          price_cents?: number | null
          reminder_sent_at?: string | null
          scheduled_end?: string
          scheduled_start?: string
          service_id?: string
          status?: string
          updated_at?: string | null
          whatsapp_instance_id?: string | null
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
          {
            foreignKeyName: "bookings_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_interaction_at: string | null
          notes: string | null
          organization_id: string
          phone_number: string
          tags: string[] | null
          updated_at: string | null
          whatsapp_instance_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_interaction_at?: string | null
          notes?: string | null
          organization_id: string
          phone_number: string
          tags?: string[] | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_interaction_at?: string | null
          notes?: string | null
          organization_id?: string
          phone_number?: string
          tags?: string[] | null
          updated_at?: string | null
          whatsapp_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          contact_id: string | null
          created_at: string | null
          escalated_to_human_at: string | null
          escalation_reason: string | null
          id: string
          last_message_at: string | null
          organization_id: string
          status: string
          summary: string | null
          tags: string[] | null
          updated_at: string | null
          whatsapp_instance_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          escalated_to_human_at?: string | null
          escalation_reason?: string | null
          id?: string
          last_message_at?: string | null
          organization_id: string
          status: string
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
          whatsapp_instance_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          escalated_to_human_at?: string | null
          escalation_reason?: string | null
          id?: string
          last_message_at?: string | null
          organization_id?: string
          status?: string
          summary?: string | null
          tags?: string[] | null
          updated_at?: string | null
          whatsapp_instance_id?: string
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
          {
            foreignKeyName: "conversations_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          media_type: string | null
          media_url: string | null
          metadata: Json | null
          organization_id: string
          sent_by_ai: boolean | null
          status: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          organization_id: string
          sent_by_ai?: boolean | null
          status?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          metadata?: Json | null
          organization_id?: string
          sent_by_ai?: boolean | null
          status?: string | null
          whatsapp_message_id?: string | null
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
          ai_client_enabled: boolean | null
          ai_client_model: string | null
          ai_client_temperature: number | null
          aurora_daily_summary_time: string | null
          aurora_enabled: boolean | null
          aurora_model: string | null
          business_hours: Json | null
          created_at: string | null
          id: string
          organization_id: string
          services_config: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_client_enabled?: boolean | null
          ai_client_model?: string | null
          ai_client_temperature?: number | null
          aurora_daily_summary_time?: string | null
          aurora_enabled?: boolean | null
          aurora_model?: string | null
          business_hours?: Json | null
          created_at?: string | null
          id?: string
          organization_id: string
          services_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_client_enabled?: boolean | null
          ai_client_model?: string | null
          ai_client_temperature?: number | null
          aurora_daily_summary_time?: string | null
          aurora_enabled?: boolean | null
          aurora_model?: string | null
          business_hours?: Json | null
          created_at?: string | null
          id?: string
          organization_id?: string
          services_config?: Json | null
          updated_at?: string | null
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
          address: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pets: {
        Row: {
          age_months: number | null
          age_years: number | null
          allergies: string[] | null
          breed: string | null
          color: string | null
          contact_id: string
          created_at: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_neutered: boolean | null
          medical_notes: string | null
          name: string
          organization_id: string
          species: string
          updated_at: string | null
          vaccinations: Json | null
          weight_kg: number | null
        }
        Insert: {
          age_months?: number | null
          age_years?: number | null
          allergies?: string[] | null
          breed?: string | null
          color?: string | null
          contact_id: string
          created_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_neutered?: boolean | null
          medical_notes?: string | null
          name: string
          organization_id: string
          species: string
          updated_at?: string | null
          vaccinations?: Json | null
          weight_kg?: number | null
        }
        Update: {
          age_months?: number | null
          age_years?: number | null
          allergies?: string[] | null
          breed?: string | null
          color?: string | null
          contact_id?: string
          created_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_neutered?: boolean | null
          medical_notes?: string | null
          name?: string
          organization_id?: string
          species?: string
          updated_at?: string | null
          vaccinations?: Json | null
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
          created_at: string | null
          error_message: string | null
          id: string
          message_template: string
          organization_id: string
          scheduled_for: string
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          contact_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_template: string
          organization_id: string
          scheduled_for: string
          sent_at?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          contact_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_template?: string
          organization_id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
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
        ]
      }
      services: {
        Row: {
          created_at: string | null
          deposit_percentage: number | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          price_cents: number
          requires_deposit: boolean | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deposit_percentage?: number | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          price_cents?: number
          requires_deposit?: boolean | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deposit_percentage?: number | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          price_cents?: number
          requires_deposit?: boolean | null
          type?: string
          updated_at?: string | null
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
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          organization_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          organization_id: string
          role: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          created_at: string | null
          id: string
          instance_name: string
          last_connected_at: string | null
          organization_id: string
          phone_number: string | null
          qr_code: string | null
          session_data: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_name: string
          last_connected_at?: string | null
          organization_id: string
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_name?: string
          last_connected_at?: string | null
          organization_id?: string
          phone_number?: string | null
          qr_code?: string | null
          session_data?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
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
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

// Helper exports
export type Organization = Tables<'organizations'>
export type User = Tables<'users'>
export type OrganizationSettings = Tables<'organization_settings'>
export type Service = Tables<'services'>
export type Contact = Tables<'contacts'>
export type Pet = Tables<'pets'>
export type Booking = Tables<'bookings'>
export type WhatsAppInstance = Tables<'whatsapp_instances'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>
export type AIInteraction = Tables<'ai_interactions'>
export type AuthorizedOwnerNumber = Tables<'authorized_owner_numbers'>
export type ScheduledFollowup = Tables<'scheduled_followups'>
export type AuroraProactiveMessage = Tables<'aurora_proactive_messages'>
export type AuroraAutomation = Tables<'aurora_automations'>
