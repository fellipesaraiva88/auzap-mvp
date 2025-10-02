# Socket.IO Events Reference

## 📡 Real-Time Communication

This document describes all Socket.IO events used in AuZap for real-time WhatsApp integration.

---

## 🔌 Connection Setup

### Client-Side Connection

```javascript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to Socket.IO:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.warn('🔌 Disconnected:', reason);
});

socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Reconnected after', attemptNumber, 'attempts');
});
```

---

## 📤 Client → Server Events

Events that the frontend sends to the backend.

### `join-organization`

Join a specific organization's room to receive real-time updates.

**When to use:**
- On user login
- When switching organizations
- After creating a new WhatsApp instance

**Payload:**
```typescript
socket.emit('join-organization', organizationId: string);
```

**Example:**
```javascript
import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';

function WhatsAppDashboard() {
  const socket = useSocket();
  const { organization } = useAuth();

  useEffect(() => {
    if (socket && organization?.id) {
      socket.emit('join-organization', organization.id);
      console.log('Joined organization room:', organization.id);
    }
  }, [socket, organization?.id]);

  return <div>Dashboard</div>;
}
```

**Best Practices:**
- Always join room on component mount
- Leave and rejoin when organization changes
- Handle socket disconnection/reconnection

---

## 📥 Server → Client Events

Events that the backend sends to the frontend.

### `whatsapp:qr`

QR code generated for instance connection.

**When emitted:**
- When connecting instance with `method: 'qr'`
- Each time QR code refreshes (every 60 seconds until scanned)

**Payload:**
```typescript
interface WhatsAppQREvent {
  instanceId: string;           // Instance UUID
  qr: string;                   // QR code string for qrcode library
  timestamp: string;            // ISO 8601 timestamp
}
```

**Example:**
```javascript
import { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';

function ConnectWhatsApp({ instanceId }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const socket = useSocket();

  useEffect(() => {
    const handleQR = (data: WhatsAppQREvent) => {
      if (data.instanceId === instanceId) {
        setQrCode(data.qr);
        console.log('QR Code received:', data.timestamp);
      }
    };

    socket?.on('whatsapp:qr', handleQR);

    return () => {
      socket?.off('whatsapp:qr', handleQR);
    };
  }, [socket, instanceId]);

  return (
    <div>
      {qrCode ? (
        <QRCode value={qrCode} size={256} />
      ) : (
        <p>Waiting for QR code...</p>
      )}
    </div>
  );
}
```

**UI Recommendations:**
- Show loading state while waiting for QR
- Display timestamp of last refresh
- Add countdown timer (60 seconds)
- Show instructions for scanning
- Handle QR expiration gracefully

---

### `whatsapp:pairing-code`

Pairing code generated for phone number connection.

**When emitted:**
- When connecting instance with `method: 'code'`
- Code is valid for 60 seconds

**Payload:**
```typescript
interface WhatsAppPairingCodeEvent {
  instanceId: string;           // Instance UUID
  pairingCode: string;          // 8-character alphanumeric code
  expiresAt: string;            // ISO 8601 timestamp (60s from now)
  timestamp: string;            // Generation timestamp
}
```

**Example:**
```javascript
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

function PairingCodeDisplay({ instanceId }) {
  const [pairingData, setPairingData] = useState<WhatsAppPairingCodeEvent | null>(null);
  const socket = useSocket();

  useEffect(() => {
    const handlePairingCode = (data: WhatsAppPairingCodeEvent) => {
      if (data.instanceId === instanceId) {
        setPairingData(data);
      }
    };

    socket?.on('whatsapp:pairing-code', handlePairingCode);

    return () => {
      socket?.off('whatsapp:pairing-code', handlePairingCode);
    };
  }, [socket, instanceId]);

  if (!pairingData) return <p>Generating code...</p>;

  return (
    <div>
      <h2>Pairing Code</h2>
      <div className="code-display">
        {pairingData.pairingCode}
      </div>
      <p>
        Expires {formatDistanceToNow(new Date(pairingData.expiresAt), { addSuffix: true })}
      </p>
      <ol>
        <li>Open WhatsApp on your phone</li>
        <li>Tap Settings → Linked Devices</li>
        <li>Tap "Link a Device"</li>
        <li>Tap "Link with phone number instead"</li>
        <li>Enter the code above</li>
      </ol>
    </div>
  );
}
```

**UI Recommendations:**
- Format code for readability (XXXX-XXXX)
- Show countdown timer
- Display step-by-step instructions
- Auto-refresh on expiration
- Show success message on connection

---

### `whatsapp:connected`

Instance successfully connected to WhatsApp.

**When emitted:**
- After successful QR scan
- After successful pairing code entry
- On reconnection after temporary disconnect

**Payload:**
```typescript
interface WhatsAppConnectedEvent {
  instanceId: string;           // Instance UUID
  organizationId: string;       // Organization UUID
  phoneNumber: string;          // Connected phone number
  timestamp: string;            // Connection timestamp
}
```

