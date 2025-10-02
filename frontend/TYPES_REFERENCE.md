# TypeScript Types Reference

Complete reference for all TypeScript types and interfaces used in the project.

## Database Types

### Organization

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  business_type: 'petshop' | 'clinic' | 'hotel' | 'daycare' | 'hybrid';
  subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'trial' | 'suspended' | 'cancelled';
  created_at: string;
}
```

### User

```typescript
interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'veterinarian' | 'groomer';
  avatar_url?: string;
  created_at: string;
}
```

### Contact

```typescript
interface Contact {
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
```

### Pet

```typescript
interface Pet {
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
```

### Booking

```typescript
interface Booking {
  id: string;
  organization_id: string;
  contact_id: string;
  pet_id?: string;
  service_id?: string;
  booking_type: 'appointment' | 'hotel' | 'daycare' | 'grooming' | 'training';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  start_time: string;
  end_time: string;
  price?: number;
  paid: boolean;
  created_at: string;
}
```

### Service

```typescript
interface Service {
  id: string;
  organization_id: string;
  name: string;
  service_type: 'grooming' | 'veterinary' | 'hotel' | 'daycare' | 'training' | 'other';
  description?: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}
```

### Conversation

```typescript
interface Conversation {
  id: string;
  organization_id: string;
  contact_id: string;
  status: 'active' | 'waiting' | 'resolved' | 'escalated';
  last_message_at: string;
  last_message_preview?: string;
  unread_count: number;
  created_at: string;
}
```

### Message

```typescript
interface Message {
  id: string;
  conversation_id: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'document';
  from_me: boolean;
  sent_by_ai: boolean;
  created_at: string;
}
```

### WhatsAppInstance

```typescript
interface WhatsAppInstance {
  id: string;
  organization_id: string;
  instance_name: string;
  phone_number?: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'qr_pending' | 'logged_out' | 'error';
  pairing_code?: string;
  pairing_method: 'code' | 'qr';
  last_connected_at?: string;
  created_at: string;
}
```

## Extended Types (with Relations)

### ContactWithPets

```typescript
interface ContactWithPets extends Contact {
  pets?: Pet[];
}
```

### PetWithContact

```typescript
interface PetWithContact extends Pet {
  contact?: Contact;
}
```

### BookingWithRelations

```typescript
interface BookingWithRelations extends Booking {
  contact?: Contact;
  pet?: {
    id: string;
    name: string;
    species: string;
  };
  service?: {
    id: string;
    name: string;
    service_type: string;
  };
}
```

## Component Props Types

### Button

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}
```

### DataTable

```typescript
interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchKeys?: string[];
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
  searchPlaceholder?: string;
  showPagination?: boolean;
}
```

### FormModal

```typescript
interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

### FormField

```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
}
```

### DatePicker

```typescript
interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string;
}
```

### Dialog

```typescript
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}
```

### Select

```typescript
interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}
```

## State Management Types

### Auth Store

```typescript
interface AuthStore {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setOrganization: (org: Organization | null) => void;
}
```

## Form Data Types

### Contact Form

```typescript
interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  status: Contact['status'];
}
```

### Pet Form

```typescript
interface PetFormData {
  contact_id: string;
  name: string;
  species: Pet['species'];
  breed: string;
  birth_date: string;
  gender: Pet['gender'];
}
```

### Booking Form

```typescript
interface BookingFormData {
  contact_id: string;
  pet_id: string;
  service_id: string;
  scheduled_date: string;
  duration_minutes: number;
  notes: string;
}
```

## Utility Types

### API Response

```typescript
type ApiResponse<T> = {
  data: T | null;
  error: Error | null;
};
```

### Pagination

```typescript
interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

### Filter Options

```typescript
type FilterOption = {
  value: string;
  label: string;
};
```

## Type Guards

```typescript
// Check if contact has pets
function hasContactPets(contact: Contact | ContactWithPets): contact is ContactWithPets {
  return 'pets' in contact && Array.isArray(contact.pets);
}

// Check if booking has relations
function hasBookingRelations(booking: Booking | BookingWithRelations): booking is BookingWithRelations {
  return 'contact' in booking || 'pet' in booking || 'service' in booking;
}
```

## Enum-like Constants

```typescript
// Badge variants
const BADGE_VARIANTS = {
  SUCCESS: 'success',
  SECONDARY: 'secondary',
  DESTRUCTIVE: 'destructive',
} as const;

// Contact status
const CONTACT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
} as const;

// Booking status
const BOOKING_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

// Pet species
const PET_SPECIES = {
  DOG: 'dog',
  CAT: 'cat',
  BIRD: 'bird',
  RABBIT: 'rabbit',
  OTHER: 'other',
} as const;
```
