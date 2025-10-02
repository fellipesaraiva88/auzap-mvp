import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { Conversation, Contact, Message } from '@/types';

/**
 * Conversations Page Component
 *
 * Features:
 * - Real-time conversation list with Supabase subscriptions
 * - Filter by status (active, archived)
 * - Unread message indicators
 * - Message history viewer
 * - Contact information display
 * - Responsive design (mobile-first)
 *
 * Accessibility:
 * - Semantic HTML structure
 * - ARIA labels for screen readers
 * - Keyboard navigation support
 * - Focus management
 */

interface ConversationWithContact extends Conversation {
  contact?: Contact;
}

type FilterStatus = 'all' | 'active' | 'archived';

export default function Conversations() {
  const { organization } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationWithContact[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    if (!organization?.id) return;

    loadConversations();

    // Subscribe to real-time conversation updates
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            loadConversations();
          } else if (payload.eventType === 'UPDATE') {
            setConversations((prev) =>
              prev.map((conv) =>
                conv.id === payload.new.id
                  ? { ...conv, ...(payload.new as Conversation) }
                  : conv
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setConversations((prev) =>
              prev.filter((conv) => conv.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      conversationsChannel.unsubscribe();
    };
  }, [organization?.id]);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    loadMessages(selectedConversation);

    const messagesChannel = supabase
      .channel(`messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);

          // Mark as read when viewing
          if (!(payload.new as Message).from_me) {
            markConversationAsRead(selectedConversation);
          }
        }
      )
      .subscribe();

    // Mark as read when opening conversation
    markConversationAsRead(selectedConversation);

    return () => {
      messagesChannel.unsubscribe();
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    if (!organization?.id) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('organization_id', organization.id)
        .order('last_message_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setConversations((data as ConversationWithContact[]) || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const markConversationAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      await supabase
        .from('conversations')
        .update({ status: 'resolved' })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  // Filter conversations based on selected filter
  const filteredConversations = useMemo(() => {
    if (filterStatus === 'all') return conversations;
    if (filterStatus === 'active') {
      return conversations.filter((c) => c.status === 'active' || c.status === 'waiting');
    }
    if (filterStatus === 'archived') {
      return conversations.filter((c) => c.status === 'resolved');
    }
    return conversations;
  }, [conversations, filterStatus]);

  // Calculate total unread count
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
  }, [conversations]);

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Conversas</h1>
              <p className="text-sm text-gray-500">
                {totalUnread > 0 && `${totalUnread} mensagem${totalUnread > 1 ? 's' : ''} não lida${totalUnread > 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Filters */}
            <div className="flex gap-2" role="group" aria-label="Filtros de conversa">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={filterStatus === 'all'}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={filterStatus === 'active'}
              >
                Ativas
              </button>
              <button
                onClick={() => setFilterStatus('archived')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'archived'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                aria-pressed={filterStatus === 'archived'}
              >
                Arquivadas
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">
                Conversas ({filteredConversations.length})
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto" role="list" aria-label="Lista de conversas">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-2xl mb-2">💬</div>
                    <div className="text-sm text-gray-500">Carregando conversas...</div>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📭</div>
                    <div className="text-sm text-gray-500">Nenhuma conversa encontrada</div>
                  </div>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className={`w-full p-4 border-b hover:bg-gray-50 transition-colors text-left ${
                      selectedConversation === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                    role="listitem"
                    aria-current={selectedConversation === conv.id ? 'true' : 'false'}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {conv.contact?.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {conv.contact?.name || conv.contact?.phone || 'Sem nome'}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                              {conv.contact?.phone}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 truncate">
                          {conv.last_message_preview || 'Sem mensagens'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(conv.last_message_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {conv.status === 'waiting' && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                              Aguardando
                            </span>
                          )}
                          {conv.status === 'escalated' && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                              Escalado
                            </span>
                          )}
                        </div>
                      </div>
                      {conv.unread_count > 0 && (
                        <div
                          className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-semibold flex-shrink-0"
                          aria-label={`${conv.unread_count} mensagens não lidas`}
                        >
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message History */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
            {selectedConversation && selectedConv ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                      {selectedConv.contact?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedConv.contact?.name || 'Sem nome'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedConv.contact?.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedConv.status !== 'resolved' && (
                      <button
                        onClick={() => archiveConversation(selectedConversation)}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        aria-label="Arquivar conversa"
                      >
                        Arquivar
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-label="Histórico de mensagens" aria-live="polite">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-sm text-gray-500">Carregando mensagens...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="text-4xl mb-2">💬</div>
                        <div className="text-sm text-gray-500">Nenhuma mensagem ainda</div>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.from_me ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.from_me
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {msg.sent_by_ai && !msg.from_me && (
                            <div className="text-xs opacity-75 mb-1 flex items-center gap-1">
                              <span>🤖</span>
                              <span>Enviado pela IA</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          <div className={`text-xs mt-1 ${msg.from_me ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input (placeholder for future implementation) */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite uma mensagem..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled
                      aria-label="Campo de mensagem (em breve)"
                    />
                    <button
                      className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                      disabled
                      aria-label="Enviar mensagem (em breve)"
                    >
                      Enviar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Envio manual de mensagens em breve
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Selecione uma conversa
                  </h3>
                  <p className="text-sm text-gray-500">
                    Escolha uma conversa da lista para ver o histórico
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
