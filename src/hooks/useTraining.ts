import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingService } from '@/services/training.service';

export function useTrainingPlans(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['training-plans', filters],
    queryFn: () => trainingService.list(filters)
  });
}

export function useTrainingPlan(planId: string | null) {
  return useQuery({
    queryKey: ['training-plans', planId],
    queryFn: () => trainingService.getById(planId!),
    enabled: !!planId
  });
}

export function useCreateTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trainingService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    }
  });
}

export function useUpdateTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, updates }: { planId: string; updates: any }) =>
      trainingService.update(planId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-plans'] });
    }
  });
}
