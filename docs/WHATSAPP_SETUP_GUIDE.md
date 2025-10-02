# WhatsApp Setup Guide - AuZap

## 🚀 Quick Start Guide

This guide will help you connect your first WhatsApp number to AuZap and start receiving messages.

---

## 📱 Prerequisites

Before you begin:

- ✅ Active WhatsApp account on your smartphone
- ✅ Stable internet connection on both phone and computer
- ✅ AuZap account with organization created
- ✅ Access to the AuZap dashboard

---

## 🎯 Method 1: Pairing Code (Recommended)

**Best for:** Quick setup, no camera needed

### Step 1: Create WhatsApp Instance

1. Navigate to **Dashboard → WhatsApp → Instances**
2. Click **"Add New Instance"**
3. Fill in the form:
   - **Instance Name**: Choose a descriptive name (e.g., "Main Support")
   - **Phone Number**: Enter your WhatsApp number with country code (e.g., `5511999887766`)
   - **Connection Method**: Select **"Pairing Code"**
4. Click **"Create Instance"**

### Step 2: Get Pairing Code

After creating the instance, you'll see:

```
🔗 Connecting to WhatsApp...

Your Pairing Code:
┌─────────────┐
│  ABCD-1234  │
└─────────────┘

Expires in: 00:59
```

**Important:** The code expires in 60 seconds. If it expires, click "Generate New Code".

### Step 3: Link on Your Phone

1. **Open WhatsApp** on your smartphone
2. Go to **Settings** (⚙️)
3. Tap **"Linked Devices"**
4. Tap **"Link a Device"**
5. Tap **"Link with phone number instead"**
6. **Enter the 8-character code** from the dashboard
7. Wait a few seconds...

### Step 4: Confirmation

You should see:

```
✅ WhatsApp Connected!

Connected Number: +55 11 99988-7766
Connected at: 2025-10-02 10:30:15

Status: 🟢 Online
```

**You're done! Your WhatsApp is now connected to AuZap.**

---

## 📸 Method 2: QR Code

**Best for:** Visual setup, easier for some users

### Step 1: Create WhatsApp Instance

1. Navigate to **Dashboard → WhatsApp → Instances**
2. Click **"Add New Instance"**
3. Fill in the form:
   - **Instance Name**: Choose a descriptive name
   - **Connection Method**: Select **"QR Code"**
4. Click **"Create Instance"**

### Step 2: Scan QR Code

After creating the instance, you'll see a QR code:

```
📱 Scan this QR Code with WhatsApp

[QR CODE IMAGE]

Refreshes every 60 seconds
Status: Waiting for scan...
```

### Step 3: Link on Your Phone

1. **Open WhatsApp** on your smartphone
2. Go to **Settings** (⚙️)
3. Tap **"Linked Devices"**
4. Tap **"Link a Device"**
5. **Point your camera** at the QR code on screen
6. Wait for the beep...

### Step 4: Confirmation

Same as Method 1 - you'll see the success message.

---

## ✅ Validating Your Connection

### Test 1: Check Instance Status

1. Go to **Dashboard → WhatsApp → Instances**
2. Find your instance in the list
3. Verify:
   - ✅ Status: **Connected** (🟢)
   - ✅ Last Connected: Recent timestamp
   - ✅ Phone Number: Matches your WhatsApp

### Test 2: Send Test Message

1. On **another phone**, send a WhatsApp message to your connected number
2. The message should say something like: "Testing AuZap"
3. In AuZap dashboard, go to **Conversations**
4. You should see:
   - New conversation created
   - Contact auto-created
   - Message displayed
   - Booking created (if enabled)

**Expected Result:**
```
🆕 New Conversation

Contact: Unknown (+55 11 98877-6655)
Last Message: "Testing AuZap"
Time: Just now
Status: 🟢 Active
```

### Test 3: Send Reply

1. Click on the conversation
2. Type a reply: "Hello! This is AuZap"
3. Click **Send**
4. Check **the other phone** - message should appear in WhatsApp

**If all 3 tests pass, your WhatsApp is fully integrated! 🎉**

---

## 👤 Adding Owner's Number

**Important:** The owner's number should NOT create contacts/bookings.

### Why Add Owner Number?

When the pet shop owner sends messages FROM the connected WhatsApp:
- ❌ **Without owner config**: Creates duplicate contacts
- ✅ **With owner config**: Messages are ignored or saved as notes