**Example:**
```javascript
import { useEffect } from 'react';
import { toast } from 'sonner';

function WhatsAppStatus({ instanceId }) {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const socket = useSocket();

  useEffect(() => {
    const handleConnected = (data: WhatsAppConnectedEvent) => {
      if (data.instanceId === instanceId) {
        setStatus('connected');
        toast.success(`WhatsApp connected: ${data.phoneNumber}`);

        // Redirect or update UI
        // navigate('/dashboard');
      }
    };

    socket?.on('whatsapp:connected', handleConnected);

    return () => {
      socket?.off('whatsapp:connected', handleConnected);
    };
  }, [socket, instanceId]);

  return (
    <div className={`status-indicator ${status}`}>
      {status === 'connected' && '🟢 Connected'}
      {status === 'connecting' && '🟡 Connecting...'}
      {status === 'disconnected' && '🔴 Disconnected'}
    </div>
  );
}
```

**UI Actions:**
- Show success notification
- Update status indicator
- Redirect to dashboard
- Enable message sending
- Refresh instance list

---

### `whatsapp:disconnected`

Instance disconnected from WhatsApp.

**When emitted:**
- Manual disconnection
- WhatsApp logout
- Session expired
- Connection lost

**Payload:**
```typescript
interface WhatsAppDisconnectedEvent {
  instanceId: string;           // Instance UUID
  reason?: string;              // Disconnect reason
  timestamp: string;            // Disconnection timestamp
}
```

**Common Reasons:**
```typescript
enum DisconnectReason {
  LOGGED_OUT = 'logged_out',        // User logged out on phone
  CONNECTION_LOST = 'connection_lost', // Network issue
  SESSION_EXPIRED = 'session_expired', // Auth expired
  MANUAL = 'manual',                // API disconnect
  ERROR = 'error'                   // Unknown error
}
```

**Example:**
```javascript
import { useEffect } from 'react';
import { toast } from 'sonner';

function WhatsAppMonitor({ instanceId }) {
  const socket = useSocket();

  useEffect(() => {
    const handleDisconnected = (data: WhatsAppDisconnectedEvent) => {
      if (data.instanceId === instanceId) {
        toast.error(`WhatsApp disconnected: ${data.reason || 'Unknown reason'}`);

        // Determine action based on reason
        if (data.reason === 'logged_out') {
          // Require re-authentication
          navigate('/whatsapp/connect');
        } else {
          // Attempt reconnection
          setTimeout(() => reconnect(instanceId), 5000);
        }
      }
    };

    socket?.on('whatsapp:disconnected', handleDisconnected);

    return () => {
      socket?.off('whatsapp:disconnected', handleDisconnected);
    };
  }, [socket, instanceId]);

  return null; // Background monitor
}
```

**UI Actions:**
- Show error notification
- Update status indicator
- Disable message sending
- Show reconnection option
- Log user out (if logged_out reason)

---

### `whatsapp:message`

New message received on WhatsApp.

**When emitted:**
- When a message is received
- After contact/conversation creation
- After message is saved to database

**Payload:**
```typescript
interface WhatsAppMessageEvent {
  conversationId: string;       // Conversation UUID
  contactId: string;            // Contact UUID
  message: {
    id: string;                 // WhatsApp message ID
    content: string;            // Message text
    contentType: 'text' | 'image' | 'audio' | 'video' | 'document';
    direction: 'incoming';
    timestamp: string;          // ISO 8601
    mediaUrl?: string;          // For media messages
  };
}
```

**Example:**
```javascript
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function MessageListener() {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleNewMessage = (data: WhatsAppMessageEvent) => {
      console.log('New message:', data);

      // Play notification sound
      new Audio('/notification.mp3').play();

      // Show toast
      toast.success('New WhatsApp message received');

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });

      // Update unread count
      queryClient.setQueryData(['unread-count'], (old: number = 0) => old + 1);
    };

    socket?.on('whatsapp:message', handleNewMessage);

    return () => {
      socket?.off('whatsapp:message', handleNewMessage);
    };
  }, [socket, queryClient]);

  return null;
}
```

**UI Actions:**
- Play notification sound
- Show toast notification
- Update conversation list
- Add message to chat view
- Update unread badge
- Trigger desktop notification (if permitted)

**Desktop Notification Example:**
```javascript
function showDesktopNotification(data: WhatsAppMessageEvent) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('New WhatsApp Message', {
      body: data.message.content,
      icon: '/whatsapp-icon.png',
      tag: data.conversationId,
    });
  }
}
```

---

## 🎯 Complete Integration Example

### React Hook for WhatsApp Events

