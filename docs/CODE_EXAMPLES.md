# AuZap API Code Examples

Complete code examples for integrating with AuZap's WhatsApp API in various languages and frameworks.

---

## 📋 Table of Contents

- [JavaScript/TypeScript](#javascripttypescript)
- [Python](#python)
- [cURL](#curl)
- [React Integration](#react-integration)
- [Node.js Backend](#nodejs-backend)
- [Socket.IO Client](#socketio-client)

---

## JavaScript/TypeScript

### Create Instance

```typescript
// TypeScript example
interface CreateInstanceRequest {
  organization_id: string;
  instance_name: string;
  phone_number?: string;
}

interface CreateInstanceResponse {
  success: boolean;
  instance: {
    id: string;
    organization_id: string;
    instance_name: string;
    status: string;
    pairing_method: string;
  };
}

async function createWhatsAppInstance(
  data: CreateInstanceRequest
): Promise<CreateInstanceResponse> {
  const response = await fetch('https://api.auzap.com/api/whatsapp/instances', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AUZAP_TOKEN}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Usage
const instance = await createWhatsAppInstance({
  organization_id: 'org_123',
  instance_name: 'Main Support',
  phone_number: '5511999887766'
});

console.log('Instance created:', instance.instance.id);
```

---

### Connect Instance (Pairing Code)

```typescript
interface ConnectRequest {
  phone_number: string;
  method: 'code' | 'qr';
}

interface PairingCodeResponse {
  success: boolean;
  pairingCode: string;
  method: 'code';
}

async function connectWithPairingCode(
  instanceId: string,
  phoneNumber: string
): Promise<PairingCodeResponse> {
  const response = await fetch(
    `https://api.auzap.com/api/whatsapp/instances/${instanceId}/connect`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUZAP_TOKEN}`
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        method: 'code'
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to connect: ${response.statusText}`);
  }

  return response.json();
}

// Usage
const result = await connectWithPairingCode('inst_123', '5511999887766');
console.log('Pairing Code:', result.pairingCode);
console.log('Enter this code in WhatsApp within 60 seconds');
```

---

### Send Message

```typescript
interface SendMessageRequest {
  to: string;
  message: string;
}

interface SendMessageResponse {
  success: boolean;
}

async function sendWhatsAppMessage(
  instanceId: string,
  to: string,
  message: string
): Promise<SendMessageResponse> {
  const response = await fetch(
    `https://api.auzap.com/api/whatsapp/instances/${instanceId}/send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUZAP_TOKEN}`
      },
      body: JSON.stringify({ to, message })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send message: ${error.error}`);
  }

  return response.json();
}

// Usage
await sendWhatsAppMessage(
  'inst_123',
  '5511988776655',
  'Olá! Seu agendamento foi confirmado para amanhã às 14h.'
);

console.log('Message sent successfully!');
```

---

### Check Instance Status

```typescript
interface InstanceStatus {
  instance: {
    id: string;
    status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending';
    phone_number: string | null;
    messages_sent_count: number;
    messages_received_count: number;
    last_connected_at: string | null;
  };
  is_running: boolean;
}

async function getInstanceStatus(instanceId: string): Promise<InstanceStatus> {
  const response = await fetch(
    `https://api.auzap.com/api/whatsapp/instances/${instanceId}/status`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.AUZAP_TOKEN}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get status: ${response.statusText}`);
  }

  return response.json();
}

// Usage
const status = await getInstanceStatus('inst_123');
console.log('Status:', status.instance.status);
console.log('Connected:', status.is_running);
console.log('Messages sent:', status.instance.messages_sent_count);
```

---

## Python

### Create Instance

```python
import requests
from typing import Optional, Dict, Any
from dataclasses import dataclass
import os

@dataclass
class WhatsAppInstance:
    id: str
    organization_id: str
    instance_name: str
    status: str
    pairing_method: str

class AuZapClient:
    def __init__(self, api_url: str, token: str):
        self.api_url = api_url
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }

    def create_instance(
        self,
        organization_id: str,
        instance_name: str,
        phone_number: Optional[str] = None
    ) -> WhatsAppInstance:
        """Create a new WhatsApp instance."""
        data = {
            'organization_id': organization_id,
            'instance_name': instance_name
        }

        if phone_number:
            data['phone_number'] = phone_number

        response = requests.post(
            f'{self.api_url}/api/whatsapp/instances',
            headers=self.headers,
            json=data
        )

        response.raise_for_status()
        result = response.json()

        instance_data = result['instance']
        return WhatsAppInstance(**instance_data)

# Usage
client = AuZapClient(
    api_url='https://api.auzap.com',
    token=os.getenv('AUZAP_TOKEN')
)

instance = client.create_instance(
    organization_id='org_123',
    instance_name='Main Support',
    phone_number='5511999887766'
)

print(f'Instance created: {instance.id}')
```

---

### Connect Instance

```python
from typing import Literal

@dataclass
class PairingCodeResponse:
    success: bool
    pairing_code: str
    method: str

class AuZapClient:
    # ... (previous methods)

    def connect_instance(
        self,
        instance_id: str,
        method: Literal['code', 'qr'] = 'code',
        phone_number: Optional[str] = None
    ) -> Dict[str, Any]:
        """Connect WhatsApp instance with pairing code or QR."""
        data = {'method': method}

        if method == 'code' and phone_number:
            data['phone_number'] = phone_number

        response = requests.post(
            f'{self.api_url}/api/whatsapp/instances/{instance_id}/connect',
            headers=self.headers,
            json=data
        )

        response.raise_for_status()
        return response.json()

# Usage
result = client.connect_instance(
    instance_id='inst_123',
    method='code',
    phone_number='5511999887766'
)

print(f"Pairing Code: {result['pairingCode']}")
print("Enter this code in WhatsApp within 60 seconds")
```

---

### Send Message

```python
class AuZapClient:
    # ... (previous methods)

    def send_message(
        self,
        instance_id: str,
        to: str,
        message: str
    ) -> bool:
        """Send a WhatsApp message."""
        response = requests.post(
            f'{self.api_url}/api/whatsapp/instances/{instance_id}/send',
            headers=self.headers,
            json={
                'to': to,
                'message': message
            }
        )

        response.raise_for_status()
        result = response.json()
        return result['success']

# Usage
success = client.send_message(
    instance_id='inst_123',
    to='5511988776655',
    message='Olá! Seu agendamento foi confirmado para amanhã às 14h.'
)

if success:
    print('Message sent successfully!')
```

---

## cURL

### Create Instance

```bash
# Basic instance creation
curl -X POST https://api.auzap.com/api/whatsapp/instances \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUZAP_TOKEN}" \
  -d '{
    "organization_id": "org_123",
    "instance_name": "Main Support"
  }'

# With phone number
curl -X POST https://api.auzap.com/api/whatsapp/instances \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUZAP_TOKEN}" \
  -d '{
    "organization_id": "org_123",
    "instance_name": "Main Support",
    "phone_number": "5511999887766"
  }'
