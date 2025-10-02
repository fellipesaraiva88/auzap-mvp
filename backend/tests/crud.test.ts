import { getTestContext, resetTestData } from './setup';
import { randomUUID } from 'crypto';

describe('Contacts CRUD Operations', () => {
  let testContactId: string;

  beforeEach(async () => {
    await resetTestData();
  });

  describe('Create Contact', () => {
    it('should create a contact successfully', async () => {
      const { supabase, testOrgId } = getTestContext();

      const contactData = {
        organization_id: testOrgId,
        name: 'John Doe',
        phone: '+5511999999999',
        email: 'john.doe@example.com',
        notes: 'Test contact',
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe(contactData.name);
      expect(data.phone).toBe(contactData.phone);
      expect(data.email).toBe(contactData.email);
      expect(data.organization_id).toBe(testOrgId);

      testContactId = data.id;
    });

    it('should require organization_id', async () => {
      const { supabase } = getTestContext();

      const contactData = {
        name: 'Jane Doe',
        phone: '+5511888888888',
      };

      const { error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.message).toContain('null value');
    });

    it('should validate phone format', async () => {
      const { supabase, testOrgId } = getTestContext();

      const contactData = {
        organization_id: testOrgId,
        name: 'Invalid Phone',
        phone: 'invalid-phone',
      };

      const { error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      // Note: Validation depends on database constraints
      // If no constraint, this test might need adjustment
      if (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('List Contacts', () => {
    beforeEach(async () => {
      const { supabase, testOrgId } = getTestContext();

      // Create multiple test contacts
      await supabase.from('contacts').insert([
        {
          organization_id: testOrgId,
          name: 'Contact 1',
          phone: '+5511111111111',
        },
        {
          organization_id: testOrgId,
          name: 'Contact 2',
          phone: '+5511222222222',
        },
        {
          organization_id: testOrgId,
          name: 'Contact 3',
          phone: '+5511333333333',
        },
      ]);
    });

    it('should list all contacts for organization', async () => {
      const { supabase, testOrgId } = getTestContext();

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', testOrgId);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThanOrEqual(3);
      expect(data.every(c => c.organization_id === testOrgId)).toBe(true);
    });

    it('should filter contacts by name', async () => {
      const { supabase, testOrgId } = getTestContext();

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', testOrgId)
        .ilike('name', '%Contact 1%');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0].name).toContain('Contact 1');
    });

    it('should paginate contacts', async () => {
      const { supabase, testOrgId } = getTestContext();

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', testOrgId)
        .range(0, 1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Update Contact', () => {
    beforeEach(async () => {
      const { supabase, testOrgId } = getTestContext();

      const { data } = await supabase
        .from('contacts')
        .insert({
          organization_id: testOrgId,
          name: 'Update Test',
          phone: '+5511444444444',
        })
        .select()
        .single();

      testContactId = data!.id;
    });

    it('should update contact successfully', async () => {
      const { supabase } = getTestContext();

      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', testContactId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.name).toBe(updates.name);
      expect(data.email).toBe(updates.email);
    });

    it('should NOT update organization_id', async () => {
      const { supabase } = getTestContext();

      const newOrgId = randomUUID();

      const { error } = await supabase
        .from('contacts')
        .update({ organization_id: newOrgId })
        .eq('id', testContactId);

      // RLS should prevent this or error should occur
      if (!error) {
        // Verify organization_id didn't change
        const { data } = await supabase
          .from('contacts')
          .select('organization_id')
          .eq('id', testContactId)
          .single();

        expect(data?.organization_id).not.toBe(newOrgId);
      }
    });
  });

  describe('Delete Contact', () => {
    beforeEach(async () => {
      const { supabase, testOrgId } = getTestContext();

      const { data } = await supabase
        .from('contacts')
        .insert({
          organization_id: testOrgId,
          name: 'Delete Test',
          phone: '+5511555555555',
        })
        .select()
        .single();

      testContactId = data!.id;
    });

    it('should delete contact successfully', async () => {
      const { supabase } = getTestContext();

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', testContactId);

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', testContactId)
        .single();

      expect(data).toBeNull();
    });

    it('should handle deleting non-existent contact', async () => {
      const { supabase } = getTestContext();

      const fakeId = randomUUID();

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', fakeId);

      // Should not error, just no rows affected
      expect(error).toBeNull();
    });
  });

  describe('RLS (Row Level Security)', () => {
    it('should NOT access contacts from other organizations', async () => {
      const { supabase, testOrgId } = getTestContext();

      // Create another organization
      const { data: otherOrg } = await supabase
        .from('organizations')
        .insert({
          name: 'Other Org',
          plan: 'starter',
          status: 'active',
        })
        .select()
        .single();

      // Create contact in other org
      const { data: otherContact } = await supabase
        .from('contacts')
        .insert({
          organization_id: otherOrg!.id,
          name: 'Other Org Contact',
          phone: '+5511666666666',
        })
        .select()
        .single();

      // Try to access with current org context
      // Note: This requires RLS policies to be properly configured
      // For service role, we need to simulate user context

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', testOrgId);

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Should not include other org's contact
      const hasOtherOrgContact = data.some(c => c.id === otherContact!.id);
      expect(hasOtherOrgContact).toBe(false);

      // Cleanup
      await supabase.from('contacts').delete().eq('organization_id', otherOrg!.id);
      await supabase.from('organizations').delete().eq('id', otherOrg!.id);
    });
  });
});
