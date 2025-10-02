import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  conversationsService,
  type Conversation,
  type ListConversationsParams,
} from '@/services/conversations.service';
import { useToast } from '@/hooks/use-toast';

export function useConversations(params?: ListConversationsParams) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversations', params],
    queryFn: () => conversationsService.list(params),
    refetchInterval: 5000, // Atualizar a cada 5 segundos
  });

  const assumeMutation = useMutation({
    mutationFn: (conversationId: string) =>
      conversationsService.assumeConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Conversa assumida!',
        description: 'Você está agora gerenciando esta conversa',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao assumir conversa',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (conversationId: string) =>
      conversationsService.resolveConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Conversa resolvida!',
        description: 'Conversa marcada como resolvida',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao resolver conversa',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (conversationId: string) =>
      conversationsService.closeConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: 'Conversa fechada',
        description: 'Conversa encerrada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao fechar conversa',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  return {
    conversations: data?.conversations || [],
    total: data?.total || 0,
    isLoading,
    error,
    assumeConversation: assumeMutation.mutate,
    resolveConversation: resolveMutation.mutate,
    closeConversation: closeMutation.mutate,
  };
}

export function useConversation(conversationId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationsService.getById(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 3000, // Atualizar a cada 3 segundos
  });

  return {
    conversation: data,
    isLoading,
    error,
  };
}

export function useConversationMessages(conversationId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: () => conversationsService.getMessages(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 2000, // Atualizar mensagens a cada 2 segundos
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      conversationsService.sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar mensagem',
        description: error.response?.data?.error || 'Tente novamente',
      });
    },
  });

  return {
    messages: data || [],
    isLoading,
    error,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  };
}
