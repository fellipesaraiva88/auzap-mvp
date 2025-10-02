import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { WhatsAppInstance } from '@/types';
import { io, Socket } from 'socket.io-client';
import {
  Smartphone,
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle,
  Phone,
  Power,
  Wifi,
  WifiOff
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * WhatsApp Management Page
 *
 * Features:
 * - Connect WhatsApp instance (pairing code or QR)
 * - Real-time connection status
 * - Display pairing code or QR code
 * - Disconnect instance
 * - Auto-refresh status
 *
 * @component
 * @example
 * ```tsx
 * <WhatsApp />
 * ```
 */
export default function WhatsApp() {
  const { organization } = useAuthStore();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [pairingMethod, setPairingMethod] = useState<'code' | 'qr'>('code');
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Load instances from database
  const loadInstances = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances(data || []);
    } catch (err: any) {
      console.error('Error loading instances:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!organization?.id) return;

    loadInstances();

    // Subscribe to Supabase changes
    const channel = supabase
      .channel('whatsapp_instances_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_instances',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          console.log('WhatsApp instance updated:', payload);
          loadInstances();
        }
      )
      .subscribe();

    // Connect to Socket.IO
    const socketConnection = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketConnection.on('connect', () => {
      console.log('Socket.IO connected:', socketConnection.id);
      // Join organization room
      socketConnection.emit('join-organization', organization.id);
    });

    // Listen for QR code events
    socketConnection.on('whatsapp:qr', (data: { instanceId: string; qr: string; timestamp: string }) => {
      console.log('QR Code received:', data);
      setQrCode(data.qr);
      // Reload instances to update status
      loadInstances();
    });

    socketConnection.on('disconnect', () => {
      console.log('Socket.IO disconnected');
    });

    setSocket(socketConnection);

    return () => {
      supabase.removeChannel(channel);
      socketConnection.disconnect();
    };
  }, [organization?.id, loadInstances]);

  // Create new instance and connect
  const handleConnect = async () => {
    if (!organization?.id) return;
    if (!instanceName.trim()) {
      setError('Instance name is required');
      return;
    }
    if (pairingMethod === 'code' && !phoneNumber.trim()) {
      setError('Phone number is required for pairing code method');
      return;
    }

    setConnecting(true);
    setError(null);
    setPairingCode(null);
    setQrCode(null);

    try {
      // 1. Create instance in database
      const { data: instance, error: createError } = await supabase
        .from('whatsapp_instances')
        .insert({
          organization_id: organization.id,
          instance_name: instanceName,
          phone_number: phoneNumber || null,
          status: 'connecting',
          pairing_method: pairingMethod,
        })
        .select()
        .single();

      if (createError) throw createError;

      // 2. Initialize connection via backend
      const response = await fetch(`${API_URL}/api/whatsapp/instances/${instance.id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          method: pairingMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect');
      }

      const result = await response.json();

      // 3. Handle pairing code or QR code
      if (pairingMethod === 'code' && result.pairingCode) {
        setPairingCode(result.pairingCode);
      } else if (pairingMethod === 'qr') {
        // QR code will be received via Socket.IO
        console.log('Waiting for QR code via Socket.IO...');
      }

      // Reload instances
      await loadInstances();
    } catch (err: any) {
      console.error('Error connecting:', err);
      
      // Diferenciar tipos de erro para melhor UX
      if (err.message === 'Failed to fetch') {
        setError('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
      } else if (err.message.includes('Instance not found')) {
        setError('A instância não foi criada corretamente. Por favor, tente novamente.');
      } else if (err.message.includes('CORS')) {
        setError('Erro de configuração do servidor. Entre em contato com o suporte.');
      } else {
        setError(err.message || 'Erro desconhecido ao conectar');
      }
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect instance
  const handleDisconnect = async (instanceId: string) => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp instance?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/whatsapp/instances/${instanceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      }

      await loadInstances();
    } catch (err: any) {
      console.error('Error disconnecting:', err);
      setError(err.message);
    }
  };

  // Refresh instance status
  const refreshStatus = async (instanceId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/whatsapp/instances/${instanceId}/status`);
      if (!response.ok) throw new Error('Failed to fetch status');

      await loadInstances();
    } catch (err: any) {
      console.error('Error refreshing status:', err);
      setError(err.message);
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return 'Not set';
    return phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
  };

  // Get status badge
  const getStatusBadge = (status: WhatsAppInstance['status']) => {
    const badges = {
      connected: { icon: Wifi, color: 'bg-green-100 text-green-700', label: 'Connected' },
      connecting: { icon: Loader2, color: 'bg-yellow-100 text-yellow-700', label: 'Connecting' },
      disconnected: { icon: WifiOff, color: 'bg-gray-100 text-gray-700', label: 'Disconnected' },
      qr_pending: { icon: QrCode, color: 'bg-blue-100 text-blue-700', label: 'QR Pending' },
      logged_out: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Logged Out' },
      error: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Error' },
    };

    const badge = badges[status] || badges.disconnected;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className={`w-4 h-4 ${status === 'connecting' ? 'animate-spin' : ''}`} />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-green-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">WhatsApp Management</h1>
                <p className="text-sm text-gray-500">Connect and manage your WhatsApp instances</p>
              </div>
            </div>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Power className="w-4 h-4" />
              Connect Instance
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Instances List */}
        {instances.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Smartphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No WhatsApp Instances</h3>
            <p className="text-gray-600 mb-6">Connect your first WhatsApp instance to start automating</p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Connect Instance
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {instances.map((instance) => (
              <div key={instance.id} className="bg-white rounded-lg border shadow-sm p-6">
                {/* Instance Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {instance.instance_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {formatPhoneNumber(instance.phone_number)}
                    </div>
                  </div>
                  {getStatusBadge(instance.status)}
                </div>

                {/* Instance Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pairing Method</span>
                    <span className="font-medium text-gray-900">
                      {instance.pairing_method === 'code' ? 'Pairing Code' : 'QR Code'}
                    </span>
                  </div>
                  {instance.last_connected_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last Connected</span>
                      <span className="font-medium text-gray-900">
                        {new Date(instance.last_connected_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {instance.pairing_code && instance.status === 'qr_pending' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-900 font-medium mb-2">Pairing Code</div>
                      <div className="text-3xl font-mono font-bold text-blue-600 tracking-wider text-center">
                        {instance.pairing_code}
                      </div>
                      <p className="text-xs text-blue-700 mt-2 text-center">
                        Enter this code in WhatsApp: Settings → Linked Devices → Link a Device
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => refreshStatus(instance.id)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => handleDisconnect(instance.id)}
                    disabled={instance.status === 'disconnected'}
                    className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Power className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Connect WhatsApp Instance</h2>
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setPairingCode(null);
                  setQrCode(null);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Pairing Code Display */}
            {pairingCode && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Pairing Code Generated</span>
                </div>
                <div className="text-4xl font-mono font-bold text-green-600 tracking-wider text-center mb-4">
                  {pairingCode}
                </div>
                <div className="bg-white rounded-lg p-4 text-sm text-gray-700">
                  <p className="font-medium mb-2">Steps to connect:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open WhatsApp on your phone</li>
                    <li>Go to Settings → Linked Devices</li>
                    <li>Tap "Link a Device"</li>
                    <li>Tap "Link with phone number instead"</li>
                    <li>Enter the 8-digit code above</li>
                  </ol>
                </div>
              </div>
            )}

            {/* QR Code Display */}
            {qrCode && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <QrCode className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-blue-900 mb-4">Scan this QR code with WhatsApp</p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`} alt="QR Code" className="w-64 h-64" />
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  Open WhatsApp → Settings → Linked Devices → Link a Device
                </p>
              </div>
            )}
            
            {/* Waiting for QR */}
            {pairingMethod === 'qr' && !qrCode && connecting && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-blue-900 font-medium">Generating QR Code...</p>
                <p className="text-xs text-blue-700 mt-2">Please wait while we connect to WhatsApp</p>
              </div>
            )}

            {/* Form */}
            {!pairingCode && !qrCode && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instance Name
                  </label>
                  <input
                    type="text"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                    placeholder="e.g., Main WhatsApp"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pairing Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPairingMethod('code')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                        pairingMethod === 'code'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Phone className="w-5 h-5 mx-auto mb-1" />
                      Pairing Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setPairingMethod('qr')}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                        pairingMethod === 'qr'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <QrCode className="w-5 h-5 mx-auto mb-1" />
                      QR Code
                    </button>
                  </div>
                </div>

                {pairingMethod === 'code' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (with country code)
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="5511999999999"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: 5511999999999 (country code + area code + number)
                    </p>
                  </div>
                )}

                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Power className="w-5 h-5" />
                      Connect Instance
                    </>
                  )}
                </button>
              </div>
            )}

            {(pairingCode || qrCode) && (
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setPairingCode(null);
                  setQrCode(null);
                  setInstanceName('');
                  setPhoneNumber('');
                  setConnecting(false);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
