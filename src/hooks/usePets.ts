import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { petsService, type Pet, type CreatePetData, type UpdatePetData } from '@/services/pets.service';
import { useToast } from '@/hooks/use-toast';

export function usePets(contactId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['pets', contactId],
    queryFn: () => (contactId ? petsService.listByContact(contactId) : []),
    enabled: !!contactId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePetData) => petsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({
        title: 'Pet cadastrado!',
        description: 'Pet adicionado com sucesso 🐾',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar pet',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePetData }) =>
      petsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({
        title: 'Pet atualizado!',
        description: 'Alterações salvas com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => petsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      toast({
        title: 'Pet removido',
        description: 'Pet excluído com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  return {
    pets: data || [],
    isLoading,
    error,
    createPet: createMutation.mutate,
    updatePet: updateMutation.mutate,
    deletePet: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function usePet(petId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => petsService.getById(petId!),
    enabled: !!petId,
  });

  return {
    pet: data,
    isLoading,
    error,
  };
}
