import { z } from 'zod';

/**
 * Validadores para Contacts
 */
export const createContactSchema = z.object({
  organization_id: z.string().uuid('organization_id must be a valid UUID'),
  phone: z.string().min(10, 'Phone must have at least 10 characters'),
  name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  notes: z.string().optional(),
});

export const updateContactSchema = z.object({
  organization_id: z.string().uuid('organization_id must be a valid UUID'),
  name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive', 'blocked']).optional(),
});

/**
 * Validadores para Pets
 */
export const createPetSchema = z.object({
  organization_id: z.string().uuid('organization_id must be a valid UUID'),
  contact_id: z.string().uuid('contact_id must be a valid UUID'),
  name: z.string().min(1, 'Name is required'),
  species: z.string().optional(),
  breed: z.string().optional(),
  age: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
  medical_conditions: z.string().optional(),
});

export const updatePetSchema = z.object({
  organization_id: z.string().uuid('organization_id must be a valid UUID'),
  name: z.string().min(1).optional(),
  species: z.string().optional(),
  breed: z.string().optional(),
  age: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
  medical_conditions: z.string().optional(),
});

/**
 * Validadores para Services
 */
export const createServiceSchema = z.object({
  organization_id: z.string().uuid('organization_id must be a valid UUID'),
  name: z.string().min(1, 'Name is required'),
  service_type: z.string().min(1, 'Service type is required'),
  description: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
});

export const updateServiceSchema = z.object({
  organization_id: z.string().uuid('organization_id must be a valid UUID'),
  name: z.string().min(1).optional(),
  service_type: z.string().min(1).optional(),
  description: z.string().optional(),
  duration_minutes: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

/**
 * Validadores para Bookings
 */
export const createBookingSchema = z.object({
  organization_id: z.string().uuid('organization_id must be a valid UUID'),
  contact_id: z.string().uuid('contact_id must be a valid UUID'),
  pet_id: z.string().uuid('pet_id must be a valid UUID'),
  service_id: z.string().uuid('service_id must be a valid UUID'),
  scheduled_date: z.string().datetime('scheduled_date must be a valid ISO 8601 datetime'),
  duration_minutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const updateBookingSchema = z.object({
  organization_id: z.string().uuid('organization_id must be a valid UUID'),
  scheduled_date: z.string().datetime('scheduled_date must be a valid ISO 8601 datetime').optional(),
  duration_minutes: z.number().int().positive().optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  notes: z.string().optional(),
  actual_amount: z.number().nonnegative().optional(),
});

/**
 * Helper para validar requests
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      success: false,
      errors: ['Validation error'],
    };
  }
}