```typescript
// hooks/useWhatsAppEvents.ts
import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseWhatsAppEventsProps {
  instanceId?: string;
  organizationId: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onMessage?: (data: WhatsAppMessageEvent) => void;
}

export function useWhatsAppEvents({
  instanceId,
  organizationId,
  onConnected,
  onDisconnected,
  onMessage,
}: UseWhatsAppEventsProps) {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    // Join organization room
    socket.emit('join-organization', organizationId);

    // QR Code
    const handleQR = (data: WhatsAppQREvent) => {
      if (!instanceId || data.instanceId === instanceId) {
        queryClient.setQueryData(['whatsapp-qr', data.instanceId], data.qr);
      }
    };

    // Pairing Code
    const handlePairingCode = (data: WhatsAppPairingCodeEvent) => {
      if (!instanceId || data.instanceId === instanceId) {
        queryClient.setQueryData(['pairing-code', data.instanceId], data);
      }
    };

    // Connected
    const handleConnected = (data: WhatsAppConnectedEvent) => {
      if (!instanceId || data.instanceId === instanceId) {
        toast.success('WhatsApp connected successfully!');
        queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
        onConnected?.();
      }
    };

    // Disconnected
    const handleDisconnected = (data: WhatsAppDisconnectedEvent) => {
      if (!instanceId || data.instanceId === instanceId) {
        toast.error(`WhatsApp disconnected: ${data.reason || 'Unknown'}`);
        queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
        onDisconnected?.();
      }
    };

    // New Message
    const handleMessage = (data: WhatsAppMessageEvent) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      onMessage?.(data);
    };

    // Register listeners
    socket.on('whatsapp:qr', handleQR);
    socket.on('whatsapp:pairing-code', handlePairingCode);
    socket.on('whatsapp:connected', handleConnected);
    socket.on('whatsapp:disconnected', handleDisconnected);
    socket.on('whatsapp:message', handleMessage);

    // Cleanup
    return () => {
      socket.off('whatsapp:qr', handleQR);
      socket.off('whatsapp:pairing-code', handlePairingCode);
      socket.off('whatsapp:connected', handleConnected);
      socket.off('whatsapp:disconnected', handleDisconnected);
      socket.off('whatsapp:message', handleMessage);
    };
  }, [socket, instanceId, organizationId, queryClient, onConnected, onDisconnected, onMessage]);
}
```

### Usage in Component

```typescript
// components/WhatsAppConnection.tsx
import { useWhatsAppEvents } from '@/hooks/useWhatsAppEvents';

function WhatsAppConnection() {
  const { organization } = useAuth();
  const [instanceId, setInstanceId] = useState<string>();

  useWhatsAppEvents({
    instanceId,
    organizationId: organization.id,
    onConnected: () => {
      console.log('Connected! Redirecting...');
      navigate('/dashboard');
    },
    onDisconnected: () => {
      console.log('Disconnected! Showing reconnect UI...');
    },
    onMessage: (data) => {
      console.log('New message:', data);
      playNotificationSound();
    },
  });

  return <div>WhatsApp Connection UI</div>;
}
```

---

## 🔧 Testing Socket Events

### Testing with Browser Console

```javascript
// Connect to Socket.IO
const socket = io('http://localhost:3000');

// Join organization
socket.emit('join-organization', 'org_123');

// Listen to all events
socket.onAny((eventName, ...args) => {
  console.log('Event:', eventName, args);
});

// Manually trigger QR
socket.on('whatsapp:qr', (data) => {
  console.log('QR:', data);
});
```

### Testing with Postman/Thunder Client

1. Create WebSocket connection
2. Connect to `ws://localhost:3000`
3. Send events:
```json
{
  "event": "join-organization",
  "data": "org_123"
}
```

---

## 📊 Event Flow Diagram

```
User Action → API Request → Backend Processing → Socket.IO Emission → Frontend Update

Example: Connect WhatsApp
1. User clicks "Connect" → POST /instances/:id/connect
2. Backend initializes Baileys → Generates QR/Code
3. Baileys emits event → Backend catches it
4. Backend emits Socket.IO → whatsapp:qr / whatsapp:pairing-code
5. Frontend receives → Updates UI with QR/Code
6. User scans/enters → WhatsApp connects
7. Baileys emits connected → Backend catches
8. Backend emits Socket.IO → whatsapp:connected
9. Frontend receives → Shows success & redirects
```

---

## 🐛 Common Issues

### Events not being received

**Check:**
1. Socket.IO connection established
2. Joined organization room
3. Event listener registered before event emission
4. No typos in event names
5. CORS configuration allows origin

**Debug:**
```javascript
socket.onAny((event, ...args) => {
  console.log('📡 Event received:', event, args);
});
```

### Multiple event handlers

**Problem:** Event fires multiple times

**Solution:** Clean up listeners
```javascript
useEffect(() => {
  const handler = (data) => console.log(data);
  socket.on('event-name', handler);

  return () => {
    socket.off('event-name', handler); // ✅ Cleanup
  };
}, [socket]);
```

---

## 📚 Additional Resources

- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [React Socket.IO Integration](https://socket.io/how-to/use-with-react)
- [TypeScript with Socket.IO](https://socket.io/docs/v4/typescript/)

---

**Last Updated:** 2025-10-02
**Version:** 1.0.0
