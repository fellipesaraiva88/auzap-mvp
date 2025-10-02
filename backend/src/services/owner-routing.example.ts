/**
 * Example of how to use OwnerDetectionService in WhatsApp message routing
 */

import { OwnerDetectionService } from './owner-detection.service';
import { BaileysService } from './baileys.service';

export class MessageRoutingExample {
  /**
   * Route incoming WhatsApp message based on sender type
   */
  static async routeIncomingMessage(
    organizationId: string,
    fromPhone: string,
    message: any,
    baileysService: BaileysService
  ) {
    try {
      // Check if sender is an owner
      const isOwner = await OwnerDetectionService.isOwnerNumber(
        organizationId,
        fromPhone
      );

      if (isOwner) {
        // Get owner details
        const ownerInfo = await OwnerDetectionService.getOwnerInfo(
          organizationId,
          fromPhone
        );

        console.log(`Message from owner: ${ownerInfo?.ownerName} (${ownerInfo?.role})`);

        // Route to owner handler
        await this.handleOwnerMessage(
          organizationId,
          ownerInfo!,
          message,
          baileysService
        );
      } else {
        // Route to client handler
        console.log(`Message from client: ${fromPhone}`);
        await this.handleClientMessage(
          organizationId,
          fromPhone,
          message,
          baileysService
        );
      }
    } catch (error) {
      console.error('Error routing message:', error);
    }
  }

  /**
   * Handle message from owner
   */
  static async handleOwnerMessage(
    organizationId: string,
    ownerInfo: any,
    message: any,
    baileysService: BaileysService
  ) {
    // Owner-specific logic
    console.log(`Processing owner message from ${ownerInfo.ownerName}`);

    // Example: Forward to specific client or handle admin commands
    if (message.text?.startsWith('/')) {
      // Handle admin commands
      await this.processAdminCommand(
        organizationId,
        ownerInfo,
        message,
        baileysService
      );
    } else {
      // Forward to intended recipient or last active conversation
      await this.forwardOwnerMessageToClient(
        organizationId,
        ownerInfo,
        message,
        baileysService
      );
    }
  }

  /**
   * Handle message from client
   */
  static async handleClientMessage(
    organizationId: string,
    fromPhone: string,
    message: any,
    baileysService: BaileysService
  ) {
    // Client-specific logic
    console.log(`Processing client message from ${fromPhone}`);

    // Get all active owners who should be notified
    const owners = await OwnerDetectionService.getOrganizationOwners(organizationId);

    // Notify owners with notifications enabled
    for (const owner of owners) {
      if (owner.notificationsEnabled) {
        await this.notifyOwnerOfClientMessage(
          owner,
          fromPhone,
          message,
          baileysService
        );
      }
    }

    // Process with AI or automated response
    // ... existing client handling logic
  }

  /**
   * Process admin commands from owners
   */
  static async processAdminCommand(
    organizationId: string,
    ownerInfo: any,
    message: any,
    baileysService: BaileysService
  ) {
    const command = message.text?.toLowerCase();

    switch (true) {
      case command === '/status':
        // Send system status
        await baileysService.sendMessage(
          ownerInfo.phoneNumber,
          'System is operational ✅'
        );
        break;

      case command === '/owners':
        // List all owners
        const owners = await OwnerDetectionService.getOrganizationOwners(organizationId);
        const ownerList = owners.map(o =>
          `• ${o.ownerName} (${o.role}) - ${o.isActive ? '✅' : '❌'}`
        ).join('\\n');
        await baileysService.sendMessage(
          ownerInfo.phoneNumber,
          `Organization Owners:\\n${ownerList}`
        );
        break;

      case command?.startsWith('/addowner'):
        // Add new owner (only for 'owner' role)
        if (ownerInfo.role === 'owner') {
          // Parse command: /addowner 5511999999999 Name role
          const parts = message.text.split(' ');
          if (parts.length >= 3) {
            const phone = parts[1];
            const name = parts[2];
            const role = parts[3] || 'manager';

            const newOwner = await OwnerDetectionService.addOwnerNumber(
              organizationId,
              phone,
              name,
              role as any
            );

            if (newOwner) {
              await baileysService.sendMessage(
                ownerInfo.phoneNumber,
                `✅ Owner added: ${name} (${role})`
              );
            } else {
              await baileysService.sendMessage(
                ownerInfo.phoneNumber,
                `❌ Failed to add owner`
              );
            }
          }
        } else {
          await baileysService.sendMessage(
            ownerInfo.phoneNumber,
            `❌ Only owners can add new owners`
          );
        }
        break;

      case command === '/help':
        // Send help message
        const helpText = `
📋 *Owner Commands*

/status - System status
/owners - List all owners
/addowner [phone] [name] [role] - Add new owner (owner only)
/notifications on/off - Toggle notifications
/help - Show this message
        `.trim();

        await baileysService.sendMessage(
          ownerInfo.phoneNumber,
          helpText
        );
        break;

      case command?.startsWith('/notifications'):
        // Toggle notifications
        const enable = command.includes('on');
        await OwnerDetectionService.updateOwnerStatus(
          organizationId,
          ownerInfo.phoneNumber,
          { notificationsEnabled: enable }
        );

        await baileysService.sendMessage(
          ownerInfo.phoneNumber,
          `Notifications ${enable ? 'enabled ✅' : 'disabled ❌'}`
        );
        break;

      default:
        // Unknown command
        await baileysService.sendMessage(
          ownerInfo.phoneNumber,
          `Unknown command. Type /help for available commands.`
        );
    }
  }

  /**
   * Forward owner message to client
   */
  static async forwardOwnerMessageToClient(
    organizationId: string,
    ownerInfo: any,
    message: any,
    baileysService: BaileysService
  ) {
    // Implementation depends on conversation tracking
    // This is a simplified example
    console.log(`Forwarding message from owner ${ownerInfo.ownerName} to client`);

    // Get last active client conversation
    // ... implementation needed based on conversation service
  }

  /**
   * Notify owner of client message
   */
  static async notifyOwnerOfClientMessage(
    owner: any,
    clientPhone: string,
    message: any,
    baileysService: BaileysService
  ) {
    const notification = `
📨 *New Client Message*
From: ${clientPhone}
Message: ${message.text || '[Media message]'}
    `.trim();

    await baileysService.sendMessage(owner.phoneNumber, notification);
  }
}

// Usage in WhatsApp handler:
/*
// In your WhatsApp message handler
async function handleIncomingMessage(message: any, organizationId: string) {
  const fromPhone = message.key.remoteJid.replace('@s.whatsapp.net', '');

  // Route based on sender type
  await MessageRoutingExample.routeIncomingMessage(
    organizationId,
    fromPhone,
    message,
    baileysService
  );
}
*/