```

---

### Connect with Pairing Code

```bash
curl -X POST https://api.auzap.com/api/whatsapp/instances/inst_123/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUZAP_TOKEN}" \
  -d '{
    "phone_number": "5511999887766",
    "method": "code"
  }'

# Response:
# {
#   "success": true,
#   "pairingCode": "ABCD1234",
#   "method": "code"
# }
```

---

### Connect with QR Code

```bash
curl -X POST https://api.auzap.com/api/whatsapp/instances/inst_123/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUZAP_TOKEN}" \
  -d '{
    "method": "qr"
  }'

# Response:
# {
#   "success": true,
#   "method": "qr",
#   "message": "QR Code will be sent via Socket.IO when generated"
# }
```

---

### Check Status

```bash
curl -X GET https://api.auzap.com/api/whatsapp/instances/inst_123/status \
  -H "Authorization: Bearer ${AUZAP_TOKEN}"

# Response:
# {
#   "instance": {
#     "id": "inst_123",
#     "status": "connected",
#     "phone_number": "5511999887766",
#     "messages_sent_count": 1247,
#     "messages_received_count": 892,
#     "last_connected_at": "2025-10-02T10:30:00Z"
#   },
#   "is_running": true
# }
```

---

### Send Message

```bash
curl -X POST https://api.auzap.com/api/whatsapp/instances/inst_123/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUZAP_TOKEN}" \
  -d '{
    "to": "5511988776655",
    "message": "Olá! Seu agendamento foi confirmado."
  }'

# Response:
# {
#   "success": true
# }
```

---

## React Integration

### Complete React Component

```tsx
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode.react';

interface WhatsAppConnectionProps {
  organizationId: string;
  apiUrl: string;
  token: string;
}

