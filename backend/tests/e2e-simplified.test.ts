/**
 * E2E Simplified Test Suite
 * Direct tests without complex setup
 */

import { supabase } from '../src/config/supabase';
import { detectOwnerNumber } from '../src/middleware/aurora-auth.middleware';

const generateSlug = () =>
  `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('E2E Simplified Test Suite', () => {
  console.log('🧪 Starting Simplified E2E Tests...');

  describe('1. Database Connectivity', () => {
    it('should connect to Supabase successfully', async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('2. Organization Management', () => {
    it('should create and delete organization', async () => {
      const slug = generateSlug();

      const { data: org, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: 'Test Org E2E',
          slug,
          business_type: 'petshop',
        })
        .select()
        .single();

      expect(createError).toBeNull();
      expect(org).toBeDefined();
      expect(org?.slug).toBe(slug);

      // Cleanup
      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org!.id);
      expect(deleteError).toBeNull();
    });
  });

  describe('3. Owner Detection', () => {
    it('should detect authorized owner number', async () => {
      const slug = generateSlug();

      // Create org
      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: 'Owner Test Org',
          slug,
          business_type: 'petshop',
        })
        .select()
        .single();

      if (!org) throw new Error('Failed to create org');

      // Create a user first
      const { data: authUser } = await supabase.auth.admin.createUser({
        email: `test-owner-${Date.now()}@test.com`,
        password: 'Test@12345',
        email_confirm: true,
      });

      if (!authUser?.user) throw new Error('Failed to create auth user');

      const { error: userError } = await supabase.from('users').insert({
        id: authUser.user.id,
        email: authUser.user.email!,
        full_name: 'Test Owner',
        organization_id: org.id,
        role: 'admin',
      });

      if (userError) {
        console.error('User creation error:', userError);
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      // Create authorized owner number
      const { data: ownerNumber } = await supabase
        .from('authorized_owner_numbers')
        .insert({
          organization_id: org.id,
          user_id: authUser.user.id,
          phone_number: '+5511999888777',
          is_active: true,
        })
        .select()
        .single();

      expect(ownerNumber).toBeDefined();

      // Verify owner number was created
      const { data: checkOwner } = await supabase
        .from('authorized_owner_numbers')
        .select('*')
        .eq('id', ownerNumber!.id)
        .single();

      console.log('Created owner number:', checkOwner);

      // Test detection
      const result = await detectOwnerNumber('+5511999888777', org.id);

      console.log('Detection result:', result);

      expect(result.isOwner).toBe(true);
      expect(result.ownerNumberId).toBe(ownerNumber!.id);

      // Cleanup
      await supabase
        .from('authorized_owner_numbers')
        .delete()
        .eq('id', ownerNumber!.id);
      await supabase.from('users').delete().eq('id', authUser.user.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('organizations').delete().eq('id', org.id);
    });

    it('should NOT detect non-authorized number', async () => {
      const slug = generateSlug();

      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: 'Non-Owner Test',
          slug,
          business_type: 'petshop',
        })
        .select()
        .single();

      if (!org) throw new Error('Failed to create org');

      // Test with unauthorized number
      const result = await detectOwnerNumber('+5511777666555', org.id);

      expect(result.isOwner).toBe(false);
      expect(result.ownerNumberId).toBeUndefined();

      // Cleanup
      await supabase.from('organizations').delete().eq('id', org.id);
    });
  });

  describe('4. Contact & Pet Flow', () => {
    it('should create contact with pet', async () => {
      const slug = generateSlug();

      // Create org
      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: 'Pet Test Org',
          slug,
          business_type: 'petshop',
        })
        .select()
        .single();

      if (!org) throw new Error('Failed to create org');

      // Create contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: org.id,
          phone: '+5511666555444',
          name: 'Pet Owner',
          status: 'active',
        })
        .select()
        .single();

      expect(contactError).toBeNull();
      expect(contact).toBeDefined();

      // Create pet
      const { data: pet, error: petError } = await supabase
        .from('pets')
        .insert({
          organization_id: org.id,
          contact_id: contact!.id,
          name: 'Rex',
          species: 'dog',
          breed: 'Labrador',
          is_active: true,
        })
        .select()
        .single();

      expect(petError).toBeNull();
      expect(pet).toBeDefined();
      expect(pet?.name).toBe('Rex');

      // Cleanup
      await supabase.from('pets').delete().eq('id', pet!.id);
      await supabase.from('contacts').delete().eq('id', contact!.id);
      await supabase.from('organizations').delete().eq('id', org.id);
    });
  });

  describe('5. Service & Booking Flow', () => {
    it('should create service and booking', async () => {
      const slug = generateSlug();

      // Create org
      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: 'Booking Test Org',
          slug,
          business_type: 'petshop',
        })
        .select()
        .single();

      if (!org) throw new Error('Failed to create org');

      // Create service
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .insert({
          organization_id: org.id,
          name: 'Banho e Tosa',
          type: 'grooming',
          description: 'Completo',
          price: 80.0,
          duration_minutes: 60,
          is_active: true,
        })
        .select()
        .single();

      if (serviceError) {
        console.error('Service error:', serviceError);
        throw new Error(`Failed to create service: ${serviceError.message}`);
      }

      expect(service).toBeDefined();

      // Create contact + pet
      const { data: contact } = await supabase
        .from('contacts')
        .insert({
          organization_id: org.id,
          phone: '+5511444333222',
          name: 'Booking Client',
          status: 'active',
        })
        .select()
        .single();

      const { data: pet } = await supabase
        .from('pets')
        .insert({
          organization_id: org.id,
          contact_id: contact!.id,
          name: 'Bob',
          species: 'dog',
          is_active: true,
        })
        .select()
        .single();

      // Create booking
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 24);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 60);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          organization_id: org.id,
          service_id: service!.id,
          pet_id: pet!.id,
          contact_id: contact!.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          booking_type: 'appointment',
          status: 'confirmed',
          price: 80.0,
        })
        .select()
        .single();

      expect(bookingError).toBeNull();
      expect(booking).toBeDefined();
      expect(booking?.price).toBe(80.0);

      // Cleanup
      await supabase.from('bookings').delete().eq('id', booking!.id);
      await supabase.from('pets').delete().eq('id', pet!.id);
      await supabase.from('contacts').delete().eq('id', contact!.id);
      await supabase.from('services').delete().eq('id', service!.id);
      await supabase.from('organizations').delete().eq('id', org.id);
    });
  });

  describe('6. AI Interactions', () => {
    it('should save AI interaction', async () => {
      const slug = generateSlug();

      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: 'AI Test Org',
          slug,
          business_type: 'petshop',
        })
        .select()
        .single();

      if (!org) throw new Error('Failed to create org');

      const { data: contact } = await supabase
        .from('contacts')
        .insert({
          organization_id: org.id,
          phone: '+5511333222111',
          name: 'AI Client',
          status: 'active',
        })
        .select()
        .single();

      const { data: conversation } = await supabase
        .from('conversations')
        .insert({
          organization_id: org.id,
          contact_id: contact!.id,
          status: 'active',
        })
        .select()
        .single();

      const { data: interaction, error: interactionError } = await supabase
        .from('ai_interactions')
        .insert({
          organization_id: org.id,
          conversation_id: conversation!.id,
          ai_type: 'client',
          model: 'gpt-4o-mini',
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          status: 'success',
        })
        .select()
        .single();

      expect(interactionError).toBeNull();
      expect(interaction?.total_tokens).toBe(150);

      // Cleanup
      await supabase.from('ai_interactions').delete().eq('id', interaction!.id);
      await supabase.from('conversations').delete().eq('id', conversation!.id);
      await supabase.from('contacts').delete().eq('id', contact!.id);
      await supabase.from('organizations').delete().eq('id', org.id);
    });
  });

  describe('7. Aurora Proactive Messages', () => {
    it('should save Aurora proactive message', async () => {
      const slug = generateSlug();

      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: 'Aurora Test Org',
          slug,
          business_type: 'petshop',
        })
        .select()
        .single();

      if (!org) throw new Error('Failed to create org');

      // Create user and owner number
      const { data: authUser } = await supabase.auth.admin.createUser({
        email: `test-aurora-${Date.now()}@test.com`,
        password: 'Test@12345',
        email_confirm: true,
      });

      if (!authUser?.user) throw new Error('Failed to create auth user');

      const { error: userError } = await supabase.from('users').insert({
        id: authUser.user.id,
        email: authUser.user.email!,
        full_name: 'Aurora Owner',
        organization_id: org.id,
        role: 'admin',
      });

      if (userError) {
        console.error('Aurora user creation error:', userError);
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      const { data: ownerNumber, error: ownerError } = await supabase
        .from('authorized_owner_numbers')
        .insert({
          organization_id: org.id,
          user_id: authUser.user.id,
          phone_number: '+5511222111000',
          is_active: true,
        })
        .select()
        .single();

      if (ownerError || !ownerNumber) {
        console.error('Owner number creation failed:', ownerError);
        throw new Error(
          `Failed to create owner number: ${ownerError?.message}`
        );
      }

      const { data: message, error: messageError } = await supabase
        .from('aurora_proactive_messages')
        .insert({
          organization_id: org.id,
          owner_number_id: ownerNumber!.id,
          message_type: 'daily_summary',
          content: 'Resumo: 10 agendamentos hoje',
          scheduled_for: new Date().toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      expect(messageError).toBeNull();
      expect(message?.message_type).toBe('daily_summary');

      // Cleanup
      await supabase
        .from('aurora_proactive_messages')
        .delete()
        .eq('id', message!.id);
      await supabase
        .from('authorized_owner_numbers')
        .delete()
        .eq('id', ownerNumber!.id);
      await supabase.from('users').delete().eq('id', authUser.user.id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('organizations').delete().eq('id', org.id);
    });
  });

  console.log('✅ Simplified E2E Tests Complete!');
});