### How to Configure

#### Option 1: During Instance Creation

When creating the instance, the **phone_number** field automatically becomes the owner number.

```json
{
  "instance_name": "Main Support",
  "phone_number": "5511999887766",  // ← This is the owner
  "method": "code"
}
```

#### Option 2: Update Existing Instance

**Via API:**
```bash
curl -X PATCH https://api.auzap.com/api/whatsapp/instances/{instance_id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "5511999887766"
  }'
```

**Via Dashboard:**
1. Go to **WhatsApp → Instances**
2. Click on your instance
3. Click **"Edit"**
4. Update **"Owner Phone Number"**
5. Click **"Save"**

### Verify Owner Configuration

Send a test message **from the connected WhatsApp**:

1. Open WhatsApp on the connected phone
2. Send a message to any contact
3. Check AuZap dashboard
4. **Expected**: No new contact or booking created
5. **If created**: Owner number not configured correctly

---

## 🔧 Worker Validation

Workers process incoming messages in the background.

### Check Worker Status

#### Local Development

```bash
# Terminal should show:
📋 Starting workers...
✅ Message worker started
🟢 Workers ready
```

#### Production (Render)

1. Go to Render dashboard
2. Select your backend service
3. Click **"Logs"**
4. Search for: `"Message worker"`
5. Should see: `"Workers disabled: Redis not configured"` OR `"Message worker started"`

### Worker Behavior

**Development (with Redis):**
- Messages are queued
- Worker processes them asynchronously
- Faster, more reliable

**Production (without Redis):**
- Workers are disabled
- Messages processed synchronously
- Still works, just slower

### Test Worker

1. Send WhatsApp message to connected number
2. Check backend logs:

```
[INFO] Incoming message received
[INFO] Contact created: contact_123
[INFO] Message saved: msg_456
[INFO] Booking created: booking_789
[INFO] Socket.IO event emitted
```

**If you see all 5 logs, workers are functioning correctly! ✅**

---

## 🐛 Common Issues & Solutions

### Issue 1: Pairing Code Expired

**Symptom:** Code not working, "Invalid code" error

**Solution:**
1. Click **"Generate New Code"** in dashboard
2. Enter the new code within 60 seconds
3. Make sure no spaces or typos

---

### Issue 2: QR Code Not Appearing

**Symptom:** "Loading..." but no QR code

**Solution:**
1. Check browser console for errors (F12)
2. Verify Socket.IO connection:
   ```javascript
   // Should see in console:
   ✅ Connected to Socket.IO: abc123
   ```
3. Refresh the page
4. Try switching to Pairing Code method

---

### Issue 3: Connected but Not Receiving Messages

**Symptom:** Status shows "Connected" but messages don't appear

**Solution:**

**Check 1: Instance Status**
```bash
curl https://api.auzap.com/api/whatsapp/instances/{id}/status

# Should return:
{
  "instance": { "status": "connected" },
  "is_running": true  // ← Must be true
}
```

**Check 2: Backend Logs**
```bash
# Should show:
[INFO] Incoming message received
```

**Check 3: Database**
```sql
SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '5 minutes';
-- Should show recent messages
```

**Fix:** Restart instance
```bash
# Via API
curl -X POST https://api.auzap.com/api/whatsapp/instances/{id}/reconnect
```

---

### Issue 4: Owner Messages Creating Contacts

**Symptom:** Every message you send creates a new contact

**Solution:**

1. **Verify owner number in database:**
```sql
SELECT id, phone_number FROM whatsapp_instances WHERE id = '{instance_id}';
```

2. **Update owner number:**
```sql
UPDATE whatsapp_instances
SET phone_number = '5511999887766'
WHERE id = '{instance_id}';
```

3. **Check routing logic:**
   - Owner messages should be ignored
   - Only client messages create contacts

---

### Issue 5: Disconnects Randomly

**Symptom:** WhatsApp disconnects after a few hours/days

**Possible Causes:**
1. **Logged out on phone** - Check WhatsApp → Linked Devices
2. **Session expired** - Reconnect in dashboard
3. **Network issue** - Check backend server connection
4. **Too many reconnection attempts** - Check logs

**Solution:**

**Prevention:**
```typescript
// Backend auto-reconnects up to 5 times
MAX_RECONNECT_ATTEMPTS = 5
RECONNECT_DELAY_MS = 5000 // 5 seconds
```

