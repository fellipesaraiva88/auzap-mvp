/**
 * TypeScript Types for New Vertical Services
 * Created: October 2025
 *
 * This file contains all type definitions for:
 * 1. Training Plans Service
 * 2. Daycare/Hotel Service
 * 3. BIPE Protocol Service
 * 4. Knowledge Base Service
 */

// ============================================================================
// 1. TRAINING PLANS TYPES
// ============================================================================

/**
 * Training plan types based on complexity and duration
 */
export type PlanType = 'basico' | 'intermediario' | 'avancado' | 'personalizado';

/**
 * Training plan status lifecycle
 */
export type TrainingStatus = 'ativo' | 'concluido' | 'cancelado' | 'pausado';

/**
 * Training session status
 */
export type SessionStatus = 'agendada' | 'concluida' | 'cancelada' | 'remarcada';

/**
 * Complete training plan entity
 */
export interface TrainingPlan {
  id: string;
  organizationId: string;
  contactId: string;
  petId: string;
  planType: PlanType;
  description: string;
  goals: string[];
  totalSessions: number;
  completedSessions: number;
  status: TrainingStatus;
  startDate: string;
  endDate?: string;
  priceCents: number;
  notes?: string;
  createdBy: 'ai' | 'human' | 'customer';
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual training session within a plan
 */
export interface TrainingSession {
  id: string;
  organizationId: string;
  trainingPlanId: string;
  sessionNumber: number;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  trainerNotes?: string;
  skillsWorked?: string[];
  petBehaviorRating?: number; // 1-5 scale
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for creating new training plan
 */
export interface CreateTrainingPlanRequest {
  contactId: string;
  petId: string;
  planType: PlanType;
  description: string;
  goals: string[];
  totalSessions: number;
  startDate: string;
  priceCents: number;
  notes?: string;
}

/**
 * Request payload for updating training plan
 */
export interface UpdateTrainingPlanRequest {
  description?: string;
  goals?: string[];
  status?: TrainingStatus;
  endDate?: string;
  notes?: string;
}

/**
 * Request payload for creating training session
 */
export interface CreateTrainingSessionRequest {
  trainingPlanId: string;
  sessionNumber: number;
  scheduledAt: string;
  durationMinutes: number;
}

/**
 * Request payload for updating training session
 */
export interface UpdateTrainingSessionRequest {
  scheduledAt?: string;
  status?: SessionStatus;
  trainerNotes?: string;
  skillsWorked?: string[];
  petBehaviorRating?: number;
}

// ============================================================================
// 2. DAYCARE/HOTEL TYPES
// ============================================================================

/**
 * Types of daycare/hotel stays
 */
export type StayType = 'daycare_diario' | 'hospedagem_pernoite' | 'hospedagem_estendida';

/**
 * Stay status lifecycle
 */
export type StayStatus = 'reservado' | 'em_andamento' | 'concluido' | 'cancelado';

/**
 * Feeding schedule configuration
 */
export interface FeedingSchedule {
  times: string[]; // Array of time strings like "08:00", "12:00", "18:00"
  foodType: string;
  amount: string;
  specialInstructions?: string;
}

/**
 * Activity log entry for tracking pet activities during stay
 */
export interface ActivityLog {
  timestamp: string;
  activity: string;
  notes?: string;
  staffMember?: string;
}

/**
 * Complete daycare/hotel stay entity
 */
export interface DaycareStay {
  id: string;
  organizationId: string;
  contactId: string;
  petId: string;
  stayType: StayType;
  checkInDate: string;
  checkOutDate: string;
  status: StayStatus;
  dailyRateCents: number;
  totalPriceCents: number;
  specialRequests?: string;
  medicalNotes?: string;
  roomAssignment?: string;
  feedingSchedule?: FeedingSchedule;
  activitiesLog?: ActivityLog[];
  checkInAt?: string;
  checkOutAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for creating daycare reservation
 */
export interface CreateDaycareReservationRequest {
  contactId: string;
  petId: string;
  stayType: StayType;
  checkInDate: string;
  checkOutDate: string;
  specialRequests?: string;
  medicalNotes?: string;
  feedingSchedule?: FeedingSchedule;
}

/**
 * Request payload for updating daycare stay
 */
export interface UpdateDaycareStayRequest {
  status?: StayStatus;
  roomAssignment?: string;
  feedingSchedule?: FeedingSchedule;
  medicalNotes?: string;
  specialRequests?: string;
}

/**
 * Request payload for check-in
 */
export interface CheckInRequest {
  stayId: string;
  roomAssignment?: string;
  actualCheckInTime?: string;
}

/**
 * Request payload for check-out
 */
export interface CheckOutRequest {
  stayId: string;
  actualCheckOutTime?: string;
  finalNotes?: string;
}

/**
 * Request payload for adding activity log
 */
export interface AddActivityLogRequest {
  stayId: string;
  activity: string;
  notes?: string;
  staffMember?: string;
}

// ============================================================================
// 3. BIPE PROTOCOL TYPES
// ============================================================================

/**
 * Types of emergent alerts
 */
export type AlertType =
  | 'vacina_atrasada'
  | 'vermifugo_atrasado'
  | 'comportamento_critico'
  | 'saude_urgente'
  | 'checkup_preventivo'
  | 'medicacao_vencendo';

/**
 * Severity levels for alerts
 */
export type AlertSeverity = 'baixa' | 'media' | 'alta' | 'critica';

/**
 * Vaccine status types
 */
export type VaccineStatus = 'em_dia' | 'proximo_vencimento' | 'atrasada';

/**
 * Deworming status types
 */
export type DewormingStatus = 'em_dia' | 'proximo_vencimento' | 'atrasado';

/**
 * Individual vaccine record
 */
export interface Vaccine {
  name: string;
  lastDate: string;
  nextDueDate: string;
  status: VaccineStatus;
  batchNumber?: string;
  veterinarianName?: string;
}

/**
 * Deworming record
 */
export interface Deworming {
  lastDate: string;
  nextDueDate: string;
  status: DewormingStatus;
  medication?: string;
  dosage?: string;
}

/**
 * Check-up record
 */
export interface CheckUp {
  type: string;
  lastDate: string;
  nextDueDate: string;
  findings?: string;
  veterinarianName?: string;
}

/**
 * Individual needs configuration
 */
export interface IndividualNeeds {
  allergies?: string[];
  medications?: string[];
  dietaryRestrictions?: string[];
  specialCare?: string[];
  behavioralNotes?: string;
}

/**
 * Preventive care configuration
 */
export interface PreventiveCare {
  vaccines: Vaccine[];
  deworming?: Deworming;
  checkUps?: CheckUp[];
  dentalCare?: {
    lastCleaning?: string;
    nextDueDate?: string;
    notes?: string;
  };
}

/**
 * Emergent alert entity
 */
export interface EmergentAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  description: string;
  createdAt: string;
  dueDate?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
}

/**
 * Complete BIPE protocol entity
 */
export interface BipeProtocol {
  id: string;
  organizationId: string;
  petId: string;
  behavioralScore: number; // 0-100 scale
  behavioralNotes?: string;
  individualNeeds: IndividualNeeds;
  preventiveCare: PreventiveCare;
  emergentAlerts: EmergentAlert[];
  lastAssessmentDate: string;
  nextAssessmentDate?: string;
  veterinarianNotes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request payload for creating BIPE protocol
 */
export interface CreateBipeProtocolRequest {
  petId: string;
  behavioralScore: number;
  behavioralNotes?: string;
  individualNeeds: IndividualNeeds;
  preventiveCare: PreventiveCare;
  veterinarianNotes?: string;
}

/**
 * Request payload for updating BIPE protocol
 */
export interface UpdateBipeProtocolRequest {
  behavioralScore?: number;
  behavioralNotes?: string;
  individualNeeds?: IndividualNeeds;
  preventiveCare?: PreventiveCare;
  veterinarianNotes?: string;
  nextAssessmentDate?: string;
}

/**
 * Request payload for creating emergent alert
 */
export interface CreateEmergentAlertRequest {
  protocolId: string;
  type: AlertType;
  severity: AlertSeverity;
  description: string;
  dueDate?: string;
}

/**
 * Request payload for resolving emergent alert
 */
export interface ResolveEmergentAlertRequest {
  alertId: string;
  resolvedBy: string;
  resolution: string;
}

// ============================================================================
// 4. KNOWLEDGE BASE TYPES
// ============================================================================

/**
 * Categories for knowledge base entries
 */
export type KnowledgeCategory =
  | 'servicos'
  | 'precos'
  | 'horarios'
  | 'politicas'
  | 'emergencias'
  | 'geral'
  | 'produtos'
  | 'procedimentos';

/**
 * Match types for search results
 */
export type KnowledgeMatchType = 'exact' | 'partial' | 'tags' | 'similarity';

/**
 * Complete knowledge base entry entity
 */
export interface KnowledgeBaseEntry {
  id: string;
  organizationId: string;
  category: KnowledgeCategory;
  question: string;
  answer: string;
  tags: string[];
  usageCount: number;
  aiEnabled: boolean;
  priority: number; // 1-10 scale, higher = more important
  createdBy: string;
  updatedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

/**
 * Request payload for creating knowledge entry
 */
export interface CreateKnowledgeEntryRequest {
  category: KnowledgeCategory;
  question: string;
  answer: string;
  tags?: string[];
  aiEnabled?: boolean;
  priority?: number;
}

/**
 * Request payload for updating knowledge entry
 */
export interface UpdateKnowledgeEntryRequest {
  category?: KnowledgeCategory;
  question?: string;
  answer?: string;
  tags?: string[];
  aiEnabled?: boolean;
  priority?: number;
  isActive?: boolean;
}

/**
 * Knowledge base search result with relevance scoring
 */
export interface KnowledgeSearchResult {
  entry: KnowledgeBaseEntry;
  relevanceScore: number; // 0-100 scale
  matchType: KnowledgeMatchType;
  matchedTerms?: string[];
}

/**
 * Request payload for searching knowledge base
 */
export interface SearchKnowledgeRequest {
  query: string;
  category?: KnowledgeCategory;
  limit?: number;
  minRelevance?: number;
  aiEnabledOnly?: boolean;
}

/**
 * Batch search response
 */
export interface KnowledgeSearchResponse {
  results: KnowledgeSearchResult[];
  totalCount: number;
  queryTime: number; // milliseconds
}

/**
 * Knowledge base statistics
 */
export interface KnowledgeBaseStats {
  totalEntries: number;
  entriesByCategory: Record<KnowledgeCategory, number>;
  aiEnabledCount: number;
  totalUsageCount: number;
  mostUsedEntries: KnowledgeBaseEntry[];
  recentlyAdded: KnowledgeBaseEntry[];
}

// ============================================================================
// SHARED/UTILITY TYPES
// ============================================================================

/**
 * Generic pagination request
 */
export interface PaginationRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Generic pagination response
 */
export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

/**
 * Multi-tenant filter base
 */
export interface TenantFilter {
  organizationId: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for TrainingPlan
 */
export function isTrainingPlan(obj: unknown): obj is TrainingPlan {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'organizationId' in obj &&
    'planType' in obj &&
    'totalSessions' in obj
  );
}

/**
 * Type guard for DaycareStay
 */
export function isDaycareStay(obj: unknown): obj is DaycareStay {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'organizationId' in obj &&
    'stayType' in obj &&
    'checkInDate' in obj
  );
}

/**
 * Type guard for BipeProtocol
 */
export function isBipeProtocol(obj: unknown): obj is BipeProtocol {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'organizationId' in obj &&
    'petId' in obj &&
    'behavioralScore' in obj &&
    'individualNeeds' in obj &&
    'preventiveCare' in obj
  );
}

/**
 * Type guard for KnowledgeBaseEntry
 */
export function isKnowledgeBaseEntry(obj: unknown): obj is KnowledgeBaseEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'organizationId' in obj &&
    'category' in obj &&
    'question' in obj &&
    'answer' in obj
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  // Training
  TrainingPlan,
  TrainingSession,
  CreateTrainingPlanRequest,
  UpdateTrainingPlanRequest,
  CreateTrainingSessionRequest,
  UpdateTrainingSessionRequest,

  // Daycare
  DaycareStay,
  FeedingSchedule,
  ActivityLog,
  CreateDaycareReservationRequest,
  UpdateDaycareStayRequest,
  CheckInRequest,
  CheckOutRequest,
  AddActivityLogRequest,

  // BIPE
  BipeProtocol,
  IndividualNeeds,
  PreventiveCare,
  Vaccine,
  Deworming,
  CheckUp,
  EmergentAlert,
  CreateBipeProtocolRequest,
  UpdateBipeProtocolRequest,
  CreateEmergentAlertRequest,
  ResolveEmergentAlertRequest,

  // Knowledge Base
  KnowledgeBaseEntry,
  KnowledgeSearchResult,
  CreateKnowledgeEntryRequest,
  UpdateKnowledgeEntryRequest,
  SearchKnowledgeRequest,
  KnowledgeSearchResponse,
  KnowledgeBaseStats,

  // Shared
  PaginationRequest,
  PaginationResponse,
  ApiResponse,
  DateRangeFilter,
  TenantFilter,
};

export {
  // Type guards
  isTrainingPlan,
  isDaycareStay,
  isBipeProtocol,
  isKnowledgeBaseEntry,
};
