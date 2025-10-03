import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';

/**
 * Manual type definition for pet_health_protocol
 * TODO: Regenerate database.types.ts after running migration
 */
export interface PetHealthProtocol {
  id: string;
  organization_id: string;
  pet_id: string;
  behavioral_score: number | null;
  behavioral_notes: string | null;
  individual_needs: any;
  preventive_care: any;
  emergent_alerts: any[];
  last_assessment_date: string;
  next_assessment_date: string | null;
  veterinarian_notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Individual Needs Structure
 */
export interface IndividualNeeds {
  allergies?: string[];
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
  }>;
  dietary_restrictions?: string[];
  behavioral_preferences?: string[];
  special_care?: string[];
}

/**
 * Preventive Care Structure
 */
export interface PreventiveCare {
  vaccinations?: Array<{
    name: string;
    date: string;
    nextDue: string;
    veterinarian?: string;
    batchNumber?: string;
  }>;
  deworming?: Array<{
    product: string;
    date: string;
    nextDue: string;
    weight_kg?: number;
  }>;
  checkups?: Array<{
    type: string;
    date: string;
    findings?: string;
    veterinarian?: string;
    nextScheduled?: string;
  }>;
  dental_care?: Array<{
    date: string;
    procedure: string;
    notes?: string;
  }>;
}

/**
 * Emergent Alert Structure
 */
export interface EmergentAlert {
  id: string;
  type: 'vaccine_overdue' | 'deworming_overdue' | 'checkup_overdue' | 'behavioral_critical' | 'medication_expiring' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  createdAt: string;
  resolvedAt?: string;
  resolved: boolean;
  actionRequired?: string;
}

/**
 * Create Protocol Data
 */
export interface CreateProtocolData {
  organizationId: string;
  petId: string;
  behavioralScore?: number;
  behavioralNotes?: string;
  individualNeeds?: IndividualNeeds;
  preventiveCare?: PreventiveCare;
  veterinarianNotes?: string;
  lastAssessmentDate?: string;
  nextAssessmentDate?: string;
}

/**
 * PetHealthService - BIPE Health Protocol for Pets
 *
 * BIPE = Behavioral, Individual, Preventive, Emergent
 *
 * Comprehensive health tracking system that monitors:
 * - Behavioral scores and patterns
 * - Individual needs (allergies, medications, preferences)
 * - Preventive care (vaccines, deworming, checkups)
 * - Emergent alerts (overdue care, critical conditions)
 */
export class PetHealthService {
  /**
   * Create initial BIPE health protocol for a pet
   */
  async createProtocol(data: CreateProtocolData): Promise<PetHealthProtocol> {
    try {
      // Validate behavioral score if provided
      if (data.behavioralScore !== undefined) {
        this.validateScore(data.behavioralScore);
      }

      const protocolData = {
        organization_id: data.organizationId,
        pet_id: data.petId,
        behavioral_score: data.behavioralScore || null,
        behavioral_notes: data.behavioralNotes || null,
        individual_needs: data.individualNeeds || {},
        preventive_care: data.preventiveCare || {},
        emergent_alerts: [],
        veterinarian_notes: data.veterinarianNotes || null,
        last_assessment_date: data.lastAssessmentDate || new Date().toISOString(),
        next_assessment_date: data.nextAssessmentDate || this.calculateNextAssessment()
      };

      const { data: protocol, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .insert(protocolData)
        .select()
        .single();

      if (error || !protocol) {
        throw error || new Error('Failed to create pet health protocol');
      }

      logger.info({
        petId: data.petId,
        protocolId: protocol.id
      }, 'Pet health protocol created');

      // Generate initial alerts if needed
      await this.generateAutomaticAlerts(protocol.id, data.organizationId);

      return protocol as PetHealthProtocol;
    } catch (error) {
      logger.error({ error, data }, 'Error creating pet health protocol');
      throw error;
    }
  }

  /**
   * Get health protocol for a pet
   */
  async getProtocol(petId: string): Promise<PetHealthProtocol | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .select('*, pet:pets(name, species, breed)')
        .eq('pet_id', petId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No protocol found
          return null;
        }
        throw error;
      }

