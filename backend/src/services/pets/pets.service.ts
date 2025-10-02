import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import type { Tables, TablesInsert } from '../../types/database.types.js';

export type Pet = Tables<'pets'>;

export interface PetLegacy {
  id: string;
  organization_id: string;
  contact_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string | null;
  age_years: number | null;
  age_months: number | null;
  weight_kg: number | null;
  color: string | null;
  gender: 'male' | 'female' | 'unknown' | null;
  is_neutered: boolean | null;
  medical_notes: string | null;
  allergies: string[];
  vaccinations: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePetData {
  organization_id: string;
  contact_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age_years?: number;
  age_months?: number;
  weight_kg?: number;
  color?: string;
  gender?: 'male' | 'female' | 'unknown';
  is_neutered?: boolean;
  medical_notes?: string;
  allergies?: string[];
  vaccinations?: any;
}

export interface UpdatePetData {
  name?: string;
  breed?: string;
  age_years?: number;
  age_months?: number;
  weight_kg?: number;
  color?: string;
  gender?: 'male' | 'female' | 'unknown';
  is_neutered?: boolean;
  medical_notes?: string;
  allergies?: string[];
  vaccinations?: any;
  is_active?: boolean;
}

export class PetsService {
  /**
   * Cria um novo pet
   */
  async create(data: CreatePetData): Promise<Pet> {
    try {
      const petData: TablesInsert<'pets'> = {
        ...data,
        allergies: data.allergies || [],
        vaccinations: data.vaccinations || [],
        is_active: true
      };
      const { data: pet, error } = await supabaseAdmin
        .from('pets')
        .insert(petData)
        .select()
        .single() as { data: Pet | null; error: any };

      if (error) {
        throw error;
      }

      logger.info({ petId: pet.id, name: data.name }, 'Pet created');
      return pet as Pet;
    } catch (error) {
      logger.error({ error, data }, 'Error creating pet');
      throw error;
    }
  }

  /**
   * Busca pet por ID
   */
  async findById(petId: string): Promise<Pet | null> {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .select('*')
      .eq('id', petId)
      .single();

    if (error) {
      logger.error({ error, petId }, 'Error finding pet by ID');
      return null;
    }

    return data as Pet;
  }

  /**
   * Lista pets de um contato
   */
  async listByContact(contactId: string): Promise<Pet[]> {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .select('*')
      .eq('contact_id', contactId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error({ error, contactId }, 'Error listing pets by contact');
      return [];
    }

    return data as Pet[];
  }

  /**
   * Lista todos os pets de uma organização
   */
  async listByOrganization(
    organizationId: string,
    filters?: {
      species?: string;
      isActive?: boolean;
      searchQuery?: string;
    }
  ): Promise<Pet[]> {
    let query = supabaseAdmin
      .from('pets')
      .select('*, contacts(full_name, phone_number)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.species) {
      query = query.eq('species', filters.species);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.searchQuery) {
      query = query.or(
        `name.ilike.%${filters.searchQuery}%,breed.ilike.%${filters.searchQuery}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error, organizationId }, 'Error listing pets by organization');
      return [];
    }

    return data as Pet[];
  }

  /**
   * Atualiza pet
   */
  async update(petId: string, data: UpdatePetData): Promise<Pet | null> {
    const { data: updated, error } = await supabaseAdmin
      .from('pets')
      .update(data)
      .eq('id', petId)
      .select()
      .single() as { data: Pet | null; error: any };

    if (error) {
      logger.error({ error, petId }, 'Error updating pet');
      return null;
    }

    logger.info({ petId }, 'Pet updated');
    return updated as Pet;
  }

  /**
   * Adiciona vacinação
   */
  async addVaccination(
    petId: string,
    vaccination: {
      name: string;
      date: string;
      nextDate?: string;
      veterinarian?: string;
      notes?: string;
    }
  ): Promise<void> {
    const pet = await this.findById(petId);
    if (!pet) return;

    const vaccinations = Array.isArray(pet.vaccinations) ? pet.vaccinations : [];
    vaccinations.push({
      ...vaccination,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    });

    await this.update(petId, { vaccinations });
  }

  /**
   * Adiciona alergia
   */
  async addAllergy(petId: string, allergy: string): Promise<void> {
    const pet = await this.findById(petId);
    if (!pet) return;

    const allergies = pet.allergies || [];
    if (!allergies.includes(allergy)) {
      allergies.push(allergy);
      await this.update(petId, { allergies });
    }
  }

  /**
   * Remove alergia
   */
  async removeAllergy(petId: string, allergy: string): Promise<void> {
    const pet = await this.findById(petId);
    if (!pet) return;

    const allergies = (pet.allergies || []).filter(a => a !== allergy);
    await this.update(petId, { allergies });
  }

  /**
   * Busca pets por nome
   */
  async searchByName(organizationId: string, name: string): Promise<Pet[]> {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .select('*')
      .eq('organization_id', organizationId)
      .ilike('name', `%${name}%`)
      .eq('is_active', true)
      .limit(10);

    if (error) {
      logger.error({ error, name }, 'Error searching pets by name');
      return [];
    }

    return data as Pet[];
  }

  /**
   * Desativa pet
   */
  async deactivate(petId: string): Promise<void> {
    await this.update(petId, { is_active: false });
  }

  /**
   * Reativa pet
   */
  async reactivate(petId: string): Promise<void> {
    await this.update(petId, { is_active: true });
  }

  /**
   * Deleta pet permanentemente
   */
  async delete(petId: string): Promise<void> {
    await supabaseAdmin
      .from('pets')
      .delete()
      .eq('id', petId);

    logger.info({ petId }, 'Pet deleted');
  }
}

export const petsService = new PetsService();
