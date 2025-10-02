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
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      services: {
        Row: {
          id: string
          organization_id: string
          name: string
          type: string
          description: string | null
          duration_minutes: number
          price_cents: number
          is_active: boolean
          requires_deposit: boolean
          deposit_percentage: number
          created_at: string
          updated_at: string
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
      }
      pets: {
        Row: {
          id: string
          organization_id: string
          contact_id: string
          name: string
          species: string
          breed: string | null
          age_years: number | null
          age_months: number | null
          weight_kg: number | null
          color: string | null
          gender: string | null
          is_neutered: boolean | null
          medical_notes: string | null
          allergies: string[]
          vaccinations: Json
          is_active: boolean
          created_at: string
          updated_at: string
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
          status: string
          cancellation_reason: string | null
          notes: string | null
          reminder_sent_at: string | null
          price_cents: number | null
          created_by_ai: boolean
          created_at: string
          updated_at: string
        }
      }
      whatsapp_instances: {
        Row: {
          id: string
          organization_id: string
          instance_name: string
          phone_number: string | null
          status: string
          qr_code: string | null
          session_data: Json | null
          last_connected_at: string | null
          created_at: string
          updated_at: string
        }
      }
      conversations: {
        Row: {
          id: string
          organization_id: string
          whatsapp_instance_id: string
          contact_id: string | null
          status: string
          last_message_at: string | null
          escalated_to_human_at: string | null
          escalation_reason: string | null
          summary: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
      }
      messages: {
        Row: {
          id: string
          organization_id: string
          conversation_id: string
          whatsapp_message_id: string | null
          direction: string
          content: string | null
          media_url: string | null
          media_type: string | null
          status: string | null
          sent_by_ai: boolean
          metadata: Json
          created_at: string
        }
      }
      ai_interactions: {
        Row: {
          id: string
          organization_id: string
          conversation_id: string | null
          contact_id: string | null
          message_id: string | null
          model: string
          prompt_tokens: number | null
          completion_tokens: number | null
          total_cost_cents: number | null
          intent_detected: string | null
          entities_extracted: Json
          action_taken: string | null
          confidence_score: number | null
          created_at: string
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
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Organization = Tables<'organizations'>
export type Service = Tables<'services'>
export type Contact = Tables<'contacts'>
export type Pet = Tables<'pets'>
export type Booking = Tables<'bookings'>
export type WhatsAppInstance = Tables<'whatsapp_instances'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>
export type AIInteraction = Tables<'ai_interactions'>
export type AuthorizedOwnerNumber = Tables<'authorized_owner_numbers'>