      return data as any;
    } catch (error) {
      logger.error({ error, petId }, 'Error getting pet health protocol');
      throw error;
    }
  }

  /**
   * Update behavioral score
   */
  async updateBehavioralScore(
    petId: string,
    score: number,
    notes?: string
  ): Promise<PetHealthProtocol | null> {
    try {
      this.validateScore(score);

      const protocol = await this.getProtocol(petId);
      if (!protocol) {
        throw new Error('Pet health protocol not found for pet');
      }

      const updateData = {
        behavioral_score: score,
        behavioral_notes: notes || protocol.behavioral_notes
      };

      const { data, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .update(updateData)
        .eq('id', protocol.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({
        petId,
        score,
        protocolId: protocol.id
      }, 'Behavioral score updated');

      // Check if critical score - generate alert
      if (score < 50) {
        await this.addEmergentAlert(petId, {
          type: 'behavioral_critical',
          severity: 'high',
          title: 'Critical Behavioral Score',
          description: `Behavioral score dropped to ${score}. Immediate assessment recommended.`,
          actionRequired: 'Schedule behavioral consultation'
        });
      }

      return data as PetHealthProtocol;
    } catch (error) {
      logger.error({ error, petId, score }, 'Error updating behavioral score');
      throw error;
    }
  }

  /**
   * Update individual needs
   */
  async updateIndividualNeeds(
    petId: string,
    needs: Partial<IndividualNeeds>
  ): Promise<PetHealthProtocol | null> {
    try {
      const protocol = await this.getProtocol(petId);
      if (!protocol) {
        throw new Error('Pet health protocol not found for pet');
      }

      const currentNeeds = (protocol.individual_needs as IndividualNeeds) || {};
      const mergedNeeds: IndividualNeeds = {
        ...currentNeeds,
        ...needs
      };

      const { data, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .update({
          individual_needs: mergedNeeds
        })
        .eq('id', protocol.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({
        petId,
        protocolId: protocol.id
      }, 'Individual needs updated');

      return data as PetHealthProtocol;
    } catch (error) {
      logger.error({ error, petId }, 'Error updating individual needs');
      throw error;
    }
  }

  /**
   * Update preventive care
   */
  async updatePreventiveCare(
    petId: string,
    care: Partial<PreventiveCare>
  ): Promise<PetHealthProtocol | null> {
    try {
      const protocol = await this.getProtocol(petId);
      if (!protocol) {
        throw new Error('Pet health protocol not found for pet');
      }

      const currentCare = (protocol.preventive_care as PreventiveCare) || {};

      // Merge arrays properly
      const mergedCare: PreventiveCare = {
        vaccinations: care.vaccinations || currentCare.vaccinations || [],
        deworming: care.deworming || currentCare.deworming || [],
        checkups: care.checkups || currentCare.checkups || [],
        dental_care: care.dental_care || currentCare.dental_care || []
      };

      const { data, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .update({
          preventive_care: mergedCare
        })
        .eq('id', protocol.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({
        petId,
        protocolId: protocol.id
      }, 'Preventive care updated');

      // Generate alerts after update
      await this.generateAutomaticAlerts(protocol.id, protocol.organization_id);

      return data as PetHealthProtocol;
    } catch (error) {
      logger.error({ error, petId }, 'Error updating preventive care');
      throw error;
    }
  }

  /**
   * Add emergent alert
   */
  async addEmergentAlert(
    petId: string,
    alert: Omit<EmergentAlert, 'id' | 'createdAt' | 'resolved' | 'resolvedAt'>
  ): Promise<PetHealthProtocol | null> {
    try {
      const protocol = await this.getProtocol(petId);
      if (!protocol) {
        throw new Error('Pet health protocol not found for pet');
      }

      const currentAlerts = (protocol.emergent_alerts as EmergentAlert[]) || [];

      const newAlert: EmergentAlert = {
        ...alert,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        resolved: false
      };

      currentAlerts.push(newAlert);

      const { data, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .update({
          emergent_alerts: currentAlerts
        })
        .eq('id', protocol.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({
        petId,
        alertId: newAlert.id,
        alertType: alert.type,
        severity: alert.severity
      }, 'Emergent alert added');

      return data as PetHealthProtocol;
    } catch (error) {
      logger.error({ error, petId }, 'Error adding emergent alert');
      throw error;
    }
  }

  /**
   * Resolve emergent alert
   */
  async resolveEmergentAlert(
    petId: string,
    alertId: string
  ): Promise<PetHealthProtocol | null> {
    try {
      const protocol = await this.getProtocol(petId);
      if (!protocol) {
        throw new Error('Pet health protocol not found for pet');
      }

      const alerts = (protocol.emergent_alerts as EmergentAlert[]) || [];
      const updatedAlerts = alerts.map(alert => {
        if (alert.id === alertId) {
          return {
            ...alert,
            resolved: true,
            resolvedAt: new Date().toISOString()
          };
        }
        return alert;
      });

      const { data, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .update({
          emergent_alerts: updatedAlerts
        })
        .eq('id', protocol.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({
        petId,
        alertId
      }, 'Emergent alert resolved');

      return data as PetHealthProtocol;
    } catch (error) {
      logger.error({ error, petId, alertId }, 'Error resolving emergent alert');
      throw error;
    }
  }

  /**
   * Get active alerts for all pets in organization
   */
  async getActiveAlerts(organizationId: string): Promise<Array<{
    protocol: PetHealthProtocol;
    alerts: EmergentAlert[];
  }>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .select('*, pet:pets(name, species, breed)')
        .eq('organization_id', organizationId);

      if (error) {
        throw error;
      }

      const results = (data as any[])
        .map(protocol => {
          const alerts = (protocol.emergent_alerts as EmergentAlert[]) || [];
          const activeAlerts = alerts.filter(alert => !alert.resolved);

          return {
            protocol,
            alerts: activeAlerts
          };
        })
        .filter(item => item.alerts.length > 0);

      logger.info({
        organizationId,
        totalAlerts: results.reduce((sum, item) => sum + item.alerts.length, 0)
      }, 'Active alerts retrieved');

      return results;
    } catch (error) {
      logger.error({ error, organizationId }, 'Error getting active alerts');
      throw error;
    }
  }

  /**
   * Schedule next assessment
   */
  async scheduleAssessment(
    petId: string,
    date: string
  ): Promise<PetHealthProtocol | null> {
    try {
      const protocol = await this.getProtocol(petId);
      if (!protocol) {
        throw new Error('Pet health protocol not found for pet');
      }

      const { data, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .update({
          next_assessment_date: date
        })
        .eq('id', protocol.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info({
        petId,
        nextAssessment: date
      }, 'Assessment scheduled');

      return data as PetHealthProtocol;
    } catch (error) {
      logger.error({ error, petId, date }, 'Error scheduling assessment');
      throw error;
    }
  }

  /**
   * Get protocol history (all records for pet)
   */
  async getProtocolHistory(petId: string): Promise<PetHealthProtocol[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('pet_health_protocol')
        .select('*')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data as PetHealthProtocol[]) || [];
    } catch (error) {
      logger.error({ error, petId }, 'Error getting protocol history');
      throw error;
    }
  }

  /**
   * Generate comprehensive health report
   */
  async generateHealthReport(petId: string): Promise<{
    protocol: PetHealthProtocol;
    summary: {
      overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      activeAlertsCount: number;
      behavioralStatus: string;
      preventiveCareStatus: string;
      recommendations: string[];
    };
  }> {
    try {
      const protocol = await this.getProtocol(petId);
      if (!protocol) {
        throw new Error('Pet health protocol not found for pet');
      }

      const alerts = (protocol.emergent_alerts as EmergentAlert[]) || [];
      const activeAlerts = alerts.filter(alert => !alert.resolved);

      // Calculate overall health
      let overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'good';
      const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
      const highAlerts = activeAlerts.filter(a => a.severity === 'high');

      if (criticalAlerts.length > 0 || (protocol.behavioral_score !== null && protocol.behavioral_score < 30)) {
        overallHealth = 'critical';
      } else if (highAlerts.length > 0 || (protocol.behavioral_score !== null && protocol.behavioral_score < 50)) {
        overallHealth = 'poor';
      } else if (activeAlerts.length > 2 || (protocol.behavioral_score !== null && protocol.behavioral_score < 70)) {
        overallHealth = 'fair';
      } else if (activeAlerts.length === 0 && (protocol.behavioral_score === null || protocol.behavioral_score >= 85)) {
        overallHealth = 'excellent';
      }

      // Behavioral status
      let behavioralStatus = 'Not assessed';
      if (protocol.behavioral_score !== null) {
        if (protocol.behavioral_score >= 80) behavioralStatus = 'Excellent';
        else if (protocol.behavioral_score >= 60) behavioralStatus = 'Good';
        else if (protocol.behavioral_score >= 40) behavioralStatus = 'Fair';
        else behavioralStatus = 'Needs attention';
      }

      // Preventive care status
      const preventiveCare = protocol.preventive_care as PreventiveCare;
      const hasRecentVaccine = preventiveCare.vaccinations && preventiveCare.vaccinations.length > 0;
      const hasRecentDeworming = preventiveCare.deworming && preventiveCare.deworming.length > 0;
      const hasRecentCheckup = preventiveCare.checkups && preventiveCare.checkups.length > 0;

      let preventiveCareStatus = 'Complete';
      if (!hasRecentVaccine || !hasRecentDeworming || !hasRecentCheckup) {
        preventiveCareStatus = 'Incomplete';
      }

      // Recommendations
      const recommendations: string[] = [];

      if (activeAlerts.length > 0) {
        recommendations.push(`Address ${activeAlerts.length} active health alert(s)`);
      }

      if (protocol.behavioral_score !== null && protocol.behavioral_score < 60) {
        recommendations.push('Consider behavioral consultation');
      }

      if (!hasRecentCheckup) {
        recommendations.push('Schedule routine checkup');
      }

      if (protocol.next_assessment_date && new Date(protocol.next_assessment_date) < new Date()) {
        recommendations.push('Assessment overdue - schedule immediately');
      }

      if (recommendations.length === 0) {
        recommendations.push('Maintain current care routine');
      }

      logger.info({
        petId,
        overallHealth,
        activeAlerts: activeAlerts.length
      }, 'Health report generated');

      return {
        protocol,
        summary: {
          overallHealth,
          activeAlertsCount: activeAlerts.length,
          behavioralStatus,
          preventiveCareStatus,
          recommendations
        }
      };
    } catch (error) {
      logger.error({ error, petId }, 'Error generating health report');
      throw error;
    }
  }

  /**
   * Generate automatic alerts based on preventive care data
   */
  private async generateAutomaticAlerts(
    protocolId: string,
    organizationId: string
  ): Promise<void> {
    try {
      const { data: protocol } = await supabaseAdmin
        .from('pet_health_protocol')
        .select('*')
        .eq('id', protocolId)
        .single();

      if (!protocol) return;

      const preventiveCare = protocol.preventive_care as PreventiveCare;
      const currentAlerts = (protocol.emergent_alerts as EmergentAlert[]) || [];
      const newAlerts: EmergentAlert[] = [];
      const now = new Date();

      // Check vaccinations
      if (preventiveCare.vaccinations) {
        for (const vaccine of preventiveCare.vaccinations) {
          const nextDue = new Date(vaccine.nextDue);
          const daysDiff = Math.floor((now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff > 30) {
            newAlerts.push({
              id: crypto.randomUUID(),
              type: 'vaccine_overdue',
              severity: daysDiff > 90 ? 'critical' : 'high',
              title: `${vaccine.name} Vaccine Overdue`,
              description: `Vaccine is ${daysDiff} days overdue. Immediate scheduling required.`,
              actionRequired: `Schedule ${vaccine.name} vaccination`,
              createdAt: new Date().toISOString(),
              resolved: false
            });
          }
        }
      }

      // Check deworming
      if (preventiveCare.deworming) {
        for (const deworming of preventiveCare.deworming) {
          const nextDue = new Date(deworming.nextDue);
          const daysDiff = Math.floor((now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff > 90) {
            newAlerts.push({
              id: crypto.randomUUID(),
              type: 'deworming_overdue',
              severity: daysDiff > 180 ? 'high' : 'medium',
              title: 'Deworming Overdue',
              description: `Deworming is ${daysDiff} days overdue.`,
              actionRequired: 'Schedule deworming treatment',
              createdAt: new Date().toISOString(),
              resolved: false
            });
          }
        }
      }

      // Check checkups
      if (preventiveCare.checkups && preventiveCare.checkups.length > 0) {
        const lastCheckup = preventiveCare.checkups[preventiveCare.checkups.length - 1];
        const checkupDate = new Date(lastCheckup.date);
        const daysSinceCheckup = Math.floor((now.getTime() - checkupDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceCheckup > 180) {
          newAlerts.push({
            id: crypto.randomUUID(),
            type: 'checkup_overdue',
            severity: daysSinceCheckup > 365 ? 'high' : 'medium',
            title: 'Preventive Checkup Overdue',
            description: `Last checkup was ${daysSinceCheckup} days ago.`,
            actionRequired: 'Schedule routine checkup',
            createdAt: new Date().toISOString(),
            resolved: false
          });
        }
      } else {
        // No checkups on record
        newAlerts.push({
          id: crypto.randomUUID(),
          type: 'checkup_overdue',
          severity: 'medium',
          title: 'No Checkup Records',
          description: 'No preventive checkups on record.',
          actionRequired: 'Schedule initial checkup',
          createdAt: new Date().toISOString(),
          resolved: false
        });
      }

      // Only add alerts that don't already exist
      const existingAlertTypes = new Set(currentAlerts.map(a => `${a.type}_${a.title}`));
      const uniqueNewAlerts = newAlerts.filter(
        alert => !existingAlertTypes.has(`${alert.type}_${alert.title}`)
      );

      if (uniqueNewAlerts.length > 0) {
        const allAlerts = [...currentAlerts, ...uniqueNewAlerts];

        await supabaseAdmin
          .from('pet_health_protocol')
          .update({
            emergent_alerts: allAlerts
          })
          .eq('id', protocolId);

        logger.info({
          protocolId,
          newAlertsCount: uniqueNewAlerts.length
        }, 'Automatic alerts generated');
      }
    } catch (error) {
      logger.error({ error, protocolId }, 'Error generating automatic alerts');
      // Don't throw - this is a background task
    }
  }

  /**
   * Validate behavioral score (0-100)
   */
  private validateScore(score: number): void {
    if (score < 0 || score > 100) {
      throw new Error('Behavioral score must be between 0 and 100');
    }
  }

  /**
   * Calculate next assessment date (default: 6 months from now)
   */
  private calculateNextAssessment(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    return date.toISOString();
  }
}

export const petHealthService = new PetHealthService();