export function WhatsAppConnection({
  organizationId,
  apiUrl,
  token
}: WhatsAppConnectionProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [instanceId, setInstanceId] = useState<string>('');
  const [method, setMethod] = useState<'code' | 'qr'>('code');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [error, setError] = useState<string>('');

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected');
      newSocket.emit('join-organization', organizationId);
    });

    newSocket.on('whatsapp:qr', ({ instanceId: id, qr }) => {
      if (id === instanceId) {
        setQrCode(qr);
      }
    });

    newSocket.on('whatsapp:pairing-code', ({ instanceId: id, code }) => {
      if (id === instanceId) {
        setPairingCode(code);
      }
    });

    newSocket.on('whatsapp:connected', ({ instanceId: id }) => {
      if (id === instanceId) {
        setStatus('connected');
      }
    });

    newSocket.on('whatsapp:disconnected', ({ instanceId: id }) => {
      if (id === instanceId) {
        setStatus('idle');
        setError('WhatsApp disconnected');
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [apiUrl, organizationId, instanceId]);

  // Create instance
  const createInstance = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/whatsapp/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organization_id: organizationId,
          instance_name: 'Main Support',
          phone_number: method === 'code' ? phoneNumber : undefined
        })
      });

      const data = await response.json();
      setInstanceId(data.instance.id);
      return data.instance.id;
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Connect instance
  const connect = async () => {
    setStatus('connecting');
    setError('');

    try {
      let id = instanceId;
      if (!id) {
        id = await createInstance();
      }

      const response = await fetch(
        `${apiUrl}/api/whatsapp/instances/${id}/connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            method,
            ...(method === 'code' && { phone_number: phoneNumber })
          })
        }
      );

      const data = await response.json();

      if (method === 'code' && data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('idle');
    }
  };

  return (
    <div className="whatsapp-connection">
      <h2>Connect WhatsApp</h2>

      {status === 'idle' && (
        <>
          <div className="method-selector">
            <label>
              <input
                type="radio"
                value="code"
                checked={method === 'code'}
                onChange={() => setMethod('code')}
              />
              Pairing Code
            </label>
            <label>
              <input
                type="radio"
                value="qr"
                checked={method === 'qr'}
                onChange={() => setMethod('qr')}
              />
              QR Code
            </label>
          </div>

          {method === 'code' && (
            <input
              type="tel"
              placeholder="Phone number (5511999887766)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          )}

          <button onClick={connect}>Connect WhatsApp</button>
        </>
      )}

      {status === 'connecting' && (
        <>
          <p>Connecting...</p>

          {method === 'code' && pairingCode && (
            <div className="pairing-code">
              <h3>Pairing Code</h3>
              <div className="code">{pairingCode}</div>
              <ol>
                <li>Open WhatsApp on your phone</li>
                <li>Go to Settings → Linked Devices</li>
                <li>Tap "Link a Device"</li>
                <li>Tap "Link with phone number instead"</li>
                <li>Enter the code above</li>
              </ol>
            </div>
          )}

          {method === 'qr' && qrCode && (
            <div className="qr-code">
              <h3>Scan QR Code</h3>
              <QRCode value={qrCode} size={256} />
              <p>Scan this code with WhatsApp</p>
            </div>
          )}
        </>
      )}

      {status === 'connected' && (
        <div className="success">
          <h3>✅ WhatsApp Connected!</h3>
          <p>You can now send and receive messages.</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Node.js Backend

### Complete Backend Service

```typescript
// whatsapp.service.ts
import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

export class WhatsAppService extends EventEmitter {
  private client: AxiosInstance;

  constructor(apiUrl: string, token: string) {
    super();
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  }

  async createInstance(
    organizationId: string,
    instanceName: string,
    phoneNumber?: string
  ) {
    const { data } = await this.client.post('/api/whatsapp/instances', {
      organization_id: organizationId,
      instance_name: instanceName,
      phone_number: phoneNumber
    });

    return data.instance;
  }

  async connectWithPairingCode(instanceId: string, phoneNumber: string) {
    const { data } = await this.client.post(
      `/api/whatsapp/instances/${instanceId}/connect`,
      {
        method: 'code',
        phone_number: phoneNumber
      }
    );

    return data;
  }

  async connectWithQR(instanceId: string) {
    const { data } = await this.client.post(
      `/api/whatsapp/instances/${instanceId}/connect`,
      {
        method: 'qr'
      }
    );

    return data;
  }

  async sendMessage(instanceId: string, to: string, message: string) {
    const { data } = await this.client.post(
      `/api/whatsapp/instances/${instanceId}/send`,
      { to, message }
    );

    return data;
  }

  async getStatus(instanceId: string) {
    const { data } = await this.client.get(
      `/api/whatsapp/instances/${instanceId}/status`
    );

    return data;
  }

  async disconnect(instanceId: string) {
    const { data } = await this.client.delete(
      `/api/whatsapp/instances/${instanceId}`
    );

    return data;
  }
}

// Usage example
import { config } from 'dotenv';
config();

const whatsapp = new WhatsAppService(
  process.env.AUZAP_API_URL!,
  process.env.AUZAP_TOKEN!
);

async function main() {
  // Create instance
  const instance = await whatsapp.createInstance(
    'org_123',
    'Main Support',
    '5511999887766'
  );

  console.log('Instance created:', instance.id);

  // Connect with pairing code
  const result = await whatsapp.connectWithPairingCode(
    instance.id,
    '5511999887766'
  );

  console.log('Pairing Code:', result.pairingCode);
  console.log('Enter this code in WhatsApp');

  // Wait for connection (in real app, use Socket.IO events)
  await new Promise(resolve => setTimeout(resolve, 30000));

  // Send message
  await whatsapp.sendMessage(
    instance.id,
    '5511988776655',
    'Hello from AuZap!'
  );

  console.log('Message sent!');
}

main().catch(console.error);
```

---

## Socket.IO Client

### Complete Socket.IO Integration

```typescript
import { io, Socket } from 'socket.io-client';

interface WhatsAppEvents {
  'whatsapp:qr': (data: { instanceId: string; qr: string; timestamp: string }) => void;
  'whatsapp:pairing-code': (data: { instanceId: string; code: string; timestamp: string }) => void;
  'whatsapp:connected': (data: { instanceId: string; phoneNumber: string; timestamp: string }) => void;
  'whatsapp:disconnected': (data: { instanceId: string; reason?: string; timestamp: string }) => void;
  'whatsapp:message': (data: { conversationId: string; contactId: string; message: any }) => void;
}

class WhatsAppSocketClient {
  private socket: Socket;
  private organizationId: string;

  constructor(apiUrl: string, organizationId: string) {
    this.organizationId = organizationId;

    this.socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO:', this.socket.id);
      this.socket.emit('join-organization', this.organizationId);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('🔌 Disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      this.socket.emit('join-organization', this.organizationId);
    });
  }

  onQR(callback: WhatsAppEvents['whatsapp:qr']) {
    this.socket.on('whatsapp:qr', callback);
  }

  onPairingCode(callback: WhatsAppEvents['whatsapp:pairing-code']) {
    this.socket.on('whatsapp:pairing-code', callback);
  }

  onConnected(callback: WhatsAppEvents['whatsapp:connected']) {
    this.socket.on('whatsapp:connected', callback);
  }

  onDisconnected(callback: WhatsAppEvents['whatsapp:disconnected']) {
    this.socket.on('whatsapp:disconnected', callback);
  }

  onMessage(callback: WhatsAppEvents['whatsapp:message']) {
    this.socket.on('whatsapp:message', callback);
  }

  disconnect() {
    this.socket.close();
  }
}

// Usage
const client = new WhatsAppSocketClient(
  'https://api.auzap.com',
  'org_123'
);

client.onQR(({ instanceId, qr, timestamp }) => {
  console.log('QR Code received for', instanceId);
  // Display QR code to user
});

client.onPairingCode(({ instanceId, code, timestamp }) => {
  console.log('Pairing Code:', code);
  // Display code to user
});

client.onConnected(({ instanceId, phoneNumber, timestamp }) => {
  console.log('WhatsApp connected!', phoneNumber);
  // Update UI, redirect, etc.
});

client.onDisconnected(({ instanceId, reason, timestamp }) => {
  console.error('WhatsApp disconnected:', reason);
  // Show error, attempt reconnection, etc.
});

client.onMessage(({ conversationId, contactId, message }) => {
  console.log('New message:', message.content);
  // Update conversation list, show notification, etc.
});

// Clean up when done
// client.disconnect();
```

---

**Last Updated:** 2025-10-02
**Version:** 1.0.0
