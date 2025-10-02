import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { socketManager, addSocketListener, removeSocketListener, SocketEvents } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket() {
  const { session, user } = useAuth();
  const queryClient = useQueryClient();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!session?.access_token || !user?.organization_id || isInitialized.current) {
      return;
    }

    // Initialize Socket.io connection with JWT
    socketManager.connect(session.access_token, user.organization_id);
    isInitialized.current = true;

    // Cleanup on unmount or session change
    return () => {
      socketManager.disconnect();
      isInitialized.current = false;
    };
  }, [session?.access_token, user?.organization_id]);

  const on = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ) => {
    addSocketListener(event, callback);
  }, []);

  const off = useCallback(<K extends keyof SocketEvents>(
    event: K,
    callback?: SocketEvents[K]
  ) => {
    removeSocketListener(event, callback);
  }, []);

  return {
    on,
    off,
    isConnected: socketManager.isConnected(),
  };
}

// Hook específico para real-time updates no dashboard
export function useDashboardSocketUpdates() {
  const queryClient = useQueryClient();
  const { on, off } = useSocket();

  useEffect(() => {
    // WhatsApp status changes
    const handleWhatsAppStatusChange = (data: { instanceId: string; status: string; connected: boolean }) => {
      console.log('🔄 WhatsApp status changed', data);
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // New messages
    const handleNewMessage = (data: { conversationId: string; from: string; message: any }) => {
      console.log('📩 New message received', data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    // Message sent
    const handleMessageSent = (data: { messageId: string; conversationId: string }) => {
      console.log('✉️ Message sent', data);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    // Conversation escalated
    const handleConversationEscalated = (data: { conversationId: string; contactId: string; reason: string }) => {
      console.log('⚠️ Conversation escalated', data);
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Could show a toast notification here
    };

    // Follow-up scheduled
    const handleFollowupScheduled = (data: { followupId: string; contactId: string; scheduledFor: string }) => {
      console.log('📅 Follow-up scheduled', data);
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // Follow-up sent
    const handleFollowupSent = (data: { followupId: string; contactId: string; sentAt: string }) => {
      console.log('✅ Follow-up sent', data);
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // Automation action
    const handleAutomationAction = (data: { actionType: string; entityType: string; entityId: string; description: string }) => {
      console.log('🤖 Automation action', data);
      queryClient.invalidateQueries({ queryKey: ['automations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    // Register all listeners
    on('whatsapp-status-changed', handleWhatsAppStatusChange);
    on('new-message', handleNewMessage);
    on('message-sent', handleMessageSent);
    on('conversation-escalated', handleConversationEscalated);
    on('followup-scheduled', handleFollowupScheduled);
    on('followup-sent', handleFollowupSent);
    on('automation-action', handleAutomationAction);

    // Cleanup listeners on unmount
    return () => {
      off('whatsapp-status-changed', handleWhatsAppStatusChange);
      off('new-message', handleNewMessage);
      off('message-sent', handleMessageSent);
      off('conversation-escalated', handleConversationEscalated);
      off('followup-scheduled', handleFollowupScheduled);
      off('followup-sent', handleFollowupSent);
      off('automation-action', handleAutomationAction);
    };
  }, [on, off, queryClient]);
}
