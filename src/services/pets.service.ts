import { apiClient } from '@/lib/api';

export interface Pet {
  id: string;
  organization_id: string;
  contact_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'other';
  breed?: string;
  age_years?: number;
  age_months?: number;
  gender?: 'male' | 'female' | 'unknown';
  weight_kg?: number;
  color?: string;
  notes?: string;
  profile_image_url?: string;
  microchip_number?: string;
  medical_history?: string;
  allergies?: string[];
  medications?: string[];
  temperament?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePetData {
  contact_id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age_years?: number;
  age_months?: number;
  gender?: 'male' | 'female' | 'unknown';
  weight_kg?: number;
  color?: string;
  notes?: string;
}

export interface UpdatePetData {
  name?: string;
  species?: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  age_years?: number;
  age_months?: number;
  gender?: 'male' | 'female' | 'unknown';
  weight_kg?: number;
  color?: string;
  notes?: string;
  is_active?: boolean;
}

class PetsService {
  async listByContact(contactId: string): Promise<Pet[]> {
    const response = await apiClient.get<{ pets: Pet[] }>(`/api/pets/contact/${contactId}`);
    return response.data.pets;
  }

  async getById(petId: string): Promise<Pet> {
    const response = await apiClient.get<{ pet: Pet }>(`/api/pets/${petId}`);
    return response.data.pet;
  }

  async create(data: CreatePetData): Promise<Pet> {
    const response = await apiClient.post<{ pet: Pet }>('/api/pets', data);
    return response.data.pet;
  }

  async update(petId: string, data: UpdatePetData): Promise<Pet> {
    const response = await apiClient.patch<{ pet: Pet }>(`/api/pets/${petId}`, data);
    return response.data.pet;
  }

  async delete(petId: string): Promise<void> {
    await apiClient.delete(`/api/pets/${petId}`);
  }

  async uploadProfileImage(petId: string, imageFile: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await apiClient.post<{ url: string }>(`/api/pets/${petId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }
}

export const petsService = new PetsService();
