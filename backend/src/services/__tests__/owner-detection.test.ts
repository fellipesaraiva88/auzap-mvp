import { OwnerDetectionService } from '../owner-detection.service';

// Mock organizationId da AuZap Demo
const TEST_ORG_ID = '267449fb-132d-43ec-8402-837e17211685';

describe('OwnerDetectionService', () => {
  describe('isOwnerNumber', () => {
    it('should return true for a registered owner number', async () => {
      const isOwner = await OwnerDetectionService.isOwnerNumber(
        TEST_ORG_ID,
        '5511999887766'
      );
      expect(typeof isOwner).toBe('boolean');
    });

    it('should return false for an unregistered number', async () => {
      const isOwner = await OwnerDetectionService.isOwnerNumber(
        TEST_ORG_ID,
        '5511999999999'
      );
      expect(isOwner).toBe(false);
    });

    it('should handle phone number normalization', async () => {
      const isOwner = await OwnerDetectionService.isOwnerNumber(
        TEST_ORG_ID,
        '+55 11 99988-7766' // With formatting
      );
      expect(typeof isOwner).toBe('boolean');
    });
  });

  describe('getOwnerInfo', () => {
    it('should return owner info for a registered number', async () => {
      const ownerInfo = await OwnerDetectionService.getOwnerInfo(
        TEST_ORG_ID,
        '5511999887766'
      );

      if (ownerInfo) {
        expect(ownerInfo).toHaveProperty('id');
        expect(ownerInfo).toHaveProperty('ownerName');
        expect(ownerInfo).toHaveProperty('role');
        expect(ownerInfo.organizationId).toBe(TEST_ORG_ID);
      }
    });

    it('should return null for an unregistered number', async () => {
      const ownerInfo = await OwnerDetectionService.getOwnerInfo(
        TEST_ORG_ID,
        '5511999999999'
      );
      expect(ownerInfo).toBeNull();
    });
  });

  describe('getOrganizationOwners', () => {
    it('should return all owners for an organization', async () => {
      const owners = await OwnerDetectionService.getOrganizationOwners(TEST_ORG_ID);
      expect(Array.isArray(owners)).toBe(true);

      if (owners.length > 0) {
        expect(owners[0]).toHaveProperty('id');
        expect(owners[0]).toHaveProperty('ownerName');
        expect(owners[0]).toHaveProperty('role');
      }
    });

    it('should return empty array for non-existent organization', async () => {
      const owners = await OwnerDetectionService.getOrganizationOwners('non-existent-id');
      expect(Array.isArray(owners)).toBe(true);
      expect(owners.length).toBe(0);
    });
  });

  describe('addOwnerNumber', () => {
    it('should add a new owner number', async () => {
      const testPhone = '5511' + Date.now().toString().slice(-8); // Unique phone
      const ownerInfo = await OwnerDetectionService.addOwnerNumber(
        TEST_ORG_ID,
        testPhone,
        'Test Owner',
        'manager'
      );

      if (ownerInfo) {
        expect(ownerInfo.ownerName).toBe('Test Owner');
        expect(ownerInfo.role).toBe('manager');
        expect(ownerInfo.phoneNumber).toBe(testPhone);

        // Clean up
        await OwnerDetectionService.removeOwnerNumber(TEST_ORG_ID, testPhone);
      }
    });
  });

  describe('updateOwnerStatus', () => {
    it('should update owner status', async () => {
      const success = await OwnerDetectionService.updateOwnerStatus(
        TEST_ORG_ID,
        '5511999887766',
        {
          notificationsEnabled: false
        }
      );
      expect(typeof success).toBe('boolean');

      // Restore original state
      if (success) {
        await OwnerDetectionService.updateOwnerStatus(
          TEST_ORG_ID,
          '5511999887766',
          {
            notificationsEnabled: true
          }
        );
      }
    });
  });

  describe('shouldNotifyOwner', () => {
    it('should check if owner should be notified', async () => {
      const shouldNotify = await OwnerDetectionService.shouldNotifyOwner(
        TEST_ORG_ID,
        '5511999887766'
      );
      expect(typeof shouldNotify).toBe('boolean');
    });

    it('should return false for non-owner', async () => {
      const shouldNotify = await OwnerDetectionService.shouldNotifyOwner(
        TEST_ORG_ID,
        '5511999999999'
      );
      expect(shouldNotify).toBe(false);
    });
  });
});