// Extended Supabase types with missing columns/tables
import type { Database } from './database.types.js';

export interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      organizations: {
        Row: Database['public']['Tables']['organizations']['Row'] & {
          is_active?: boolean;
          subscription_plan?: string;
          subscription_status?: string;
          quota_messages_monthly?: number;
          quota_instances?: number;
        };
        Insert: Database['public']['Tables']['organizations']['Insert'] & {
          is_active?: boolean;
          subscription_plan?: string;
          subscription_status?: string;
          quota_messages_monthly?: number;
          quota_instances?: number;
        };
        Update: Database['public']['Tables']['organizations']['Update'] & {
          is_active?: boolean;
          subscription_plan?: string;
          subscription_status?: string;
          quota_messages_monthly?: number;
          quota_instances?: number;
        };
      };
      organization_settings: {
        Row: Database['public']['Tables']['organization_settings']['Row'] & {
          feature_flags?: any;
        };
        Insert: Database['public']['Tables']['organization_settings']['Insert'] & {
          feature_flags?: any;
        };
        Update: Database['public']['Tables']['organization_settings']['Update'] & {
          feature_flags?: any;
        };
      };
      clientes_esquecidos: {
        Row: {
          id: string;
          organization_id: string;
          contact_id?: string;
          phone_number: string;
          last_message_at?: string;
          days_since_contact?: number;
          pet_names?: string[];
          owner_name?: string;
          recovery_message?: string;
          recovery_sent_at?: string;
          recovery_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id?: string;
          phone_number: string;
          last_message_at?: string;
          days_since_contact?: number;
          pet_names?: string[];
          owner_name?: string;
          recovery_message?: string;
          recovery_sent_at?: string;
          recovery_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          contact_id?: string;
          phone_number?: string;
          last_message_at?: string;
          days_since_contact?: number;
          pet_names?: string[];
          owner_name?: string;
          recovery_message?: string;
          recovery_sent_at?: string;
          recovery_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          organization_id: string;
          event_type: string;
          event_data?: any;
          user_id?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          event_type: string;
          event_data?: any;
          user_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          event_type?: string;
          event_data?: any;
          user_id?: string;
          created_at?: string;
        };
      };
      internal_audit_log: {
        Row: {
          id: string;
          admin_id?: string;
          action: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: any;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          admin_id?: string;
          action: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: any;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          metadata?: any;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
      };
    };
  };
}