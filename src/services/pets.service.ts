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

  async createBatch(pets: CreatePetData[]): Promise<Pet[]> {
    const response = await apiClient.post<{ pets: Pet[] }>('/api/pets/batch', { pets });
    return response.data.pets;
  }

  // Métodos auxiliares úteis
  getSpeciesEmoji(species: Pet['species']): string {
    const emojis = {
      dog: '🐕',
      cat: '🐱',
      bird: '🦜',
      fish: '🐠',
      rabbit: '🐰',
      hamster: '🐹',
      other: '🐾',
    };
    return emojis[species] || '🐾';
  }

  getSpeciesLabel(species: Pet['species']): string {
    const labels = {
      dog: 'Cachorro',
      cat: 'Gato',
      bird: 'Pássaro',
      fish: 'Peixe',
      rabbit: 'Coelho',
      hamster: 'Hamster',
      other: 'Outro',
    };
    return labels[species] || 'Outro';
  }

  getGenderLabel(gender?: Pet['gender']): string {
    const labels = {
      male: 'Macho',
      female: 'Fêmea',
      unknown: 'Não informado',
    };
    return labels[gender || 'unknown'];
  }

  getGenderIcon(gender?: Pet['gender']): string {
    const icons = {
      male: '♂️',
      female: '♀️',
      unknown: '❓',
    };
    return icons[gender || 'unknown'];
  }

  calculateAgeString(years?: number, months?: number): string {
    if (!years && !months) return 'Idade não informada';

    const parts = [];
    if (years) {
      parts.push(years === 1 ? '1 ano' : `${years} anos`);
    }
    if (months) {
      parts.push(months === 1 ? '1 mês' : `${months} meses`);
    }

    return parts.join(' e ');
  }

  getTemperamentBadge(temperament?: string): {
    label: string;
    color: string;
  } {
    const temperaments: Record<string, { label: string; color: string }> = {
      friendly: { label: 'Amigável', color: 'bg-green-100 text-green-800' },
      playful: { label: 'Brincalhão', color: 'bg-blue-100 text-blue-800' },
      calm: { label: 'Calmo', color: 'bg-purple-100 text-purple-800' },
      energetic: { label: 'Energético', color: 'bg-orange-100 text-orange-800' },
      shy: { label: 'Tímido', color: 'bg-gray-100 text-gray-800' },
      aggressive: { label: 'Agressivo', color: 'bg-red-100 text-red-800' },
      anxious: { label: 'Ansioso', color: 'bg-yellow-100 text-yellow-800' },
    };

    return temperaments[temperament || ''] || {
      label: temperament || 'Não informado',
      color: 'bg-gray-100 text-gray-800'
    };
  }

  getSizeCategory(species: Pet['species'], weightKg?: number): string {
    if (!weightKg) return 'Tamanho não informado';

    if (species === 'dog') {
      if (weightKg < 10) return 'Pequeno porte';
      if (weightKg < 25) return 'Médio porte';
      if (weightKg < 45) return 'Grande porte';
      return 'Porte gigante';
    }

    if (species === 'cat') {
      if (weightKg < 3) return 'Abaixo do peso';
      if (weightKg < 6) return 'Peso ideal';
      return 'Acima do peso';
    }

    return `${weightKg} kg`;
  }
}

export const petsService = new PetsService();
