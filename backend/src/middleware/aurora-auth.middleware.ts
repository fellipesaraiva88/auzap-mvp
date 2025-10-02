import { supabase } from '../config/supabase';
import { AuroraContext } from '../types';

/**
 * Detecta se o número é de um dono/gerente autorizado
 */
export async function detectOwnerNumber(
  phoneNumber: string,
  organizationId: string
): Promise<AuroraContext> {
  try {
    const { data: ownerNumber, error } = await supabase
      .from('authorized_owner_numbers')
      .select('*, users(*)')
      .eq('organization_id', organizationId)
      .eq('phone_number', phoneNumber)
      .eq('is_active', true)
      .single();

    if (error || !ownerNumber) {
      return { isOwner: false };
    }

    return {
      isOwner: true,
      organizationId,
      userId: ownerNumber.user_id,
      ownerNumberId: ownerNumber.id,
      permissions: ownerNumber.permissions,
    };
  } catch (error) {
    console.error('Error detecting owner number:', error);
    return { isOwner: false };
  }
}
