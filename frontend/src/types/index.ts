export interface Organization {
  id: string;
  name: string;
  slug: string;
  business_type: 'petshop' | 'clinic' | 'hotel' | 'daycare' | 'hybrid';
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'trial' | 'suspended' | 'cancelled';
  features?: Record<string, boolean>;
  max_users?: number;
  max_whatsapp_instances?: number;
  max_pets?: number;
  created_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'veterinarian' | 'groomer';
  avatar_url?: string;
  permissions?: string[];
  created_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  phone: string;
  name?: string;
  email?: string;
  status: 'active' | 'inactive' | 'blocked';
  total_bookings: number;
  last_contact_at?: string;
  created_at: string;
}

export interface Pet {
  id: string;
  contact_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'unknown';
  photo_url?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  organization_id: string;
  contact_id: string;
  pet_id?: string;
  service_id?: string;
  booking_type: 'appointment' | 'hotel' | 'daycare' | 'grooming' | 'training';
  status:
    | 'scheduled'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show';
  start_time: string;
  end_time: string;
  price?: number;
  paid: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  contact_id: string;
  status: 'active' | 'waiting' | 'resolved' | 'escalated';
  last_message_at: string;
  last_message_preview?: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document';
  from_me: boolean;
  sent_by_ai: boolean;
  created_at: string;
}

export interface WhatsAppInstance {
  id: string;
  organization_id: string;
  instance_name: string;
  phone_number?: string;
  status:
    | 'connected'
    | 'connecting'
    | 'disconnected'
    | 'qr_pending'
    | 'logged_out'
    | 'error';
  pairing_code?: string;
  pairing_method: 'code' | 'qr';
  last_connected_at?: string;
  messages_sent_count?: number;
  messages_received_count?: number;
  created_at: string;
}