**Manual Reconnect:**
1. Go to **WhatsApp → Instances**
2. Click **"Reconnect"**
3. Use same method (code or QR)

---

## 📊 Monitoring Your Integration

### Dashboard Metrics

Check these regularly:

```
📈 Instance Health

Status: 🟢 Connected
Uptime: 3 days, 12 hours
Messages Received: 1,247
Messages Sent: 892
Last Activity: 2 minutes ago
```

### Key Indicators

| Metric | Healthy | Needs Attention |
|--------|---------|-----------------|
| Status | 🟢 Connected | 🔴 Disconnected |
| Uptime | > 24 hours | < 1 hour |
| Last Activity | < 5 min | > 30 min |
| Error Rate | < 1% | > 5% |

### Enable Notifications

1. Go to **Settings → Notifications**
2. Enable:
   - ✅ WhatsApp Disconnected
   - ✅ Instance Errors
   - ✅ High Message Volume
3. Set notification channel (Email, Slack, etc.)

---

## 🎓 Advanced Setup

### Multiple Instances

You can connect multiple WhatsApp numbers:

```
Instance 1: Main Support (5511999887766)
Instance 2: Sales (5511988776655)
Instance 3: After Hours (5511977665544)
```

**Benefits:**
- Separate teams/departments
- Load balancing
- Backup in case one disconnects

**How to:**
1. Repeat the setup process for each number
2. Assign different names
3. Configure routing rules (optional)

---

### Webhook Integration

For advanced users, configure webhooks:

```bash
POST /webhook/whatsapp

# Will receive:
{
  "event": "message.received",
  "instanceId": "inst_123",
  "message": {
    "from": "5511988776655",
    "text": "Hello",
    "timestamp": "2025-10-02T10:30:00Z"
  }
}
```

**Setup:**
1. Go to **Settings → Webhooks**
2. Add your endpoint URL
3. Select events to receive
4. Save webhook secret

---

## 📝 Best Practices

### ✅ Do's

- ✅ Keep phone charged and connected to internet
- ✅ Don't log out of WhatsApp on phone
- ✅ Monitor instance status daily
- ✅ Test message flow weekly
- ✅ Configure owner number correctly
- ✅ Enable disconnect notifications

### ❌ Don'ts

- ❌ Don't share pairing codes
- ❌ Don't connect same number to multiple instances
- ❌ Don't delete WhatsApp from phone
- ❌ Don't ignore disconnect notifications
- ❌ Don't forget to backup session data

---

## 🆘 Getting Help

### Self-Help Resources

1. **Documentation**: `/docs/WHATSAPP_INTEGRATION.md`
2. **API Reference**: `/docs/API_REFERENCE.md`
3. **Troubleshooting**: See "Common Issues" above
4. **Logs**: Check backend logs for errors

### Contact Support

If you're still stuck:

**Via Dashboard:**
1. Click **"Help"** (bottom right)
2. Click **"Contact Support"**
3. Include:
   - Instance ID
   - Error message
   - Steps to reproduce
   - Screenshots (if relevant)

**Via Email:**
- support@auzap.com
- Include same information as above

**Expected Response Time:**
- Critical Issues (can't receive messages): < 2 hours
- Non-Critical Issues: < 24 hours
- Questions/Improvements: < 48 hours

---

## ✨ Success Checklist

Before considering your WhatsApp integration complete:

- [ ] Instance status: **Connected** (🟢)
- [ ] Test message received in AuZap
- [ ] Test reply sent from AuZap
- [ ] Contact auto-created correctly
- [ ] Booking auto-created (if enabled)
- [ ] Owner number configured
- [ ] Owner messages don't create contacts
- [ ] Worker processing messages
- [ ] Socket.IO events working
- [ ] Dashboard shows metrics
- [ ] Notifications enabled
- [ ] Backup/recovery plan in place

**When all items are checked, you're ready for production! 🎉**

---

## 🚀 Next Steps

After successful WhatsApp integration:

1. **Configure Campaigns** - Set up automated message campaigns
2. **Create Templates** - Design message templates for common scenarios
3. **Set Business Hours** - Configure when to auto-respond
4. **Train Your Team** - Show staff how to use the platform
5. **Analyze Metrics** - Review conversation analytics

---

**Last Updated:** 2025-10-02
**Version:** 1.0.0
**Feedback:** help@auzap.com
