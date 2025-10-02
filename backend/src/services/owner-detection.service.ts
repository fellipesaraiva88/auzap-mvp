import { supabase } from '../config/supabase';

export interface OwnerInfo {
  id: string;
  organizationId: string;
  phoneNumber: string;
  ownerName: string;
  role: 'owner' | 'manager' | 'admin';
  isActive: boolean;
  notificationsEnabled: boolean;
}

export class OwnerDetectionService {
  /**
   * Check if a phone number belongs to an owner of the organization
   */
  static async isOwnerNumber(
    organizationId: string,
    phoneNumber: string
  ): Promise<boolean> {
    try {
      // Normalize phone number (remove special characters and spaces)
      const normalizedPhone = phoneNumber.replace(/\D/g, '');

      // Check if the number exists in authorized_owner_numbers
      const { data, error } = await supabase
        .from('authorized_owner_numbers')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('phone_number', normalizedPhone)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking owner number:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isOwnerNumber:', error);
      return false;
    }
  }

  /**
   * Get owner information by phone number
   */
  static async getOwnerInfo(
    organizationId: string,
    phoneNumber: string
  ): Promise<OwnerInfo | null> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');

      const { data, error } = await supabase
        .from('authorized_owner_numbers')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('phone_number', normalizedPhone)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error getting owner info:', error);
        }
        return null;
      }

      return {
        id: data.id,
        organizationId: data.organization_id,
        phoneNumber: data.phone_number,
        ownerName: data.owner_name,
        role: data.role,
        isActive: data.is_active,
        notificationsEnabled: data.notifications_enabled
      };
    } catch (error) {
      console.error('Error in getOwnerInfo:', error);
      return null;
    }
  }

  /**
   * Get all active owners for an organization
   */
  static async getOrganizationOwners(
    organizationId: string
  ): Promise<OwnerInfo[]> {
    try {
      const { data, error } = await supabase
        .from('authorized_owner_numbers')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('role', { ascending: true })
        .order('owner_name', { ascending: true });

      if (error) {
        console.error('Error getting organization owners:', error);
        return [];
      }

      return data.map(owner => ({
        id: owner.id,
        organizationId: owner.organization_id,
        phoneNumber: owner.phone_number,
        ownerName: owner.owner_name,
        role: owner.role,
        isActive: owner.is_active,
        notificationsEnabled: owner.notifications_enabled
      }));
    } catch (error) {
      console.error('Error in getOrganizationOwners:', error);
      return [];
    }
  }

  /**
   * Add a new owner number
   */
  static async addOwnerNumber(
    organizationId: string,
    phoneNumber: string,
    ownerName: string,
    role: 'owner' | 'manager' | 'admin' = 'owner'
  ): Promise<OwnerInfo | null> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');

      const { data, error } = await supabase
        .from('authorized_owner_numbers')
        .insert({
          organization_id: organizationId,
          phone_number: normalizedPhone,
          owner_name: ownerName,
          role: role,
          is_active: true,
          notifications_enabled: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding owner number:', error);
        return null;
      }

      return {
        id: data.id,
        organizationId: data.organization_id,
        phoneNumber: data.phone_number,
        ownerName: data.owner_name,
        role: data.role,
        isActive: data.is_active,
        notificationsEnabled: data.notifications_enabled
      };
    } catch (error) {
      console.error('Error in addOwnerNumber:', error);
      return null;
    }
  }

  /**
   * Update owner number status
   */
  static async updateOwnerStatus(
    organizationId: string,
    phoneNumber: string,
    updates: {
      isActive?: boolean;
      notificationsEnabled?: boolean;
      role?: 'owner' | 'manager' | 'admin';
    }
  ): Promise<boolean> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');

      const updateData: any = {};
      if (updates.isActive !== undefined) {
        updateData.is_active = updates.isActive;
      }
      if (updates.notificationsEnabled !== undefined) {
        updateData.notifications_enabled = updates.notificationsEnabled;
      }
      if (updates.role !== undefined) {
        updateData.role = updates.role;
      }

      const { error } = await supabase
        .from('authorized_owner_numbers')
        .update(updateData)
        .eq('organization_id', organizationId)
        .eq('phone_number', normalizedPhone);

      if (error) {
        console.error('Error updating owner status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateOwnerStatus:', error);
      return false;
    }
  }

  /**
   * Remove an owner number
   */
  static async removeOwnerNumber(
    organizationId: string,
    phoneNumber: string
  ): Promise<boolean> {
    try {
      const normalizedPhone = phoneNumber.replace(/\D/g, '');

      const { error } = await supabase
        .from('authorized_owner_numbers')
        .delete()
        .eq('organization_id', organizationId)
        .eq('phone_number', normalizedPhone);

      if (error) {
        console.error('Error removing owner number:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeOwnerNumber:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled for an owner
   */
  static async shouldNotifyOwner(
    organizationId: string,
    phoneNumber: string
  ): Promise<boolean> {
    try {
      const ownerInfo = await this.getOwnerInfo(organizationId, phoneNumber);
      return ownerInfo ? ownerInfo.notificationsEnabled : false;
    } catch (error) {
      console.error('Error in shouldNotifyOwner:', error);
      return false;
    }
  }
}